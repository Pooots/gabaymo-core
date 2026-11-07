import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryRoots } from './keys'
import type { QueryClient } from '@tanstack/react-query'
import type { ConversationSummary, MemoryState, QuestionState  } from '@/services/ai'
import type { MemberProfile } from '@/services/memberAuth'
import type { AppNotification, NotificationFeed } from '@/services/notifications'
import type { MemberTicket, TicketChatMessage } from '@/services/tickets'
import type { TokenUsage } from '@/services/usage'
import type { MessageFeedback, ReminderInput } from '@/services/account'
import { askQuestion, clearMemory, deleteMemory, fetchConversations, fetchMemory, fetchMessages, setMemoryEnabled } from '@/services/ai'
import { readMember, refreshMember, updateMemberRegion } from '@/services/memberAuth'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  onNotification,
} from '@/services/notifications'
import { confirmMembershipPayment } from '@/services/payments'
import { fetchPublishedPlans } from '@/services/subscriptions'
import { closeMemberTicket, createMemberTicket, fetchMemberThread, fetchMemberTickets, sendMemberMessage } from '@/services/tickets'
import { fetchUsage } from '@/services/usage'
import {
  cancelSubscription,
  createReminder,
  deleteConversation,
  deleteReminder,
  fetchPayments,
  fetchReminders,
  redeemAccessKey,
  renameConversation,
  resumeSubscription,
  searchConversations,
  sendAnswerFeedback,
  setIssuanceAlerts,
  updateReminder,
} from '@/services/account'

/**
 * Member (customer) data: query keys + hooks. Components use these instead of
 * hand-rolled useEffect fetches; mutations invalidate what they change.
 */
export const memberKeys = {
  all: queryRoots.member,
  me: () => [...queryRoots.member, 'me'] as const,
  usage: () => [...queryRoots.member, 'usage'] as const,
  conversations: () => [...queryRoots.member, 'conversations'] as const,
  messages: (conversationId: string) => [...queryRoots.member, 'conversations', conversationId, 'messages'] as const,
  memory: () => [...queryRoots.member, 'memory'] as const,
  notifications: () => [...queryRoots.member, 'notifications'] as const,
  tickets: () => [...queryRoots.member, 'tickets'] as const,
  ticket: (id: number) => [...queryRoots.member, 'tickets', id] as const,
  plans: () => [...queryRoots.member, 'plans'] as const,
  payments: (page: number) => [...queryRoots.member, 'payments', page] as const,
  reminders: (page: number) => [...queryRoots.member, 'reminders', page] as const,
  remindersAll: () => [...queryRoots.member, 'reminders'] as const,
  conversationSearch: (search: string, page: number) => [...queryRoots.member, 'conversations', 'search', search, page] as const,
}

export type ThreadData = Awaited<ReturnType<typeof fetchMessages>>

/** True while GabayMo or a reviewer is still working on a question. */
export function isWaiting(questions: Array<QuestionState>) {
  return questions.some((q) => q.answer_state === 'in_review' || q.answer_state === 'drafting')
}

/** Poll quickly while GabayMo is working, slowly while a person reviews, not at all when done. */
export function messagesPollInterval(questions: Array<QuestionState> | undefined): number | false {
  if (!questions || !isWaiting(questions)) return false
  const working = questions.some((q) => q.answer_state === 'drafting' || q.progress?.stage === 'sending')
  return working ? 700 : 4000
}

/**
 * Fresh profile from the API (also refreshes the cached session copy).
 * Starts from the cached copy so the header renders at once.
 */
export function useMe(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: memberKeys.me(),
    queryFn: refreshMember,
    placeholderData: () => readMember() ?? undefined,
    ...options,
  })
}

/** Patch the cached profile (usage after a question, region after saving). */
export function setMeData(client: QueryClient, update: (member: MemberProfile) => MemberProfile) {
  client.setQueryData<MemberProfile>(memberKeys.me(), (current) => {
    const base = current ?? readMember()
    return base ? update(base) : current
  })
}

export function setMemberUsage(client: QueryClient, usage: TokenUsage) {
  setMeData(client, (member) => ({ ...member, usage }))
}

export function useUsage() {
  return useQuery({ queryKey: memberKeys.usage(), queryFn: fetchUsage })
}

export function useConversations() {
  return useQuery({ queryKey: memberKeys.conversations(), queryFn: fetchConversations })
}

/** One conversation's messages; polls while an answer is still being prepared. */
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: memberKeys.messages(conversationId ?? 'none'),
    queryFn: () => fetchMessages(conversationId ?? ''),
    enabled: conversationId !== null,
    // Only while the tab is visible (refetchIntervalInBackground stays false).
    refetchInterval: (query) => messagesPollInterval(query.state.data?.meta.questions),
    staleTime: 0,
  })
}

