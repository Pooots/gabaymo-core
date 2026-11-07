import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { LoaderCircle, Search } from 'lucide-react'
import { AcceptedCard, Bubble, InboxCard, OverdueBadge, TicketGridSkeleton, useWhen } from './desk/TicketCards'
import type { FormEvent, KeyboardEvent } from 'react'

import type { PartnerTicket } from '@/services/partners'
import { ErrorState, Pagination, Skeleton, useConfirm } from '@/components/ui'
import { useDebounced } from '@/hooks/useDebounced'
import { practiceAreaLabel } from '@/lib/practiceAreas'
import { useI18n } from '@/i18n'
import { useAcceptTicket, useAcceptedTickets, useClosePartnerTicket, usePartnerThread, usePartnerTickets, useSendPartnerMessage } from '@/queries/partner'
import { MessageScroller } from '@/routes/MessageScroller'
import { setViewingTicket } from '@/services/notifications'
import { partnerError } from '@/services/partners'

const emptyBox = 'mt-8 rounded-3xl border border-line bg-surface px-6 py-16 text-center text-sm text-ash-573'

export function PartnerTickets() {
  const { t } = useI18n()
  const navigate = useNavigate()
  // New tickets (or one taken by another partner) arrive via usePartnerRealtime in the layout.
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const [page, setPage] = useState(1)
  const [lastSearch, setLastSearch] = useState(search)
  if (search !== lastSearch) {
    setLastSearch(search)
    setPage(1)
  }
  // Server-side search (subject) and pagination: `{data, meta}`.
  const tickets = usePartnerTickets(page, search)
  const accept = useAcceptTicket()
  const visible = tickets.data?.data ?? []

  function onAccept(ticket: PartnerTicket) {
    accept.mutate(ticket.id, {
      onSuccess: () => {
        void navigate({ to: '/partner/accepted/$ticketId', params: { ticketId: String(ticket.id) } })
      },
    })
  }

  // Keep the spinner on the accepted card until the thread opens.
  const acceptingId = accept.isPending || accept.isSuccess ? accept.variables : null

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('partner.inboxEyebrow')}</p>
          <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">{t('partner.navTickets')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t('partner.inboxDescription')}</p>
        </div>
        <label className="flex h-11 w-full max-w-xs items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm">
          <Search size={16} className="text-moss-433" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('partner.inboxSearch')}
            aria-label={t('partner.inboxSearch')}
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-moss-433"
          />
        </label>
      </div>
      {accept.isError ? (
        <p role="alert" className="mt-4 text-sm text-rust-580">
          {partnerError(accept.error)}
        </p>
      ) : null}
      {tickets.isPending ? (
        <TicketGridSkeleton />
      ) : tickets.isError ? (
        <ErrorState
          className="mt-8"
          compact
          title={t('partner.inboxLoadError')}
          error={tickets.error}
          retrying={tickets.isRefetching}
          onRetry={() => void tickets.refetch()}
        />
      ) : visible.length === 0 ? (
        <div className={emptyBox}>{search === '' ? t('partner.noTickets') : t('partner.noTicketsMatch')}</div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visible.map((ticket) => (
              <InboxCard
                key={ticket.id}
                ticket={ticket}
                accepting={acceptingId === ticket.id}
                onAccept={() => onAccept(ticket)}
              />
            ))}
          </div>
          <Pagination meta={tickets.data.meta} onPage={setPage} disabled={tickets.isFetching} />
        </>
      )}
    </div>
  )
}

