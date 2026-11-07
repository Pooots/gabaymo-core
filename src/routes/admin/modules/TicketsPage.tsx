import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import { SearchBox, useAdminFormat } from './shared'
import type { Column, StatusTone } from '@/components/ui'
import type { MessageKey } from '@/i18n'
import type { AdminTicket, TicketStatusFilter } from '@/services/adminOps'
import { DataTable, Drawer, ErrorNote, Frame, Pagination, QueryState, Select, StatusPill, Tabs, dangerButton, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useAdminTicket, useAdminTickets, useCloseAdminTicket } from '@/queries/admin'
import { PRACTICE_AREAS } from '@/services/adminOps'

const STATUS_LABEL: Record<string, MessageKey> = {
  open: 'adminOps.ticketOpen',
  accepted: 'adminOps.ticketAccepted',
  closed: 'adminOps.ticketClosed',
}

const STATUS_TONE: Record<string, StatusTone> = { open: 'amber', accepted: 'green', closed: 'gray' }

function TicketStatus({ ticket }: { ticket: AdminTicket }) {
  const { t } = useI18n()
  const label = STATUS_LABEL[ticket.status]
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <StatusPill tone={STATUS_TONE[ticket.status] ?? 'gray'} dot>
        {label ? t(label) : ticket.status}
      </StatusPill>
      {ticket.overdue ? <StatusPill tone="red">{t('adminOps.ticketOverdue')}</StatusPill> : null}
    </span>
  )
}

