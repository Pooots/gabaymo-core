import { useState } from 'react'

import { SearchBox, useAdminFormat } from './shared'
import type { Column, StatusTone } from '@/components/ui'
import type { MessageKey } from '@/i18n'
import type { AdminPayment, PaymentsSummary } from '@/services/adminOps'
import { DataTable, ErrorState, Frame, Pagination, Select, Skeleton, StatusPill } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useAdminPayments, usePaymentsSummary } from '@/queries/admin'
import { PAYMENT_STATUSES } from '@/services/adminOps'

const STATUS_LABEL: Record<string, MessageKey> = {
  pending: 'adminOps.paymentPending',
  paid: 'adminOps.paymentPaid',
  failed: 'adminOps.paymentFailed',
  refunded: 'adminOps.paymentRefunded',
  partially_refunded: 'adminOps.paymentPartiallyRefunded',
  disputed: 'adminOps.paymentDisputed',
}

const STATUS_TONE: Record<string, StatusTone> = {
  pending: 'amber',
  paid: 'green',
  failed: 'red',
  refunded: 'gray',
  partially_refunded: 'gray',
  disputed: 'red',
}

export function PaymentStatus({ status }: { status: string }) {
  const { t } = useI18n()
  const label = STATUS_LABEL[status]
  return (
    <StatusPill tone={STATUS_TONE[status] ?? 'gray'} dot>
      {label ? t(label) : status}
    </StatusPill>
  )
}

/** The six numbers from /v1/admin/payments/summary (revenue is net of refunds, in pesos). */
export function PaymentsSummaryCards({ summary }: { summary: PaymentsSummary | undefined }) {
  const { t } = useI18n()
  const f = useAdminFormat()
  const cards: Array<{ label: string; value: string | null }> = [
    { label: t('adminOps.revenueMonth'), value: summary ? f.peso(summary.revenue_month) : null },
    { label: t('adminOps.revenueTotal'), value: summary ? f.peso(summary.revenue_total) : null },
    { label: t('adminOps.paidCount'), value: summary ? f.number(summary.paid_count) : null },
    { label: t('adminOps.pendingCount'), value: summary ? f.number(summary.pending_count) : null },
    { label: t('adminOps.failedCount'), value: summary ? f.number(summary.failed_count) : null },
    { label: t('adminOps.refundedCount'), value: summary ? f.number(summary.refunded_count) : null },
  ]
  return (
    <dl className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-sand-86 bg-surface px-5 py-4">
          <dt className="text-xs text-ash-573">{card.label}</dt>
          <dd className="serif mt-2 text-2xl tabular-nums">{card.value ?? <Skeleton className="h-7 w-20" />}</dd>
        </div>
      ))}
    </dl>
  )
}

export function PaymentsPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const summary = usePaymentsSummary()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const list = useAdminPayments({ page, status, search })

  const columns: Array<Column<AdminPayment>> = [
    {
      key: 'reference',
      header: t('admin.colReference'),
      cell: (p) => (
        <>
          <span className="block font-mono text-xs">{p.reference}</span>
          {p.receipt_number ? <span className="block text-xs text-ash-573">{t('adminOps.receiptNo', { number: p.receipt_number })}</span> : null}
        </>
      ),
    },
    {
      key: 'member',
      header: t('admin.colMember'),
      cell: (p) =>
        p.member ? (
          <>
            <span className="block font-medium">{p.member.name}</span>
            <span className="block text-xs text-ash-573">{p.member.email}</span>
          </>
        ) : (
          '—'
        ),
    },
    { key: 'plan', header: t('admin.colPlan'), cell: (p) => p.plan ?? '—' },
    {
      key: 'amount',
      header: t('admin.colAmount'),
      className: 'whitespace-nowrap tabular-nums',
      cell: (p) => (
        <>
          {f.peso(p.amount)}
          {p.refunded_amount ? <span className="block text-xs text-ash-573">{t('adminOps.refundedAmount', { amount: f.peso(p.refunded_amount) })}</span> : null}
        </>
      ),
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      cell: (p) => (
        <>
          <PaymentStatus status={p.status} />
          {p.failure_reason ? <span className="mt-1 block text-xs text-rust-600">{p.failure_reason}</span> : null}
        </>
      ),
    },
    { key: 'date', header: t('adminOps.colDate'), className: 'whitespace-nowrap text-ash-573', cell: (p) => f.dateTime(p.paid_at ?? p.created_at) },
  ]

  return (
    <Frame title={t('admin.paymentsTitle')} text={t('adminOps.paymentsText')}>
      {summary.isError ? (
        <ErrorState compact className="mb-4" error={summary.error} onRetry={() => void summary.refetch()} />
      ) : (
        <PaymentsSummaryCards summary={summary.data} />
      )}
      <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
        <SearchBox
          label={t('adminOps.paymentsSearch')}
          placeholder={t('adminOps.paymentsSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
        <div className="w-52">
          <Select
            aria-label={t('adminOps.filterStatus')}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">{t('adminOps.allStatuses')}</option>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(STATUS_LABEL[value] ?? 'adminOps.paymentPending')}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={list.data?.data}
        rowKey={(p) => p.id}
        minWidth="min-w-[860px]"
        loading={list.isPending}
        error={list.data ? undefined : list.error}
        onRetry={() => void list.refetch()}
        empty={t('admin.paymentsEmpty')}
      />
      <Pagination meta={list.data?.meta} onPage={setPage} disabled={list.isFetching} />
    </Frame>
  )
}
