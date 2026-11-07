import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryRoots } from './keys'
import type { Page } from '@/lib/pagination'
import type { PartnerDashboardData, PartnerTicket, TicketChatMessage } from '@/services/partners'
import type { SavedAnswer, TrainingQuestion, VoiceProfile } from '@/services/training'
import { fetchPartnerLibrary, fetchPartnerLibraryDocument } from '@/services/ai'
import { onNotification } from '@/services/notifications'
import {
  acceptPartnerTicket,
  closePartnerTicket,
  fetchAcceptedTickets,
  fetchPartnerDashboard,
  fetchPartnerInstructions,
  fetchPartnerKnowledge,
  fetchPartnerThread,
  fetchPartnerTickets,
  sendPartnerMessage,
  updatePartnerProfile,
} from '@/services/partners'
import {
  deleteAnswer,
  listAnswers,
  nextQuestion,
  readVoice,
  rebuildVoice,
  saveAnswer,
  saveVoice,
  updateAnswer,
} from '@/services/training'

/**
 * Partner portal data: query keys + hooks. Screens use these instead of
 * hand-rolled useEffect fetches; mutations update/invalidate what they change,
 * and realtime notifications invalidate the affected lists (usePartnerRealtime).
 */
export const partnerKeys = {
  all: queryRoots.partner,
  dashboard: () => [...queryRoots.partner, 'dashboard'] as const,
  instructions: () => [...queryRoots.partner, 'instructions'] as const,
  tickets: () => [...queryRoots.partner, 'tickets'] as const,
  accepted: () => [...queryRoots.partner, 'accepted'] as const,
  thread: (id: number) => [...queryRoots.partner, 'thread', id] as const,
  knowledge: () => [...queryRoots.partner, 'knowledge'] as const,
  library: (q: string) => [...queryRoots.partner, 'library', 'list', q] as const,
  libraryDocument: (id: string) => [...queryRoots.partner, 'library', 'document', id] as const,
  answers: () => [...queryRoots.partner, 'training', 'answers'] as const,
  voice: () => [...queryRoots.partner, 'training', 'voice'] as const,
}

/** How often an open ticket chat polls for new messages (realtime also pushes). */
export const THREAD_POLL_MS = 4000
/** Saved answers are re-read this often while any is still being embedded… */
export const EMBEDDING_POLL_MS = 3000
/** …for at most this many checks, then polling stops. */
export const EMBEDDING_MAX_CHECKS = 8

export function usePartnerDashboard() {
  return useQuery({ queryKey: partnerKeys.dashboard(), queryFn: fetchPartnerDashboard })
}

export function usePartnerInstructions() {
  return useQuery({ queryKey: partnerKeys.instructions(), queryFn: fetchPartnerInstructions })
}

/** Inbox page; the key starts with partnerKeys.tickets() so invalidating that refreshes every page. */
export function usePartnerTickets(page = 1, search = '') {
  return useQuery({
    queryKey: [...partnerKeys.tickets(), { page, search }] as const,
    queryFn: () => fetchPartnerTickets({ page, search }),
    placeholderData: (previous) => previous,
  })
}

export function useAcceptedTickets(page = 1, search = '') {
  return useQuery({
    queryKey: [...partnerKeys.accepted(), { page, search }] as const,
    queryFn: () => fetchAcceptedTickets({ page, search }),
    placeholderData: (previous) => previous,
  })
}

/** Close an accepted ticket: it leaves the accepted list. */
export function useClosePartnerTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: closePartnerTicket,
    onSuccess: (ticket) => {
      client.setQueryData<Awaited<ReturnType<typeof fetchPartnerThread>>>(partnerKeys.thread(ticket.id), (thread) =>
        thread ? { ...thread, ticket } : thread,
      )
      client.setQueriesData<Page<PartnerTicket>>({ queryKey: partnerKeys.accepted() }, (page) =>
        page ? { ...page, data: page.data.filter((row) => row.id !== ticket.id) } : page,
      )
      void client.invalidateQueries({ queryKey: partnerKeys.accepted() })
      void client.invalidateQueries({ queryKey: partnerKeys.dashboard() })
    },
  })
}

export function usePartnerThread(id: number) {
  const valid = Number.isFinite(id)
  return useQuery({
    queryKey: partnerKeys.thread(valid ? id : -1),
    queryFn: () => fetchPartnerThread(id),
    enabled: valid,
    refetchInterval: THREAD_POLL_MS,
    refetchIntervalInBackground: true,
  })
}

/** Accept a ticket: it leaves the inbox and joins the accepted list. */
export function useAcceptTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: acceptPartnerTicket,
    onSuccess: (_ticket, id) => {
      client.setQueriesData<Page<PartnerTicket>>({ queryKey: partnerKeys.tickets() }, (page) =>
        page ? { ...page, data: page.data.filter((row) => row.id !== id) } : page,
      )
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: partnerKeys.tickets() })
      void client.invalidateQueries({ queryKey: partnerKeys.accepted() })
      void client.invalidateQueries({ queryKey: partnerKeys.dashboard() })
    },
  })
}