export function PartnerAccepted() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const accepted = useAcceptedTickets(page)

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('partner.acceptedEyebrow')}</p>
      <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">{t('partner.acceptedTitle')}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t('partner.acceptedDescription')}</p>
      {accepted.isPending ? (
        <TicketGridSkeleton />
      ) : accepted.isError ? (
        <ErrorState
          className="mt-8"
          compact
          title={t('partner.acceptedLoadError')}
          error={accepted.error}
          retrying={accepted.isRefetching}
          onRetry={() => void accepted.refetch()}
        />
      ) : accepted.data.data.length === 0 ? (
        <div className={emptyBox}>{t('partner.acceptedEmpty')}</div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {accepted.data.data.map((ticket) => (
              <AcceptedCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
          <Pagination meta={accepted.data.meta} onPage={setPage} disabled={accepted.isFetching} />
        </>
      )}
    </div>
  )
}

export function PartnerThread() {
  const { t } = useI18n()
  const { ticketId } = useParams({ strict: false })
  const id = Number(ticketId)
  // Polls every few seconds; realtime notifications for this ticket refetch at once (usePartnerRealtime).
  const thread = usePartnerThread(id)
  const send = useSendPartnerMessage(id)
  const close = useClosePartnerTicket()
  const navigate = useNavigate()
  const [confirm, confirmDialog] = useConfirm()
  const [draft, setDraft] = useState('')
  const sendingLock = useRef(false)

  useEffect(() => {
    if (!Number.isFinite(id)) return
    setViewingTicket(id)
    return () => setViewingTicket(null)
  }, [id])

  const ticket = thread.data?.ticket
  const messages = thread.data?.messages ?? []
  const closed = ticket?.status === 'closed' || Boolean(ticket?.closed_at)
  const when = useWhen()

  async function closeTicket() {
    const ok = await confirm({
      title: t('partner.closeTitle'),
      description: t('partner.closeBody'),
      confirmLabel: t('partner.closeTicket'),
    })
    if (!ok) return
    close.mutate(id, { onSuccess: () => void navigate({ to: '/partner/accepted' }) })
  }

  async function onSubmit(event: FormEvent | KeyboardEvent<HTMLTextAreaElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !Number.isFinite(id) || sendingLock.current) return
    sendingLock.current = true
    try {
      await send.mutateAsync(text)
      setDraft('')
    } catch {
      // Shown below the composer from send.error.
    } finally {
      sendingLock.current = false
    }
  }

  function onEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    void onSubmit(event)
  }

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-sand-127 px-4 py-4 sm:px-8">
        <Link to="/partner/accepted" className="text-sm font-medium text-brand">
          {t('partner.threadBack')}
        </Link>
        <h1 className="serif mt-2 text-3xl font-medium tracking-[-0.03em] break-words">
          {ticket?.subject ?? t('partner.threadTitleFallback')}
        </h1>
        {ticket ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="min-w-0 text-sm break-words text-muted">
              {ticket.member_name}
              {ticket.member_region ? ` · ${ticket.member_region}` : ''}
              {ticket.member_email ? ` · ${ticket.member_email}` : ''}
            </p>
            {ticket.practice_area ? (
              <span className="rounded-full bg-moss-71 px-2 py-0.5 text-xs text-brand">{practiceAreaLabel(t, ticket.practice_area)}</span>
            ) : null}
            {ticket.overdue ? <OverdueBadge /> : null}
            {!closed && ticket.reply_due_at ? (
              <span className="text-xs text-muted">{t('partner.replyDue', { when: when(ticket.reply_due_at) })}</span>
            ) : null}
            {!closed ? (
              <button
                type="button"
                className="ml-auto rounded-full px-3 py-1 text-sm font-medium text-rust-600 ring-1 ring-rust-124 hover:bg-rust-29 disabled:opacity-50"
                disabled={close.isPending}
                onClick={() => void closeTicket()}
              >
                {close.isPending ? t('partner.closing') : t('partner.closeTicket')}
              </button>
            ) : (
              <span className="text-xs text-muted">{t('partner.closedOn', { when: when(ticket.closed_at ?? null) })}</span>
            )}
          </div>
        ) : thread.isPending ? (
          <Skeleton className="mt-2 h-4 w-56" />
        ) : null}
        {close.isError ? (
          <p role="alert" className="mt-2 text-sm text-rust-580">
            {partnerError(close.error)}
          </p>
        ) : null}
        {confirmDialog}
      </div>
      <MessageScroller watch={`${ticket?.id ?? 0}:${messages.at(-1)?.id ?? 0}`}>
        {/* A failed background poll keeps the loaded conversation; only a first-load failure shows the error. */}
        {thread.isError && !thread.data ? (
          <ErrorState
            title={t('partner.threadLoadError')}
            error={thread.error}
            retrying={thread.isRefetching}
            onRetry={() => void thread.refetch()}
          />
        ) : null}
        {ticket ? <Bubble mine={false} name={ticket.member_name} body={ticket.body} time={ticket.created_at} /> : null}
        {messages.map((message) => (
          <Bubble key={message.id} mine={message.mine} name={message.sender_name} body={message.body} time={message.created_at} />
        ))}
      </MessageScroller>
      <form onSubmit={(event) => void onSubmit(event)} className="border-t border-sand-127 px-4 py-4 sm:px-8">
        {send.isError ? (
          <p role="alert" className="mb-2 text-sm text-rust-580">
            {partnerError(send.error)}
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
            aria-label={t('partner.messageLabel')}
            placeholder={
              ticket ? t('partner.messagePlaceholder', { name: ticket.member_name }) : t('partner.messagePlaceholderFallback')
            }
            className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-moss-98 bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <button type="submit" disabled={send.isPending || !draft.trim()} className="btn-primary h-11 shrink-0">
            {send.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('partner.send')}
          </button>
        </div>
      </form>
    </div>
  )
}
