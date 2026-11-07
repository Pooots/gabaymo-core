import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { SearchBox, useAdminFormat } from './shared'
import type { Column } from '@/components/ui'
import type { AdminMember, MemberStatusFilter } from '@/services/adminOps'
import { DataTable, ErrorState, Frame, Pagination, StatusPill, Tabs } from '@/components/ui'
import { UsageBar } from '@/components/usage/UsageMeter'
import { useI18n } from '@/i18n'
import { useMembers } from '@/queries/admin'
import { formatPercent } from '@/services/usage'

/** Status pill for a member: suspended wins over the subscription status. */
export function MemberStatus({ member }: { member: AdminMember }) {
  const { t } = useI18n()
  if (member.suspended) return <StatusPill tone="red">{t('adminOps.memberSuspended')}</StatusPill>
  const status = member.subscription?.status ?? 'trial'
  if (status === 'active') {
    return (
      <StatusPill tone="green" dot>
        {member.subscription?.cancel_at_period_end ? t('adminOps.subCancelling') : t('adminOps.subActive')}
      </StatusPill>
    )
  }
  if (status === 'cancelled') return <StatusPill tone="amber">{t('adminOps.subCancelled')}</StatusPill>
  if (status === 'expired') return <StatusPill tone="gray">{t('adminOps.subExpired')}</StatusPill>
  return <StatusPill tone="gray">{t('adminOps.subTrial')}</StatusPill>
}

export function MembersPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MemberStatusFilter>('')
  const members = useMembers({ page, search, status })
  const ready = members.data !== undefined

  const columns: Array<Column<AdminMember>> = [
    {
      key: 'name',
      header: t('admin.colName'),
      className: 'font-medium whitespace-nowrap',
      cell: (member) => (
        <Link
          to="/admin/members/$memberId"
          params={{ memberId: String(member.id) }}
          onClick={(event) => event.stopPropagation()}
          className="hover:underline"
        >
          {member.name}
        </Link>
      ),
    },
    { key: 'region', header: t('admin.colRegion'), cell: (member) => member.region },
    { key: 'email', header: t('admin.colEmail'), className: 'text-muted', cell: (member) => member.email },
    { key: 'plan', header: t('admin.colPlan'), cell: (member) => member.plan },
    { key: 'status', header: t('admin.colStatus'), cell: (member) => <MemberStatus member={member} /> },
    {
      key: 'usage',
      header: t('admin.colUsage'),
      className: 'whitespace-nowrap',
      cell: (member) => (
        <span className="flex items-center gap-2">
          <span className="block w-16">
            <UsageBar usage={member.usage} className="h-1.5" />
          </span>
          <span className="tabular-nums">{formatPercent(member.usage.percent_used)}</span>
        </span>
      ),
    },
    { key: 'joined', header: t('admin.colJoined'), className: 'whitespace-nowrap text-muted', cell: (member) => f.date(member.joined_at) },
  ]

  const tabs: Array<{ id: MemberStatusFilter; label: string }> = [
    { id: '', label: t('admin.membersAll') },
    { id: 'active', label: t('adminOps.subActive') },
    { id: 'trial', label: t('adminOps.subTrial') },
    { id: 'cancelled', label: t('adminOps.subCancelled') },
    { id: 'expired', label: t('adminOps.subExpired') },
    { id: 'suspended', label: t('adminOps.memberSuspended') },
  ]

  return (
    <Frame title={t('admin.membersTitle')} text={t('admin.membersText')}>
      {members.isError && ready ? (
        <ErrorState compact className="mb-4" error={members.error} onRetry={() => void members.refetch()} />
      ) : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          label={t('admin.membersSearchLabel')}
          placeholder={t('admin.membersSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
        <Tabs
          label={t('adminOps.filterStatus')}
          tabs={tabs}
          value={status}
          onChange={(next) => {
            setStatus(next)
            setPage(1)
          }}
        />
      </div>
      <DataTable
        columns={columns}
        rows={members.data?.data}
        rowKey={(member) => member.id}
        minWidth="min-w-[820px]"
        loading={members.isPending}
        error={ready ? undefined : members.error}
        onRetry={() => void members.refetch()}
        empty={search || status ? t('admin.membersNoMatch') : t('admin.membersEmpty')}
        onRowClick={(member) => void navigate({ to: '/admin/members/$memberId', params: { memberId: String(member.id) } })}
      />
      <Pagination meta={members.data?.meta} onPage={setPage} disabled={members.isFetching} />
    </Frame>
  )
}
