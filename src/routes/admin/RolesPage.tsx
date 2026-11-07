import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { AdminAccountsTab } from './AdminAccountsTab'
import { AccountStatusPill, ResetNotice } from './PartnersPage'
import { RoleAccessForm } from './roles/RoleAccessForm'
import type { FormEvent } from 'react'
import type { ResetResult } from '@/services/adminOps'
import type { RoleAccount, StaffRole } from '@/services/roles'
import type { RolesData } from '@/queries/admin'
import { ErrorState, LoadingState, Tabs, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { adminKeys, useRoleActions, useRoles } from '@/queries/admin'
import { roleError } from '@/services/roles'

type Draft = {
  name: string
  description: string
  permissions: Array<string>
}

const blank: Draft = { name: '', description: '', permissions: ['overview'] }

export function RolesPage() {
  const { t, tn } = useI18n()
  const client = useQueryClient()
  const rolesQuery = useRoles()
  const actions = useRoleActions()
  const [confirm, confirmDialog] = useConfirm()
  const modules = rolesQuery.data?.modules ?? []
  const roles = rolesQuery.data?.roles ?? []
  const loading = rolesQuery.isPending
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState<'roles' | 'accounts'>('roles')
  const pending = actions.save.isPending || actions.remove.isPending || actions.invite.isPending
  const [reset, setReset] = useState<{ result: ResetResult; email: string } | null>(null)

  // Open the admin role (else the first) once the list first arrives.
  if (!seeded && rolesQuery.data) {
    setSeeded(true)
    const admin = rolesQuery.data.roles.find((role) => role.is_system) ?? rolesQuery.data.roles[0]
    if (admin) {
      setSelectedId(admin.id)
      setDraft(toDraft(admin))
    }
  }

  const selected = roles.find((role) => role.id === selectedId) ?? null
  const groups = [...new Set(modules.map((item) => item.group))]
  /** Latest roles after a mutation (the mutation resolves once the list has refetched). */
  const freshRoles = () => client.getQueryData<RolesData>(adminKeys.roles())?.roles ?? []

  function selectRole(role: StaffRole) {
    setSelectedId(role.id)
    setDraft(toDraft(role))
    setError('')
    setNotice('')
    setReset(null)
  }

  function startNew() {
    setSelectedId(null)
    setDraft(blank)
    setError('')
    setNotice('')
  }

  function togglePermission(key: string) {
    if (selected?.is_system) return
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(key)
        ? current.permissions.filter((item) => item !== key)
        : [...current.permissions, key],
    }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      const saved = await actions.save.mutateAsync({
        id: selectedId,
        role: { name: draft.name.trim(), description: draft.description.trim() || null, permissions: draft.permissions },
      })
      setSelectedId(saved.id)
      setDraft(toDraft(freshRoles().find((role) => role.id === saved.id) ?? saved))
      setNotice(selectedId ? t('admin.rolesUpdated') : t('admin.rolesCreated'))
    } catch (caught) {
      setError(roleError(caught))
    }
  }

  async function onResend(account: RoleAccount) {
    if (!selected) return
    setError('')
    setReset(null)
    try {
      await actions.resendInvite.mutateAsync({ roleId: selected.id, adminId: account.id })
      setNotice(t('adminOps.inviteResent', { email: account.email }))
    } catch (caught) {
      setError(roleError(caught))
    }
  }

  async function onReset(account: RoleAccount) {
    if (!selected) return
    const ok = await confirm({
      title: t('adminOps.resetPasswordTitle', { name: account.name }),
      description: t('adminOps.resetPasswordBody', { email: account.email }),
      confirmLabel: t('adminOps.resetPassword'),
    })
    if (!ok) return
    setError('')
    setNotice('')
    try {
      const result = await actions.resetPassword.mutateAsync({ roleId: selected.id, adminId: account.id })
      setReset({ result, email: account.email })
    } catch (caught) {
      setError(roleError(caught))
    }
  }

  async function onAddPerson(person: { name: string; email: string }) {
    if (!selected) return false
    setError('')
    setNotice('')
    setReset(null)
    try {
      const saved = await actions.invite.mutateAsync({ roleId: selected.id, account: person })
      setDraft(toDraft(freshRoles().find((role) => role.id === saved.role.id) ?? saved.role))
      setNotice(t('adminOps.inviteSent', { email: person.email }))
      return true
    } catch (caught) {
      setError(roleError(caught))
      return false
    }
  }

  async function onDelete() {
    if (!selected || selected.is_system) return
    const ok = await confirm({
      title: t('admin.rolesRemoveTitle', { name: selected.name }),
      description: t('admin.rolesRemoveBody'),
      confirmLabel: t('admin.rolesRemove'),
      tone: 'danger',
    })
    if (!ok) return
    setError('')
    try {
      await actions.remove.mutateAsync(selected.id)
      const next = freshRoles()[0]
      if (next) selectRole(next)
      else startNew()
      setNotice(t('admin.rolesRemoved'))
    } catch (caught) {
      setError(roleError(caught))
    }
  }

  const accountCount = roles.reduce((total, role) => total + role.accounts.length, 0)

  return (
    <div className="w-full">
      {confirmDialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">{t('admin.rolesTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-573">{t('admin.rolesText')}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ash-910 px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            setTab('roles')
            startNew()
          }}
        >
          {t('admin.rolesAdd')}
        </button>
      </div>

      <div className="mt-6 inline-flex">
        <Tabs
          label={t('admin.rolesTitle')}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'roles', label: t('admin.rolesTab'), count: loading ? undefined : roles.length },
            { id: 'accounts', label: t('admin.accountsTab'), count: loading ? undefined : accountCount },
          ]}
        />
      </div>

      {rolesQuery.isError && !rolesQuery.data ? (
        <ErrorState
          className="mt-4"
          error={rolesQuery.error}
          retrying={rolesQuery.isFetching}
          onRetry={() => void rolesQuery.refetch()}
        />
      ) : tab === 'accounts' ? (
        <div className="mt-4">
          <AdminAccountsTab
            roles={roles}
            modules={modules}
            loading={loading}
            onOpenRole={(role) => {
              selectRole(role)
              setTab('roles')
            }}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <section className="rounded-3xl border border-sand-86 bg-surface" aria-label={t('admin.rolesTab')}>
              {loading ? (
                <LoadingState rows={3} label={t('admin.rolesLoading')} className="p-4" />
              ) : (
                <ul>
                  {roles.map((role) => (
                    <li key={role.id} className="border-b border-sand-59 last:border-0">
                      <button
                        type="button"
                        aria-current={role.id === selectedId ? 'true' : undefined}
                        className={`w-full px-5 py-4 text-left ${role.id === selectedId ? 'bg-ash-40' : 'hover:bg-ash-24'}`}
                        onClick={() => selectRole(role)}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium">{role.name}</span>
                          {role.is_system ? (
                            <span className="rounded-full bg-ash-910 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                              {t('admin.adminBadge')}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs text-ash-573">
                          {tn('admin.rolesAccounts', role.accounts.length)} ·{' '}
                          {t('admin.rolesModules', { count: role.permissions.length })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <form className="rounded-3xl border border-sand-86 bg-surface p-5 sm:p-6" onSubmit={(event) => void onSubmit(event)}>
              <h2 className="text-lg font-semibold">{selected ? selected.name : t('admin.rolesNew')}</h2>
              {selected?.is_system ? <p className="mt-1 text-xs text-ash-573">{t('admin.rolesSystemNote')}</p> : null}

              <div className="mt-5 grid gap-4">
                <label>
                  <span className="mb-1.5 block text-xs font-medium tracking-wide text-ash-573 uppercase">{t('admin.rolesName')}</span>
                  <input
                    required
                    disabled={selected?.is_system}
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium tracking-wide text-ash-573 uppercase">
                    {t('admin.rolesDescription')}
                  </span>
                  <input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={inputClass} />
                </label>
              </div>

              <div className="mt-6 space-y-4">
                {groups.map((group) => (
                  <fieldset key={group}>
                    <legend className="text-xs font-semibold tracking-[0.14em] text-sand-424 uppercase">{group}</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {modules
                        .filter((item) => item.group === group)
                        .map((item) => (
                          <label key={item.key} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={draft.permissions.includes(item.key)}
                              disabled={selected?.is_system}
                              onChange={() => togglePermission(item.key)}
                            />
                            {item.label}
                          </label>
                        ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              {selected ? (
                <div className="mt-6 rounded-2xl bg-ash-40 p-4">
                  <p className="text-sm font-medium">{t('admin.rolesAccountsHeading')}</p>
                  {selected.accounts.length === 0 ? (
                    <p className="mt-2 text-sm text-ash-573">{t('admin.rolesNoAccounts')}</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {selected.accounts.map((account) => (
                        <li key={account.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 font-medium">
                              {account.name}
                              <AccountStatusPill status={account.status ?? 'active'} />
                            </span>
                            <span className="mt-0.5 block text-xs break-all text-ash-573">{account.email}</span>
                          </span>
                          {account.status === 'invited' ? (
                            <button type="button" className="text-xs font-medium text-brand hover:underline" disabled={pending} onClick={() => void onResend(account)}>
                              {t('adminOps.resendInvite')}
                            </button>
                          ) : (
                            <button type="button" className="text-xs font-medium text-brand hover:underline" disabled={pending} onClick={() => void onReset(account)}>
                              {t('adminOps.resetPassword')}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {error ? (
                <p role="alert" className="mt-4 rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p role="status" className="mt-4 rounded-xl bg-moss-49 px-3 py-2 text-sm text-brand-strong">
                  {notice}
                </p>
              ) : null}
              {reset ? (
                <div role="status" className="mt-4">
                  <ResetNotice result={reset.result} email={reset.email} />
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="submit" className="btn-primary h-11 px-5" disabled={pending}>
                  {actions.save.isPending ? t('common.saving') : selected ? t('admin.rolesSave') : t('admin.rolesCreate')}
                </button>
                {selected && !selected.is_system ? (
                  <button
                    type="button"
                    className="h-11 rounded-full border border-sand-124 px-5 text-sm font-medium"
                    disabled={pending}
                    onClick={() => void onDelete()}
                  >
                    {t('admin.rolesRemove')}
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          {selected ? (
            <RoleAccessForm key={selected.id} pending={pending} inputClass={inputClass} onSubmit={onAddPerson} />
          ) : null}
        </>
      )}
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-2xl border border-sand-124 bg-ash-14 px-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-sand-59'

function toDraft(role: StaffRole): Draft {
  return {
    name: role.name,
    description: role.description ?? '',
    permissions: role.permissions,
  }
}