export function TicketsPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<TicketStatusFilter>('')
  const [area, setArea] = useState('')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const list = useAdminTickets({ page, status, practice_area: area, search })

  const columns: Array<Column<AdminTicket>> = [
    { key: 'id', header: t('admin.colTicket'), className: 'whitespace-nowrap font-mono text-xs', cell: (row) => `#${row.id}` },
    {
      key: 'subject',
      header: t('admin.colSubject'),
      cell: (row) => (
        <>
          <span className="block font-medium">{row.subject}</span>
          <span className="block text-xs text-ash-573">
            {f.area(row.practice_area)}
            {row.from_ai_handoff ? ` · ${t('adminOps.ticketFromAi')}` : ''}
          </span>
        </>
      ),
    },
    { key: 'member', header: t('admin.colMember'), cell: (row) => row.member?.name ?? '—' },
    { key: 'partner', header: t('admin.colPartner'), cell: (row) => row.partner?.name ?? '—' },
    { key: 'status', header: t('admin.colStatus'), cell: (row) => <TicketStatus ticket={row} /> },
    {
      key: 'due',
      header: t('adminOps.colReplyDue'),
      className: 'whitespace-nowrap text-ash-573',
      cell: (row) => (row.closed_at ? t('adminOps.closedOn', { date: f.date(row.closed_at) }) : f.dateTime(row.reply_due_at)),
    },
  ]

  const tabs: Array<{ id: TicketStatusFilter; label: string }> = [
    { id: '', label: t('common.all') },
    { id: 'open', label: t('adminOps.ticketOpen') },
    { id: 'accepted', label: t('adminOps.ticketAccepted') },
    { id: 'overdue', label: t('adminOps.ticketOverdue') },
    { id: 'closed', label: t('adminOps.ticketClosed') },
  ]

  return (
    <Frame title={t('admin.ticketsTitle')} text={t('adminOps.ticketsText')}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          label={t('adminOps.filterStatus')}
          tabs={tabs}
          value={status}
          onChange={(next) => {
            setStatus(next)
            setPage(1)
          }}
        />
        <div className="w-56">
          <Select
            aria-label={t('adminOps.filterArea')}
            value={area}
            onChange={(event) => {
              setArea(event.target.value)
              setPage(1)
            }}
          >
            <option value="">{t('adminOps.allAreas')}</option>
            {PRACTICE_AREAS.map((key) => (
              <option key={key} value={key}>
                {f.area(key)}
              </option>
            ))}
          </Select>
        </div>
        <SearchBox
          label={t('adminOps.ticketsSearch')}
          placeholder={t('adminOps.ticketsSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
      </div>
      <DataTable
        columns={columns}
        rows={list.data?.data}
        rowKey={(row) => row.id}
        minWidth="min-w-[880px]"
        loading={list.isPending}
        error={list.data ? undefined : list.error}
        onRetry={() => void list.refetch()}
        empty={t('adminOps.ticketsEmpty')}
        onRowClick={(row) => setOpenId(row.id)}
      />
      <Pagination meta={list.data?.meta} onPage={setPage} disabled={list.isFetching} />
      {openId !== null ? <TicketDrawer id={openId} onClose={() => setOpenId(null)} /> : null}
    </Frame>
  )
}

function TicketDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useI18n()
  const f = useAdminFormat()
  const query = useAdminTicket(id)
  const close = useCloseAdminTicket()
  const [confirm, confirmDialog] = useConfirm()
  const ticket = query.data?.ticket

  async function onCloseTicket() {
    const ok = await confirm({
      title: t('adminOps.closeTicketTitle', { id }),
      description: t('adminOps.closeTicketBody'),
      confirmLabel: t('adminOps.closeTicket'),
      tone: 'danger',
    })
    if (!ok) return
    close.mutate(id, { onSuccess: () => void query.refetch() })
  }

  return (
    <Drawer title={ticket ? ticket.subject : t('adminOps.ticketN', { id })} subtitle={ticket ? <TicketStatus ticket={ticket} /> : null} onClose={onClose}>
      {confirmDialog}
      <div className="space-y-5 p-6">
        <QueryState query={query}>
          {({ ticket: row, messages }) => (
            <>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label={t('admin.colMember')} value={row.member ? `${row.member.name} · ${row.member.email}` : '—'} />
                <Info label={t('admin.colPartner')} value={row.partner?.name ?? '—'} />
                <Info label={t('adminOps.practiceArea')} value={f.area(row.practice_area)} />
                <Info label={t('adminOps.createdAt')} value={f.dateTime(row.created_at)} />
                <Info label={t('adminOps.colReplyDue')} value={f.dateTime(row.reply_due_at)} />
                <Info
                  label={t('adminOps.closedAt')}
                  value={row.closed_at ? `${f.dateTime(row.closed_at)}${row.closed_by ? ` · ${row.closed_by}` : ''}` : '—'}
                />
              </dl>
              <section className="rounded-2xl border border-sand-86 bg-surface p-4">
                <p className="text-xs font-medium text-ash-573">{t('adminOps.ticketQuestion')}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{row.body}</p>
              </section>
              <section>
                <h3 className="text-sm font-semibold">{t('adminOps.ticketMessages')}</h3>
                {messages.length === 0 ? (
                  <p className="mt-2 text-sm text-ash-573">{t('adminOps.ticketNoMessages')}</p>
                ) : (
                  <ol className="mt-2 space-y-2">
                    {messages.map((m) => (
                      <li key={m.id} className={`rounded-2xl px-4 py-3 text-sm ${m.sender_role === 'partner' ? 'bg-moss-53' : 'bg-surface ring-1 ring-sand-86'}`}>
                        <p className="text-xs text-ash-573">
                          {m.sender_name ?? '—'} · {m.sender_role === 'partner' ? t('admin.colPartner') : t('admin.colMember')} · {f.dateTime(m.created_at)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <ErrorNote>{close.isError ? apiErrorMessage(close.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
              {row.status !== 'closed' ? (
                <button type="button" className={dangerButton} disabled={close.isPending} onClick={() => void onCloseTicket()}>
                  {close.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
                  {t('adminOps.closeTicket')}
                </button>
              ) : null}
            </>
          )}
        </QueryState>
      </div>
    </Drawer>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ash-573">{label}</dt>
      <dd className="mt-0.5 font-medium break-words">{value}</dd>
    </div>
  )
}
