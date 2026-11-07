import { useState } from 'react'
import { Plus } from 'lucide-react'

import { formatStamp } from './format'
import { MemberThread } from './tickets/MemberThread'
import { NewTicketDialog } from './tickets/NewTicketDialog'
import { ErrorState, SkeletonRows } from '@/components/ui'
import { useI18n } from '@/i18n'
import { practiceAreaLabel } from '@/lib/practiceAreas'
import { memberKeys, useInvalidateOnNotification, useMemberTickets } from '@/queries/member'

export function MemberTickets({ focus = null }: { focus?: { id: number; key: number } | null }) {
  const { t, intl } = useI18n()
  const tickets = useMemberTickets()
  const [open, setOpen] = useState(false)
  const [threadId, setThreadId] = useState<number | null>(focus?.id ?? null)
  // A notification click (new `key`) opens that ticket's chat.
  const [lastFocus, setLastFocus] = useState(focus)
  if (focus !== lastFocus) {
    setLastFocus(focus)
    if (focus) setThreadId(focus.id)
  }

  // A partner accepted a ticket: refresh the status column live.
  useInvalidateOnNotification(memberKeys.tickets())

  if (threadId !== null) {
    const selected = tickets.data?.find((ticket) => ticket.id === threadId) ?? null
    return <MemberThread ticketId={threadId} fallback={selected} onBack={() => setThreadId(null)} />
  }

  const rows = tickets.data ?? []
  const addButton = (
    <button type="button" className="btn-primary h-11" onClick={() => setOpen(true)}>
      <Plus size={16} aria-hidden />
      {t('tickets.add')}
    </button>
  )

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">{t('tickets.eyebrow')}</p>
          <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">{t('tickets.title')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t('tickets.intro')}</p>
        </div>
        {addButton}
      </div>

      <div className="mt-6">
        {tickets.isError ? (
          <ErrorState compact error={tickets.error} title={t('tickets.loadError')} retrying={tickets.isRefetching} onRetry={() => void tickets.refetch()} />
        ) : tickets.isSuccess && rows.length === 0 ? (
          <div className="rounded-[28px] border border-line bg-surface px-6 py-16 text-center">
            <p className="text-sm text-ash-573">{t('tickets.empty')}</p>
            <div className="mt-5">{addButton}</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
            <div className="relative max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-ash-59 text-[11px] font-semibold tracking-[0.14em] text-moss-433 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t('tickets.colSubject')}
                  </th>
                  <th scope="col" className="hidden px-5 py-3 font-semibold sm:table-cell">
                    {t('tickets.colStatus')}
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    {t('tickets.colOpened')}
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    {t('tickets.colChat')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.isPending ? (
                  <SkeletonRows rows={3} columns={4} />
                ) : (
                  rows.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-ash-41 last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-semibold break-words text-moss-898">{ticket.subject}</p>
                        <p className="mt-1 line-clamp-2 text-muted">{ticket.body}</p>
                        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-moss-433">
                          {ticket.practice_area ? <span>{practiceAreaLabel(t, ticket.practice_area)}</span> : null}
                          {ticket.closed_at ? (
                            <span>{t('tickets.closedOn', { when: formatStamp(ticket.closed_at, intl) })}</span>
                          ) : ticket.reply_due_at ? (
                            <span>{t('tickets.replyDue', { when: formatStamp(ticket.reply_due_at, intl) })}</span>
                          ) : null}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-moss-71 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand uppercase sm:hidden">
                          {statusLabel(ticket.status, t)}
                        </span>
                      </td>
                      <td className="hidden px-5 py-4 sm:table-cell">
                        <span className="rounded-full bg-moss-71 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand uppercase">
                          {statusLabel(ticket.status, t)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-xs whitespace-nowrap text-moss-433">{formatStamp(ticket.created_at, intl)}</td>
                      <td className="px-5 py-4 text-right">
                        {ticket.status === 'accepted' ? (
                          <button type="button" className="btn-primary h-9 whitespace-nowrap" onClick={() => setThreadId(ticket.id)}>
                            {t('tickets.openChat')}
                          </button>
                        ) : ticket.status === 'closed' || ticket.status === 'resolved' ? (
                          <button type="button" className="text-xs font-medium whitespace-nowrap text-brand hover:underline" onClick={() => setThreadId(ticket.id)}>
                            {t('tickets.viewChat')}
                          </button>
                        ) : ticket.status === 'open' ? (
                          <button type="button" className="text-xs font-medium whitespace-nowrap text-brand hover:underline" onClick={() => setThreadId(ticket.id)}>
                            {t('tickets.viewTicket')}
                          </button>
                        ) : (
                          <span className="text-xs text-moss-433">{t('tickets.waiting')}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {open ? <NewTicketDialog onClose={() => setOpen(false)} /> : null}
    </div>
  )
}

function statusLabel(status: string, t: ReturnType<typeof useI18n>['t']) {
  switch (status) {
    case 'open':
      return t('tickets.statusOpen')
    case 'accepted':
      return t('tickets.statusAccepted')
    case 'closed':
      return t('tickets.statusClosed')
    case 'resolved':
      return t('tickets.statusResolved')
    default:
      return status
  }
}
