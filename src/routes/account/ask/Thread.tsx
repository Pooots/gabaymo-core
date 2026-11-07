import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, WifiOff } from 'lucide-react'

import { AnswerBubble } from './AnswerBubble'
import { answerBody } from './answerText'
import { Composer } from './Composer'
import { ConversationMenu } from './ConversationMenu'
import { ThinkingLine } from './ThinkingLine'
import type { FormEvent } from 'react'
import type { MessageKey } from '@/i18n'
import type { ReminderDraft } from '../settings/Reminders'
import type { ChatMessage, QuestionState } from '@/services/ai'
import { ErrorState, Skeleton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { isNetworkError } from '@/lib/errors'
import { readOfflineConversation, saveOfflineConversation } from '@/lib/offlineAnswers'
import { invalidateAfterAnswer, isWaiting, useMessages } from '@/queries/member'

const STATE_TEXT: Record<QuestionState['answer_state'], MessageKey | null> = {
  drafting: 'ask.stateDrafting',
  in_review: 'ask.stateInReview',
  sent: null,
  rejected: 'ask.stateRejected',
  failed: 'ask.stateFailed',
  needs_region: 'ask.stateNeedsRegion',
  handoff: 'ask.stateHandoff',
  no_answer: null,
}

const userBubble =
  'ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-md bg-brand px-4 py-3 text-[15px] leading-relaxed text-white shadow-sm'
const statusBubble = 'mr-auto w-fit max-w-[85%] rounded-3xl rounded-bl-md border border-line bg-surface/90 px-4 py-4'

export function Thread({
  conversationId,
  title,
  pendingQuestion,
  error,
  asking,
  draft,
  setDraft,
  onSubmit,
  onAddReminder,
  onDeleted,
}: {
  conversationId: string | null
  /** Sidebar title, kept with the offline copy. */
  title: string | null
  pendingQuestion: string | null
  error: string
  asking: boolean
  draft: string
  setDraft: (value: string) => void
  onSubmit: (event: FormEvent) => void
  /** "Add reminder" on an answer, prefilled from the conversation. */
  onAddReminder?: (draft: ReminderDraft) => void
  /** The open conversation was deleted. */
  onDeleted?: () => void
}) {
  const { t } = useI18n()
  const client = useQueryClient()
  const query = useMessages(conversationId)
  const bottom = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  // Messages already on screen when the conversation opened are shown at once; new answers are typed out.
  const [seen, setSeen] = useState<Set<number> | null>(null)
  if (seen === null && query.data) setSeen(new Set(query.data.data.map((m) => m.id)))

  // Loading failed without a connection: show the copy saved on this device, if any.
  const offlineCopy = useMemo(() => {
    if (!conversationId || !query.isError || query.data) return null
    const offline = isNetworkError(query.error) || (typeof navigator !== 'undefined' && !navigator.onLine)
    return offline ? readOfflineConversation(conversationId) : null
  }, [conversationId, query.isError, query.error, query.data])

  const messages: Array<ChatMessage> = query.data?.data ?? offlineCopy?.messages ?? []
  const questions: Array<QuestionState> = query.data?.meta.questions ?? offlineCopy?.questions ?? []

  // Keep a small offline copy of every conversation that loads.
  useEffect(() => {
    if (!conversationId || !query.data) return
    saveOfflineConversation({ id: conversationId, title, messages: query.data.data, questions: query.data.meta.questions })
  }, [conversationId, title, query.data])

  // An answer finished (drafting / in review → done): the sidebar, usage and profile change.
  const waiting = query.data ? isWaiting(query.data.meta.questions) : false
  const wasWaiting = useRef(false)
  useEffect(() => {
    if (wasWaiting.current && !waiting) invalidateAfterAnswer(client)
    wasWaiting.current = waiting
  }, [waiting, client])

  const followBottom = useCallback(() => {
    const el = scroller.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) bottom.current?.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, pendingQuestion])

  const byQuestion = new Map(questions.map((q) => [q.id, q]))
  const questionText = (id: string | null) =>
    id ? (messages.find((m) => m.role === 'user' && m.question_id === id)?.content ?? byQuestion.get(id)?.text ?? null) : null
  const loading = conversationId !== null && query.isPending && !offlineCopy

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {conversationId ? (
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 pt-1 sm:px-5">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-moss-731">{title ?? t('ask.untitled')}</p>
          <ConversationMenu id={conversationId} title={title} onDeleted={onDeleted} />
        </div>
      ) : null}
      {/* The scroller spans the full width; the column inside sticks to the bottom only while it is shorter
          than the view (justify-end directly on a scroller makes older messages unreachable). */}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-end gap-4 px-4 py-6 sm:px-5">
          {offlineCopy ? (
            <p role="status" className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-full bg-honey-47 px-3 py-1.5 text-xs font-medium text-honey-755">
              <WifiOff size={13} aria-hidden />
              {t('ask.offlineCopy')}
            </p>
          ) : null}

          {loading ? (
            <div role="status" aria-busy="true" className="space-y-4">
              <span className="sr-only">{t('ask.loadingThread')}</span>
              <Skeleton className="ml-auto h-12 w-3/5 rounded-3xl" />
              <Skeleton className="h-28 w-4/5 rounded-2xl" />
            </div>
          ) : null}

          {messages.map((message) => {
            if (message.role === 'user') {
              const state = message.question_id ? byQuestion.get(message.question_id) : undefined
              const answered = state && messages.some((m) => m.role === 'assistant' && m.question_id === state.id)
              const text = state ? STATE_TEXT[state.answer_state] : null
              return (
                <div key={message.id} className="space-y-3">
                  <p className={userBubble}>{message.content}</p>
                  {state && !answered && (state.answer_state === 'drafting' || state.progress?.stage === 'sending') ? (
                    <article className={statusBubble}>
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">GABAYMO</p>
                      <ThinkingLine stage={state.progress?.stage} />
                    </article>
                  ) : state && !answered && text ? (
                    <article className={statusBubble}>
                      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-brand">
                        GABAYMO {state.answer_state === 'in_review' ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : null}
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed text-moss-833">{t(text)}</p>
                    </article>
                  ) : null}
                </div>
              )
            }
            if (message.role === 'notice') {
              return (
                <p key={message.id} className="mx-auto max-w-[90%] rounded-2xl bg-surface/70 px-4 py-2 text-center text-[13px] break-words text-muted">
                  {message.content}
                </p>
              )
            }
            return (
              <AnswerBubble
                key={message.id}
                message={message}
                animate={seen !== null && !seen.has(message.id)}
                onGrow={followBottom}
                conversationId={conversationId}
                question={questionText(message.question_id)}
                onAddReminder={
                  onAddReminder
                    ? () => {
                        const asked = questionText(message.question_id)
                        onAddReminder({
                          title: asked ?? title ?? '',
                          notes: answerBody(message).slice(0, 500),
                          conversation_id: conversationId,
                        })
                      }
                    : undefined
                }
              />
            )
          })}

          {pendingQuestion ? (
            <div className="space-y-3">
              <p className={userBubble}>{pendingQuestion}</p>
              <article className={statusBubble}>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">GABAYMO</p>
                <ThinkingLine />
              </article>
            </div>
          ) : null}

          {query.isError && !offlineCopy ? (
            <ErrorState compact error={query.error} title={t('ask.threadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-rust-620">
              {error}
            </p>
          ) : null}
          <div ref={bottom} />
        </div>
      </div>
      <div className="px-4 pb-6 sm:px-5">
        <Composer draft={draft} setDraft={setDraft} onSubmit={onSubmit} disabled={asking} />
      </div>
    </div>
  )
}
