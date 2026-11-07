import { Link } from '@tanstack/react-router'
import { AlarmClock, LoaderCircle } from 'lucide-react'

import type { PartnerTicket } from '@/services/partners'
import { practiceAreaLabel } from '@/lib/practiceAreas'

import { Skeleton } from '@/components/ui'
import { useI18n } from '@/i18n'

/** Date + time in the reader's locale ('' when unknown). */
export function useWhen() {
  const { intl } = useI18n()
  return (value: string | null) =>
    value ? new Date(value).toLocaleString(intl, { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

/** Accepted ticket whose reply is past `reply_due_at`. */
export function OverdueBadge() {
  const { t } = useI18n()
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rust-33 px-2 py-0.5 text-[11px] font-semibold text-rust-620 ring-1 ring-rust-124">
      <AlarmClock size={12} aria-hidden />
      {t('partner.overdue')}
    </span>
  )
}

export function InboxCard({
  ticket,
  accepting,
  onAccept,
}: {
  ticket: PartnerTicket
  accepting: boolean
  onAccept: () => void
}) {
  const { t } = useI18n()
  const when = useWhen()
  return (
    <article className="flex min-w-0 flex-col rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">{t('partner.ticketOpen')}</p>
        <p className="text-xs text-moss-433">{when(ticket.created_at)}</p>
      </div>
      <h2 className="mt-2 text-lg font-semibold break-words">{ticket.subject}</h2>
      {ticket.practice_area ? <p className="mt-1 text-xs text-brand">{practiceAreaLabel(t, ticket.practice_area)}</p> : null}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed break-words text-moss-731">{ticket.body}</p>
      <p className="mt-4 text-sm break-words text-muted">
        {ticket.member_name}
        {ticket.member_region ? ` · ${ticket.member_region}` : ''}
        {ticket.member_plan ? ` · ${ticket.member_plan}` : ''}
      </p>
      <button
        type="button"
        className="btn-primary mt-5 h-10 w-fit"
        disabled={accepting}
        aria-label={t('partner.acceptTicket', { subject: ticket.subject })}
        onClick={onAccept}
      >
        {accepting ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
        {t('partner.accept')}
      </button>
    </article>
  )
}

export function AcceptedCard({ ticket }: { ticket: PartnerTicket }) {
  const { t } = useI18n()
  const when = useWhen()
  return (
    <Link
      to="/partner/accepted/$ticketId"
      params={{ ticketId: String(ticket.id) }}
      className="min-w-0 rounded-3xl border border-line bg-surface p-5 hover:border-moss-220"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-brand">{t('partner.acceptedEyebrow')}</p>
        {ticket.overdue ? <OverdueBadge /> : null}
      </div>
      <h2 className="mt-2 text-lg font-semibold break-words">{ticket.subject}</h2>
      <p className="mt-2 line-clamp-2 text-sm break-words text-muted">{ticket.body}</p>
      {ticket.reply_due_at ? (
        <p className={`mt-2 text-xs ${ticket.overdue ? 'text-rust-620' : 'text-moss-433'}`}>
          {t(ticket.overdue ? 'partner.replyWasDue' : 'partner.replyDue', { when: when(ticket.reply_due_at) })}
        </p>
      ) : null}
      <p className="mt-4 text-sm text-moss-731">
        {ticket.member_name}
        {ticket.member_region ? ` · ${ticket.member_region}` : ''}
      </p>
    </Link>
  )
}

/** Card-shaped placeholders for the inbox and accepted grids. */
export function TicketGridSkeleton() {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" className="mt-6 grid gap-4 md:grid-cols-2">
      <span className="sr-only">{t('common.loading')}</span>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="space-y-3 rounded-3xl border border-line bg-surface p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function Bubble({ mine, name, body, time }: { mine: boolean; name: string; body: string; time: string | null }) {
  const when = useWhen()
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] min-w-0 rounded-3xl px-4 py-3 ${mine ? 'bg-brand text-white' : 'bg-surface text-moss-833'}`}>
        <p className={`text-[11px] font-semibold tracking-[0.12em] ${mine ? 'text-white/70' : 'text-brand'}`}>{name}</p>
        <p className="mt-1 text-sm leading-relaxed break-words">{body}</p>
        <p className={`mt-2 text-[11px] ${mine ? 'text-white/60' : 'text-moss-433'}`}>{when(time)}</p>
      </div>
    </div>
  )
}