/** Ask a question; afterwards the sidebar, usage meter, profile and thread refresh. */
export function useAskQuestion() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { message: string; conversationId: string | null; idempotencyKey: string }) =>
      askQuestion(input.message, input.conversationId, input.idempotencyKey),
    onSuccess: (result) => {
      setMemberUsage(client, result.usage)
      void client.invalidateQueries({ queryKey: memberKeys.messages(result.data.conversation_id) })
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: memberKeys.conversations() })
      void client.invalidateQueries({ queryKey: memberKeys.usage() })
      void client.invalidateQueries({ queryKey: memberKeys.me() })
    },
  })
}

/** An answer finished (in review → sent, drafting → done): refresh what it changed. */
export function invalidateAfterAnswer(client: QueryClient) {
  void client.invalidateQueries({ queryKey: memberKeys.conversations() })
  void client.invalidateQueries({ queryKey: memberKeys.usage() })
  void client.invalidateQueries({ queryKey: memberKeys.me() })
}

export function useUpdateRegion() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updateMemberRegion,
    onSuccess: (member) => client.setQueryData(memberKeys.me(), member),
  })
}

/** PayMongo return: confirm the payment, then load the (maybe upgraded) profile. */
export function useConfirmPayment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (reference: string) => {
      const result = await confirmMembershipPayment(reference)
      const member = await refreshMember()
      client.setQueryData(memberKeys.me(), member)
      void client.invalidateQueries({ queryKey: memberKeys.usage() })
      return { status: result.status, member }
    },
  })
}

export function useMemory() {
  return useQuery({ queryKey: memberKeys.memory(), queryFn: fetchMemory })
}

export function useMemoryActions() {
  const client = useQueryClient()
  const onSuccess = (state: MemoryState) => client.setQueryData(memberKeys.memory(), state)
  return {
    setEnabled: useMutation({ mutationFn: setMemoryEnabled, onSuccess }),
    remove: useMutation({ mutationFn: deleteMemory, onSuccess }),
    clear: useMutation({ mutationFn: clearMemory, onSuccess }),
  }
}

/** Notification feed; also catches up when the tab regains focus (events missed while away). */
export function useNotifications(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: memberKeys.notifications(),
    queryFn: fetchNotifications,
    refetchOnWindowFocus: true,
    ...options,
  })
}

/** Put a realtime notification at the top of the cached feed. */
export function addNotificationToFeed(client: QueryClient, notification: AppNotification, unread: boolean) {
  client.setQueryData<NotificationFeed>(memberKeys.notifications(), (feed) => {
    if (!feed) return feed
    const already = feed.notifications.some((n) => n.id === notification.id)
    return {
      ...feed,
      notifications: [notification, ...feed.notifications.filter((n) => n.id !== notification.id)].slice(0, 30),
      unread_count: feed.unread_count + (unread && !already ? 1 : 0),
    }
  })
}

export function useNotificationActions() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: memberKeys.notifications() })
  return {
    markRead: useMutation({
      mutationFn: markNotificationRead,
      onMutate: (id: number) => {
        client.setQueryData<NotificationFeed>(memberKeys.notifications(), (feed) => {
          if (!feed) return feed
          const wasUnread = feed.notifications.some((n) => n.id === id && !n.read)
          return {
            ...feed,
            notifications: feed.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
            unread_count: Math.max(0, feed.unread_count - (wasUnread ? 1 : 0)),
          }
        })
      },
      onSettled: invalidate,
    }),
    markAllRead: useMutation({
      mutationFn: markAllNotificationsRead,
      onMutate: () => {
        client.setQueryData<NotificationFeed>(memberKeys.notifications(), (feed) =>
          feed ? { ...feed, notifications: feed.notifications.map((n) => ({ ...n, read: true })), unread_count: 0 } : feed,
        )
      },
      onSettled: invalidate,
    }),
  }
}

/** Re-fetch `key` whenever a realtime notification arrives (optionally only matching ones). */
export function useInvalidateOnNotification(
  key: ReadonlyArray<unknown>,
  match?: (notification: AppNotification) => boolean,
  enabled = true,
) {
  const client = useQueryClient()
  const latest = useRef({ key, match })
  useEffect(() => {
    latest.current = { key, match }
  })
  useEffect(() => {
    if (!enabled) return
    return onNotification((notification) => {
      const { key: current, match: test } = latest.current
      if (!test || test(notification)) void client.invalidateQueries({ queryKey: current })
    })
  }, [client, enabled])
}

export function useMemberTickets(options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: memberKeys.tickets(), queryFn: fetchMemberTickets, ...options })
}

/** One ticket chat; polls every 4s as a fallback for realtime. */
export function useMemberThread(id: number | null) {
  return useQuery({
    queryKey: memberKeys.ticket(id ?? -1),
    queryFn: () => fetchMemberThread(id ?? -1),
    enabled: id !== null,
    refetchInterval: 4000,
  })
}

type ThreadPayload = { ticket: MemberTicket; messages: Array<TicketChatMessage> }

