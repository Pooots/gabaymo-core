import { useMemo, useState } from 'react'
import { Search, ShieldCheck, UsersRound } from 'lucide-react'

import { AccountStatusPill } from './PartnersPage'
import type { Column } from '@/components/ui'
import type { PermissionModule, RoleAccount, StaffRole } from '@/services/roles'
import { Banner, Card, DataTable, EmptyState, ErrorNote, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useRoleActions } from '@/queries/admin'
import { roleError } from '@/services/roles'

type Account = RoleAccount & { role: StaffRole }

/**
 * Every admin (staff) account, its role, and which admin modules it can open.
 */
export function AdminAccountsTab({
  roles,
  modules,
  loading,
  onOpenRole,
}: {
  roles: Array<StaffRole>
  modules: Array<PermissionModule>
  loading: boolean
  onOpenRole: (role: StaffRole) => void
}) {
  const { t, tn } = useI18n()
  const [query, setQuery] = useState('')
  const actions = useRoleActions()
  const [confirm, confirmDialog] = useConfirm()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const busy = actions.suspend.isPending || actions.unsuspend.isPending

  async function onSuspend(account: Account) {
    const ok = await confirm({
      title: t('adminOps.suspendStaffTitle', { name: account.name }),
      description: t('adminOps.suspendStaffBody'),
      confirmLabel: t('adminOps.suspend'),
      tone: 'danger',
    })
    if (!ok) return
    setNotice('')
    setError('')
    try {
      await actions.suspend.mutateAsync({ roleId: account.role.id, adminId: account.id })
      setNotice(t('adminOps.staffSuspended', { name: account.name }))
    } catch (caught) {
      setError(roleError(caught))
    }
  }

  async function onUnsuspend(account: Account) {
    setNotice('')
    setError('')
    try {
      await actions.unsuspend.mutateAsync({ roleId: account.role.id, adminId: account.id })
      setNotice(t('adminOps.staffUnsuspended', { name: account.name }))
    } catch (caught) {
      setError(roleError(caught))
    }
  }

  const accounts = useMemo<Array<Account>>(
    () =>
      roles
        .flatMap((role) => role.accounts.map((account) => ({ ...account, role })))
        .sort((a, b) => Number(b.role.is_system) - Number(a.role.is_system) || a.name.localeCompare(b.name)),
    [roles],
  )

  const labels = useMemo(() => new Map(modules.map((item) => [item.key, item.label])), [modules])

  const needle = query.trim().toLowerCase()
  const visible = accounts.filter(
    (account) => !needle || [account.name, account.email, account.role.name].some((value) => value.toLowerCase().includes(needle)),
  )

  const fullAccess = accounts.filter((account) => account.role.is_system).length

  const columns: Array<Column<Account>> = [
    {
      key: 'account',
      header: t('admin.accountsColAccount'),
      cell: (account) => (
        <>
          <span className="block font-medium">{account.name}</span>
          <span className="mt-0.5 block text-xs text-ash-573">{account.email}</span>
        </>
      ),
    },
    {
      key: 'role',
      header: t('admin.accountsColRole'),
      className: 'whitespace-nowrap',
      cell: (account) => (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            className="hover:underline"
            title={t('admin.accountsOpenRole', { name: account.role.name })}
            onClick={(event) => {
              event.stopPropagation()
              onOpenRole(account.role)
            }}
          >
            {account.role.name}
          </button>
          {account.role.is_system ? (
            <span className="rounded-full bg-ash-910 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              {t('admin.adminBadge')}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      cell: (account) => <AccountStatusPill status={account.status ?? 'active'} />,
    },
    {
      key: 'access',
      header: t('admin.accountsColAccess'),
      cell: (account) =>
        account.role.is_system ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-53 px-2.5 py-1 text-xs font-medium text-brand-strong">
            <ShieldCheck size={13} aria-hidden />
            {t('admin.accountsAllModules', { count: modules.length })}
          </span>
        ) : account.role.permissions.length === 0 ? (
          <span className="text-xs text-rust-600">{t('admin.accountsNoModules')}</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {account.role.permissions.map((key) => (
              <span key={key} className="rounded-full bg-sand-53 px-2.5 py-1 text-xs text-ash-773">
                {labels.get(key) ?? key}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: 'actions',
      header: t('adminOps.colActions'),
      className: 'whitespace-nowrap text-right',
      cell: (account) =>
        account.status === 'invited' ? null : (
          <button
            type="button"
            aria-label={`${account.status === 'suspended' ? t('adminOps.unsuspend') : t('adminOps.suspend')}: ${account.name}`}
            className={`text-xs font-medium hover:underline ${account.status === 'suspended' ? 'text-brand' : 'text-rust-600'}`}
            disabled={busy}
            onClick={(event) => {
              event.stopPropagation()
              void (account.status === 'suspended' ? onUnsuspend(account) : onSuspend(account))
            }}
          >
            {account.status === 'suspended' ? t('adminOps.unsuspend') : t('adminOps.suspend')}
          </button>
        ),
    },
  ]

  return (
    <div>
      {confirmDialog}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex h-11 w-full max-w-sm items-center gap-2 rounded-full border border-sand-86 bg-surface px-4 text-sm">
          <Search size={16} className="text-ash-459" aria-hidden />
          <span className="sr-only">{t('admin.accountsSearchLabel')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('admin.accountsSearch')}
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ash-459"
          />
        </label>
        {!loading ? (
          <p className="text-xs text-ash-573">
            {t('admin.accountsSummary', {
              accounts: tn('admin.accountsCount', accounts.length),
              full: fullAccess,
              limited: accounts.length - fullAccess,
            })}
          </p>
        ) : null}
      </div>

      {notice ? (
        <div role="status" className="mb-4">
          <Banner>{notice}</Banner>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      ) : null}

      {!loading && accounts.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState icon={UsersRound} title={t('admin.accountsEmptyTitle')}>
            {t('admin.accountsEmptyBody')}
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(account) => account.id}
          loading={loading}
          minWidth="min-w-[760px]"
          empty={t('admin.accountsNoMatch')}
          onRowClick={(account) => onOpenRole(account.role)}
        />
      )}
    </div>
  )
}
