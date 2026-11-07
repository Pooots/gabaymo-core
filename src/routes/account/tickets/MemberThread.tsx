import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { formatStamp } from '../format'
import type { FormEvent, KeyboardEvent } from 'react'

import type { MemberTicket } from '@/services/tickets'
import { ErrorState, Skeleton, useConfirm  } from '@/components/ui'
import { MessageScroller } from '@/routes/MessageScroller'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { practiceAreaLabel } from '@/lib/practiceAreas'
import { memberKeys, useCloseTicket, useInvalidateOnNotification, useMemberThread, useTicketActions } from '@/queries/member'
import { setViewingTicket } from '@/services/notifications'

export function MemberThread({ ticketId, fallback, onBack }: { ticketId: number; fallback: MemberTicket | null; onBack: () => void }) {
  const { t, intl } = useI18n()
  const thread = useMemberThread(ticketId)
  const close = useCloseTicket()
  const [confirm, confirmDialog] = useConfirm()
  const { send } = useTicketActions()
  const [draft, setDraft] = useState('')
  const sendingLock = useRef(false)
  const ticket = thread.data?.ticket ?? fallback
  const messages = thread.data?.messages ?? []
  const open = ticket?.status === 'accepted'
  const closed = ticket?.status === 'closed' || ticket?.status === 'resolved' || Boolean(ticket?.closed_at)

  async function closeTicket() {
    const ok = await confirm({
      title: t('tickets.closeTitle'),
      description: t('tickets.closeBody'),
      confirmLabel: t('tickets.close'),
    })
    if (ok) close.mutate(ticketId)
  }

  useEffect(() => {
    setViewingTicket(ticketId)
    return () => setViewingTicket(null)
  }, [ticketId])

  // Realtime: pull the new message now instead of waiting for the poll.
  useInvalidateOnNotification(memberKeys.ticket(ticketId), (notification) => notification.data.ticket_id === ticketId)

  function onSubmit(event: FormEvent | KeyboardEvent<HTMLTextAreaElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sendingLock.current || !open) return
    sendingLock.current = true
    send.mutate(
      { id: ticketId, body: text },
      {
        onSuccess: () => setDraft(''),
        onSettled: () => {
          sendingLock.current = false
        },
      },
    )
  }

  function onEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    onSubmit(event)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-sand-127 px-4 py-4 sm:px-8">
        <button type="button" className="text-sm font-medium text-brand" onClick={onBack}>
          {t('tickets.backToList')}
        </button>
        <h1 className="serif mt-2 text-3xl font-medium tracking-[-0.03em] break-words">{ticket?.subject ?? t('tickets.conversation')}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>
            {closed
              ? t('tickets.closedOn', { when: formatStamp(ticket?.closed_at ?? null, intl) || '—' })
              : ticket?.partner_name
                ? t('tickets.withPartner')
                : t('tickets.waitingPartner')}
          </span>
          {ticket?.practice_area ? (
            <span className="rounded-full bg-moss-71 px-2 py-0.5 text-xs text-brand">{practiceAreaLabel(t, ticket.practice_area)}</span>
          ) : null}
          {!closed && ticket?.reply_due_at ? <span>{t('tickets.replyDue', { when: formatStamp(ticket.reply_due_at, intl) })}</span> : null}
          {ticket && !closed ? (
            <button
              type="button"
              className="ml-auto rounded-full px-3 py-1 text-sm font-medium text-rust-600 ring-1 ring-rust-124 hover:bg-rust-29 disabled:opacity-50"
              disabled={close.isPending}
              onClick={() => void closeTicket()}
            >
              {close.isPending ? t('tickets.closing') : t('tickets.close')}
            </button>
          ) : null}
        </div>
        {close.isError ? (
          <p role="alert" className="mt-2 text-sm text-rust-580">
            {apiErrorMessage(close.error, t('tickets.closeError'))}
          </p>
        ) : null}
        {confirmDialog}
      </div>
      {thread.isError ? (
        <ErrorState
          compact
          className="mx-4 mt-3 sm:mx-8"
          error={thread.error}
          title={t('tickets.threadError')}
          retrying={thread.isRefetching}
          onRetry={() => void thread.refetch()}
        />
      ) : null}
      <MessageScroller watch={`${ticket?.id ?? 0}:${messages.at(-1)?.id ?? 0}`}>
        {ticket ? <Bubble mine name={t('tickets.you')} body={ticket.body} time={ticket.created_at} /> : null}
        {thread.isPending ? (
          <div role="status" aria-busy="true" className="space-y-3">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton className="h-16 w-3/5 rounded-3xl" />
          </div>
        ) : null}
        {messages.map((message) => (
          <Bubble
            key={message.id}
            mine={message.mine}
            name={message.mine ? t('tickets.you') : t('tickets.partner')}
            body={message.body}
            time={message.created_at}
          />
        ))}
      </MessageScroller>
      <form onSubmit={onSubmit} className="border-t border-sand-127 px-4 py-4 sm:px-8">
        {send.isError ? (
          <p role="alert" className="mb-2 text-sm text-rust-580">
            {apiErrorMessage(send.error, t('tickets.sendError'))}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onEnter}
            rows={2}
            required
            maxLength={4000}
            disabled={!open}
            aria-label={open ? t('tickets.replyPlaceholder') : closed ? t('tickets.replyTicketClosed') : t('tickets.replyClosed')}
            placeholder={open ? t('tickets.replyPlaceholder') : closed ? t('tickets.replyTicketClosed') : t('tickets.replyClosed')}
            className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-moss-98 bg-surface px-4 py-3 text-sm outline-none focus:border-brand disabled:bg-sand-49"
          />
          <button type="submit" disabled={send.isPending || !draft.trim() || !open} className="btn-primary h-11 shrink-0">
            {send.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('tickets.send')}
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({ mine, name, body, time }: { mine: boolean; name: string; body: string; time: string | null }) {
  const { intl } = useI18n()
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] min-w-0 rounded-3xl px-4 py-3 ${mine ? 'bg-brand text-white' : 'bg-surface text-moss-833'}`}>
        <p className={`text-[11px] font-semibold tracking-[0.12em] ${mine ? 'text-white/70' : 'text-brand'}`}>{name}</p>
        <p className="mt-1 text-sm leading-relaxed break-words">{body}</p>
        <p className={`mt-2 text-[11px] ${mine ? 'text-white/60' : 'text-moss-433'}`}>{formatStamp(time, intl)}</p>
      </div>
    </div>
  )
}