export function useSendPartnerMessage(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendPartnerMessage(id, body),
    onSuccess: (message: TicketChatMessage) => {
      client.setQueryData<Awaited<ReturnType<typeof fetchPartnerThread>>>(partnerKeys.thread(id), (thread) =>
        thread && !thread.messages.some((m) => m.id === message.id)
          ? { ...thread, messages: [...thread.messages, message] }
          : thread,
      )
      void client.invalidateQueries({ queryKey: partnerKeys.thread(id) })
    },
  })
}

export function usePartnerKnowledge() {
  return useQuery({ queryKey: partnerKeys.knowledge(), queryFn: fetchPartnerKnowledge })
}

export function usePartnerLibrary(q: string) {
  return useQuery({ queryKey: partnerKeys.library(q), queryFn: () => fetchPartnerLibrary(q) })
}

export function usePartnerLibraryDocument(id: string | null) {
  return useQuery({
    queryKey: partnerKeys.libraryDocument(id ?? ''),
    queryFn: () => fetchPartnerLibraryDocument(id ?? ''),
    enabled: id !== null,
  })
}

export function useUpdatePartnerProfile() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updatePartnerProfile,
    onSuccess: (partner) => {
      client.setQueryData<PartnerDashboardData>(partnerKeys.dashboard(), (data) => (data ? { ...data, partner } : data))
      void client.invalidateQueries({ queryKey: partnerKeys.dashboard() })
    },
  })
}

/**
 * Saved training answers. While any answer is still being embedded the list is
 * re-read every few seconds (a few checks, then it stops until the next change).
 */
export function useTrainingAnswers() {
  const query = useQuery({ queryKey: partnerKeys.answers(), queryFn: listAnswers })
  const checks = useRef(0)
  const pending = (query.data ?? []).some((answer) => answer.embedding.status === 'pending')
  const { refetch, dataUpdatedAt } = query

  useEffect(() => {
    if (!pending) {
      checks.current = 0
      return
    }
    if (checks.current >= EMBEDDING_MAX_CHECKS) return
    const timer = window.setTimeout(() => {
      checks.current += 1
      // Background refresh: a failed check just leaves the current list on screen.
      void refetch()
    }, EMBEDDING_POLL_MS)
    return () => window.clearTimeout(timer)
  }, [pending, dataUpdatedAt, refetch])

  return query
}

export function useTrainingVoice() {
  return useQuery({ queryKey: partnerKeys.voice(), queryFn: readVoice })
}

export function useTrainingActions() {
  const client = useQueryClient()
  const setAnswers = (update: (rows: Array<SavedAnswer>) => Array<SavedAnswer>) =>
    client.setQueryData<Array<SavedAnswer>>(partnerKeys.answers(), (rows) => update(rows ?? []))
  const setVoice = (voice: VoiceProfile) => client.setQueryData(partnerKeys.voice(), voice)

  return {
    /** A fresh question to answer (not cached: each call replaces the open one). */
    nextQuestion: useMutation({ mutationFn: nextQuestion }),
    save: useMutation({
      mutationFn: (input: { question: TrainingQuestion; questionText: string; answerText: string }) =>
        saveAnswer(input.question, input.questionText, input.answerText),
      onSuccess: (saved) => {
        setAnswers((rows) => [saved, ...rows.filter((a) => a.id !== saved.id)])
        client.setQueryData<VoiceProfile>(partnerKeys.voice(), (voice) =>
          voice ? { ...voice, answersCount: voice.answersCount + 1 } : voice,
        )
        void client.invalidateQueries({ queryKey: partnerKeys.voice() })
      },
    }),
    update: useMutation({
      mutationFn: (input: { id: string; text: string }) => updateAnswer(input.id, input.text),
      onSuccess: (saved) => setAnswers((rows) => rows.map((a) => (a.id === saved.id ? saved : a))),
    }),
    remove: useMutation({
      mutationFn: deleteAnswer,
      onSuccess: (_nothing, id) => {
        setAnswers((rows) => rows.filter((a) => a.id !== id))
        void client.invalidateQueries({ queryKey: partnerKeys.voice() })
      },
    }),
    saveVoice: useMutation({ mutationFn: saveVoice, onSuccess: setVoice }),
    rebuildVoice: useMutation({ mutationFn: rebuildVoice, onSuccess: setVoice }),
  }
}

/**
 * Realtime: a notification invalidates the partner lists it affects, so open
 * screens refresh without a reload. Mount once in the partner layout.
 */
export function usePartnerRealtime() {
  const client = useQueryClient()
  useEffect(
    () =>
      onNotification((notification) => {
        if (notification.type === 'ticket.created' || notification.type === 'ticket.accepted') {
          // New tickets, or one taken by another partner.
          void client.invalidateQueries({ queryKey: partnerKeys.tickets() })
          void client.invalidateQueries({ queryKey: partnerKeys.dashboard() })
        }
        const id = notification.data.ticket_id
        if (id !== undefined) void client.invalidateQueries({ queryKey: partnerKeys.thread(id) })
      }),
    [client],
  )
}