export function useTicketActions() {
  const client = useQueryClient()
  return {
    create: useMutation({
      mutationFn: createMemberTicket,
      onSuccess: (ticket) => {
        client.setQueryData<Array<MemberTicket>>(memberKeys.tickets(), (rows) => [ticket, ...(rows ?? [])])
        void client.invalidateQueries({ queryKey: memberKeys.tickets() })
      },
    }),
    send: useMutation({
      mutationFn: (input: { id: number; body: string }) => sendMemberMessage(input.id, input.body),
      onSuccess: (message, input) => {
        client.setQueryData<ThreadPayload>(memberKeys.ticket(input.id), (thread) =>
          thread && !thread.messages.some((m) => m.id === message.id)
            ? { ...thread, messages: [...thread.messages, message] }
            : thread,
        )
        void client.invalidateQueries({ queryKey: memberKeys.ticket(input.id) })
      },
    }),
  }
}

export function usePublishedPlans() {
  return useQuery({ queryKey: memberKeys.plans(), queryFn: fetchPublishedPlans, staleTime: 5 * 60_000 })
}

export function useCloseTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: closeMemberTicket,
    onSuccess: (ticket) => {
      client.setQueryData<Array<MemberTicket>>(memberKeys.tickets(), (rows) => rows?.map((row) => (row.id === ticket.id ? ticket : row)))
      client.setQueryData<ThreadPayload>(memberKeys.ticket(ticket.id), (thread) => (thread ? { ...thread, ticket } : thread))
      void client.invalidateQueries({ queryKey: memberKeys.tickets() })
    },
  })
}

// ── Account: membership, payments, codes, alerts ──────────────────

export function useSubscriptionActions() {
  const client = useQueryClient()
  const onSuccess = (subscription: NonNullable<MemberProfile['subscription']>) => {
    setMeData(client, (member) => ({ ...member, subscription }))
    void client.invalidateQueries({ queryKey: memberKeys.me() })
  }
  return {
    cancel: useMutation({ mutationFn: cancelSubscription, onSuccess }),
    resume: useMutation({ mutationFn: resumeSubscription, onSuccess }),
  }
}

export function usePayments(page: number) {
  return useQuery({ queryKey: memberKeys.payments(page), queryFn: () => fetchPayments({ page, per_page: 10 }), placeholderData: (previous) => previous })
}

export function useRedeemAccessKey() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: redeemAccessKey,
    onSuccess: (member) => {
      client.setQueryData(memberKeys.me(), { ...member, portal: 'customer' })
      void client.invalidateQueries({ queryKey: memberKeys.me() })
      void client.invalidateQueries({ queryKey: memberKeys.usage() })
    },
  })
}

export function useIssuanceAlerts() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: setIssuanceAlerts,
    onMutate: (enabled) => setMeData(client, (member) => ({ ...member, issuance_alerts: enabled })),
    onSuccess: (member) => client.setQueryData(memberKeys.me(), { ...member, portal: 'customer' }),
    onError: () => void client.invalidateQueries({ queryKey: memberKeys.me() }),
  })
}

// ── Reminders ───────────────────────────────────────────────────────

export function useReminders(page: number) {
  return useQuery({ queryKey: memberKeys.reminders(page), queryFn: () => fetchReminders({ page, per_page: 20 }), placeholderData: (previous) => previous })
}

export function useReminderActions() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: memberKeys.remindersAll() })
  return {
    create: useMutation({ mutationFn: createReminder, onSuccess }),
    update: useMutation({ mutationFn: (input: { id: number; reminder: Partial<ReminderInput> }) => updateReminder(input.id, input.reminder), onSuccess }),
    remove: useMutation({ mutationFn: deleteReminder, onSuccess }),
  }
}

// ── Conversations: search, rename, delete, feedback ───────────────

export function useConversationSearch(search: string, page: number) {
  return useQuery({
    queryKey: memberKeys.conversationSearch(search, page),
    queryFn: () => searchConversations({ search, page, per_page: 20 }),
    placeholderData: (previous) => previous,
  })
}

export function useConversationActions() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: memberKeys.conversations() })
  return {
    rename: useMutation({
      mutationFn: (input: { id: string; title: string }) => renameConversation(input.id, input.title),
      onSuccess: (conversation) => {
        client.setQueryData<Array<ConversationSummary>>(memberKeys.conversations(), (rows) =>
          rows?.map((row) => (row.id === conversation.id ? { ...row, title: conversation.title } : row)),
        )
        void refresh()
      },
    }),
    remove: useMutation({
      mutationFn: deleteConversation,
      onSuccess: (_, id) => {
        client.setQueryData<Array<ConversationSummary>>(memberKeys.conversations(), (rows) => rows?.filter((row) => row.id !== id))
        client.removeQueries({ queryKey: memberKeys.messages(id) })
        void refresh()
      },
    }),
  }
}

/** Rate an answer; the cached thread shows the new `my_feedback` at once. */
export function useAnswerFeedback(conversationId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { messageId: number; rating: MessageFeedback['rating']; reason?: string }) =>
      sendAnswerFeedback(input.messageId, input.rating, input.reason),
    onSuccess: (feedback, input) => {
      if (!conversationId) return
      client.setQueryData<ThreadData>(memberKeys.messages(conversationId), (thread) =>
        thread
          ? { ...thread, data: thread.data.map((m) => (m.id === input.messageId ? { ...m, my_feedback: feedback } : m)) }
          : thread,
      )
    },
  })
}
