import { useState } from 'react'
import { BellPlus, Check, Copy, FileDown, ThumbsDown, ThumbsUp } from 'lucide-react'

import { PrintAnswer } from './PrintAnswer'
import { answerWithCitations, feedbackOf } from './answerText'
import type { FormEvent } from 'react'
import type { FeedbackRating } from '@/services/account'
import type { ChatMessage } from '@/services/ai'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useAnswerFeedback } from '@/queries/member'

const chip =
  'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-moss-731 transition hover:bg-ash-41 disabled:opacity-50'

/**
 * Under each sent answer: 👍/👎 with an optional reason (shows the member's
 * saved `my_feedback`), "Copy with citations", "Export as PDF" (print view)
 * and "Add reminder".
 */
export function AnswerActions({
  message,
  conversationId,
  question,
  onAddReminder,
}: {
  message: ChatMessage
  conversationId: string | null
  question: string | null
  onAddReminder?: () => void
}) {
  const { t } = useI18n()
  const feedback = useAnswerFeedback(conversationId)
  const saved = feedbackOf(message)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState(saved?.reason ?? '')
  const [copied, setCopied] = useState<'idle' | 'done' | 'error'>('idle')
  const [printing, setPrinting] = useState(false)
  const [justRated, setJustRated] = useState(false)

  function rate(rating: FeedbackRating) {
    feedback.mutate(
      { messageId: message.id, rating, reason: saved?.rating === rating ? (saved.reason ?? undefined) : undefined },
      {
        onSuccess: () => {
          setJustRated(true)
          if (rating === 'down' && !saved?.reason) setReasonOpen(true)
        },
      },
    )
  }

  function sendReason(event: FormEvent) {
    event.preventDefault()
    const rating = saved?.rating ?? 'down'
    feedback.mutate({ messageId: message.id, rating, reason }, { onSuccess: () => setReasonOpen(false) })
  }

  async function copy() {
    const text = answerWithCitations(message, t('conversations.sourcesHeading'), (page) => t('conversations.printPage', { page }))
    try {
      await navigator.clipboard.writeText(text)
      setCopied('done')
      window.setTimeout(() => setCopied('idle'), 2000)
    } catch {
      setCopied('error')
    }
  }

  return (
    <div className="mt-2 pl-10">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('conversations.feedbackLabel')}>
        <button
          type="button"
          className={`${chip} ${saved?.rating === 'up' ? 'bg-moss-71 text-brand' : ''}`}
          aria-pressed={saved?.rating === 'up'}
          aria-label={t('conversations.helpful')}
          title={t('conversations.helpful')}
          disabled={feedback.isPending}
          onClick={() => rate('up')}
        >
          <ThumbsUp size={14} aria-hidden />
        </button>
        <button
          type="button"
          className={`${chip} ${saved?.rating === 'down' ? 'bg-rust-33 text-rust-620' : ''}`}
          aria-pressed={saved?.rating === 'down'}
          aria-label={t('conversations.notHelpful')}
          title={t('conversations.notHelpful')}
          disabled={feedback.isPending}
          onClick={() => rate('down')}
        >
          <ThumbsDown size={14} aria-hidden />
        </button>
        {saved && !reasonOpen ? (
          <button type="button" className={chip} onClick={() => setReasonOpen(true)}>
            {saved.reason ? t('conversations.feedbackEditReason') : t('conversations.feedbackAddReason')}
          </button>
        ) : null}
        <span aria-hidden className="mx-1 h-4 w-px bg-sand-124" />
        <button type="button" className={chip} onClick={() => void copy()}>
          {copied === 'done' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied === 'done' ? t('conversations.copiedCitations') : t('conversations.copyCitations')}
        </button>
        <button type="button" className={chip} onClick={() => setPrinting(true)} disabled={printing}>
          <FileDown size={14} aria-hidden />
          {t('conversations.exportPdf')}
        </button>
        {onAddReminder ? (
          <button type="button" className={chip} onClick={onAddReminder}>
            <BellPlus size={14} aria-hidden />
            {t('conversations.addReminder')}
          </button>
        ) : null}
      </div>
      <div aria-live="polite" className="text-xs">
        {justRated && !reasonOpen && !feedback.isError ? <p className="mt-1 text-moss-433">{t('conversations.feedbackThanks')}</p> : null}
        {saved?.reason && !reasonOpen ? <p className="mt-1 break-words text-moss-555">{t('conversations.yourNote', { reason: saved.reason })}</p> : null}
        {copied === 'error' ? <p className="mt-1 text-rust-600">{t('conversations.copyError')}</p> : null}
        {feedback.isError ? (
          <p role="alert" className="mt-1 text-rust-600">
            {apiErrorMessage(feedback.error, t('conversations.feedbackError'))}
          </p>
        ) : null}
      </div>
      {reasonOpen ? (
        <form className="mt-2 max-w-md space-y-2" onSubmit={sendReason}>
          <label className="block text-xs font-medium text-moss-731" htmlFor={`feedback-reason-${message.id}`}>
            {t('conversations.feedbackReasonLabel')}
          </label>
          <textarea
            id={`feedback-reason-${message.id}`}
            value={reason}
            maxLength={1000}
            rows={3}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('conversations.feedbackReasonPlaceholder')}
            className="w-full resize-none rounded-2xl border border-sand-124 bg-surface px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary h-9" disabled={feedback.isPending}>
              {t('conversations.feedbackSend')}
            </button>
            <button type="button" className="h-9 rounded-full px-3 text-sm font-medium text-muted" onClick={() => setReasonOpen(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : null}
      {printing ? <PrintAnswer message={message} question={question} onDone={() => setPrinting(false)} /> : null}
    </div>
  )
}
