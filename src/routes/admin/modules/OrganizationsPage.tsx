import { useId, useState } from 'react'
import { Plus, Trash2, UserMinus } from 'lucide-react'
import { SearchBox, endOfDayIso, useAdminFormat } from './shared'
import type { FormEvent } from 'react'

import type { Column } from '@/components/ui'
import type { MessageKey } from '@/i18n'
import type { Organization, OrganizationType } from '@/services/adminOps'
import {
  Banner,
  DataTable,
  Drawer,
  ErrorNote,
  Field,
  Frame,
  Modal,
  Pagination,
  Select,
  StatusPill,
  inputClass,
  primaryButton,
  secondaryButton,
  useConfirm,
} from '@/components/ui'
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useOrganizationActions, useOrganizations, useSubscriptions } from '@/queries/admin'
import { ORGANIZATION_TYPES } from '@/services/adminOps'

const TYPE_LABEL: Record<OrganizationType, MessageKey> = {
  school: 'adminOps.orgTypeSchool',
  division: 'adminOps.orgTypeDivision',
  other: 'adminOps.orgTypeOther',
}

type Draft = { name: string; type: OrganizationType; region: string; seats: string; subscription_plan_id: string; period_end: string }

const blank: Draft = { name: '', type: 'school', region: '', seats: '10', subscription_plan_id: '', period_end: '' }

function toDraft(org: Organization): Draft {
  return {
    name: org.name,
    type: org.type,
    region: org.region ?? '',
    seats: String(org.seats),
    subscription_plan_id: String(org.subscription_plan_id),
    period_end: org.period_end ? org.period_end.slice(0, 10) : '',
  }
}

export function OrganizationsPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const list = useOrganizations({ page, search })
  const [editing, setEditing] = useState<Organization | 'new' | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [deletedNotice, setDeletedNotice] = useState('')
  const opened = list.data?.data.find((org) => org.id === openId) ?? null

  const columns: Array<Column<Organization>> = [
    {
      key: 'name',
      header: t('admin.colName'),
      cell: (o) => (
        <>
          <span className="block font-medium">{o.name}</span>
          <span className="block text-xs text-ash-573">
            {t(TYPE_LABEL[o.type])}
            {o.region ? ` · ${o.region}` : ''}
          </span>
        </>
      ),
    },
    { key: 'plan', header: t('admin.colPlan'), cell: (o) => o.plan ?? '—' },
    { key: 'seats', header: t('adminOps.colSeats'), className: 'tabular-nums whitespace-nowrap', cell: (o) => `${f.number(o.seats_used)} / ${f.number(o.seats)}` },
    { key: 'period', header: t('adminOps.colPeriodEnd'), className: 'whitespace-nowrap text-ash-573', cell: (o) => f.date(o.period_end) },
    {
      key: 'status',
      header: t('admin.colStatus'),
      cell: (o) => (
        <StatusPill tone={o.active ? 'green' : 'gray'} dot>
          {o.active ? t('adminOps.orgActive') : t('adminOps.orgInactive')}
        </StatusPill>
      ),
    },
  ]

  return (
    <Frame title={t('adminOps.organizationsTitle')} text={t('adminOps.organizationsText')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          label={t('adminOps.orgSearch')}
          placeholder={t('adminOps.orgSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
        <button type="button" className={primaryButton} onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden />
          {t('adminOps.newOrganization')}
        </button>
      </div>
      {deletedNotice ? (
        <div role="status" className="mb-4">
          <Banner>{deletedNotice}</Banner>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        rows={list.data?.data}
        rowKey={(o) => o.id}
        minWidth="min-w-[760px]"
        loading={list.isPending}
        error={list.data ? undefined : list.error}
        onRetry={() => void list.refetch()}
        empty={t('adminOps.organizationsEmpty')}
        onRowClick={(o) => setOpenId(o.id)}
      />
      <Pagination meta={list.data?.meta} onPage={setPage} disabled={list.isFetching} />

      {editing ? <OrganizationForm organization={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
      {opened && !editing ? (
        <OrganizationDrawer
          organization={opened}
          onEdit={() => setEditing(opened)}
          onClose={() => setOpenId(null)}
          onDeleted={(name) => {
            setOpenId(null)
            setDeletedNotice(t('adminOps.organizationDeleted', { name }))
          }}
        />
      ) : null}
    </Frame>
  )
}

function OrganizationForm({ organization, onClose }: { organization: Organization | null; onClose: () => void }) {
  const { t } = useI18n()
  const plans = useSubscriptions()
  const { save } = useOrganizationActions()
  const [draft, setDraft] = useState<Draft>(organization ? toDraft(organization) : blank)
  const [error, setError] = useState('')
  const formId = useId()
  const paidPlans = (plans.data ?? []).filter((plan) => plan.active && plan.price > 0)
  const set = (key: keyof Draft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await save.mutateAsync({
        id: organization?.id ?? null,
        organization: {
          name: draft.name.trim(),
          type: draft.type,
          region: draft.region || null,
          seats: Number(draft.seats),
          subscription_plan_id: Number(draft.subscription_plan_id),
          period_end: endOfDayIso(draft.period_end) ?? '',
        },
      })
      onClose()
    } catch (caught) {
      setError(apiErrorMessage(caught, t('adminOps.actionFailed')))
    }
  }

  return (
    <Modal
      title={organization ? t('adminOps.editOrganization') : t('adminOps.newOrganization')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" form={formId} className={primaryButton} disabled={save.isPending}>
            {save.isPending ? t('common.saving') : t('common.save')}
          </button>
        </>
      }
    >
      <form id={formId} className="grid gap-4 pb-2 sm:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <Field label={t('admin.colName')} className="sm:col-span-2">
          <input required maxLength={160} value={draft.name} onChange={(event) => set('name')(event.target.value)} className={inputClass} />
        </Field>
        <Field label={t('adminOps.orgType')}>
          <Select value={draft.type} onChange={(event) => set('type')(event.target.value)}>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(TYPE_LABEL[type])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${t('admin.colRegion')} (${t('common.optional')})`}>
          <Select value={draft.region} onChange={(event) => set('region')(event.target.value)}>
            <option value="">{t('common.none')}</option>
            {PHILIPPINE_REGIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('adminOps.colSeats')}>
          <input required type="number" min={Math.max(1, organization?.seats_used ?? 1)} max={100000} value={draft.seats} onChange={(event) => set('seats')(event.target.value)} className={inputClass} />
        </Field>
        <Field label={t('admin.colPlan')}>
          <Select required value={draft.subscription_plan_id} onChange={(event) => set('subscription_plan_id')(event.target.value)}>
            <option value="" disabled>
              {t('adminOps.choosePaidPlan')}
            </option>
            {paidPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('adminOps.colPeriodEnd')}>
          <input required type="date" value={draft.period_end} onChange={(event) => set('period_end')(event.target.value)} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <ErrorNote>{error}</ErrorNote>
        </div>
      </form>
    </Modal>
  )
}

function OrganizationDrawer({
  organization,
  onEdit,
  onClose,
  onDeleted,
}: {
  organization: Organization
  onEdit: () => void
  onClose: () => void
  onDeleted: (name: string) => void
}) {
  const { t } = useI18n()
  const f = useAdminFormat()
  const { addMember, removeMember, remove } = useOrganizationActions()
  const [confirm, confirmDialog] = useConfirm()
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')
  const full = organization.seats_used >= organization.seats

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    const value = email.trim()
    if (!value) return
    try {
      const result = await addMember.mutateAsync({ id: organization.id, email: value })
      setNotice(result.status === 'attached' ? t('adminOps.memberAttached', { email: value }) : t('adminOps.memberInvited', { email: value }))
      setEmail('')
    } catch {
      // The error is shown below.
    }
  }

  async function onRemove(member: { id: number; name: string }) {
    const ok = await confirm({
      title: t('adminOps.removeMemberTitle', { name: member.name }),
      description: t('adminOps.removeMemberBody'),
      confirmLabel: t('adminOps.removeMember'),
      tone: 'danger',
    })
    if (ok) removeMember.mutate({ id: organization.id, userId: member.id })
  }

  async function onDelete() {
    const ok = await confirm({
      title: t('adminOps.deleteOrganizationTitle', { name: organization.name }),
      description: t('adminOps.deleteOrganizationBody', { count: organization.members.length }),
      confirmLabel: t('adminOps.deleteOrganization'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      await remove.mutateAsync(organization.id)
      onDeleted(organization.name)
    } catch {
      // The error is shown below.
    }
  }

  return (
    <Drawer
      title={organization.name}
      subtitle={t('adminOps.orgSubtitle', {
        type: t(TYPE_LABEL[organization.type]),
        plan: organization.plan ?? '—',
        end: f.date(organization.period_end),
      })}
      onClose={onClose}
    >
      {confirmDialog}
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            {t('adminOps.seatsUsed', { used: f.number(organization.seats_used), seats: f.number(organization.seats) })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryButton} onClick={onEdit}>
              {t('common.edit')}
            </button>
            <button type="button" className={`${secondaryButton} text-rust-600`} onClick={() => void onDelete()} disabled={remove.isPending}>
              <Trash2 size={16} aria-hidden />
              {t('adminOps.deleteOrganization')}
            </button>
          </div>
        </div>
        <ErrorNote>{remove.isError ? apiErrorMessage(remove.error, t('adminOps.actionFailed')) : ''}</ErrorNote>

        <form className="rounded-2xl border border-sand-86 bg-surface p-4" onSubmit={(event) => void onAdd(event)}>
          <p className="text-sm font-semibold">{t('adminOps.addMember')}</p>
          <p className="mt-1 text-xs text-ash-573">{t('adminOps.addMemberHelp')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="email"
              required
              aria-label={t('admin.email')}
              placeholder="teacher@deped.gov.ph"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
              disabled={full}
            />
            <button type="submit" className={primaryButton} disabled={addMember.isPending || full}>
              {t('adminOps.addMember')}
            </button>
          </div>
          {full ? <p className="mt-2 text-xs text-honey-694">{t('adminOps.seatsFull')}</p> : null}
          <div className="mt-3 space-y-2">
            {notice ? (
              <div role="status">
                <Banner>{notice}</Banner>
              </div>
            ) : null}
            <ErrorNote>{addMember.isError ? apiErrorMessage(addMember.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
            <ErrorNote>{removeMember.isError ? apiErrorMessage(removeMember.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
          </div>
        </form>

        <section>
          <h3 className="text-sm font-semibold">{t('adminOps.orgMembers', { count: organization.members.length })}</h3>
          {organization.members.length === 0 ? (
            <p className="mt-2 text-sm text-ash-573">{t('adminOps.orgNoMembers')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-sand-71 rounded-2xl border border-sand-86 bg-surface">
              {organization.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium">{member.name}</span>
                    <span className="block truncate text-xs text-ash-573">{member.email}</span>
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-rust-600 hover:underline"
                    onClick={() => void onRemove(member)}
                    disabled={removeMember.isPending}
                  >
                    <UserMinus size={14} aria-hidden />
                    {t('adminOps.removeMember')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">{t('adminOps.orgInvites', { count: organization.invites.length })}</h3>
          {organization.invites.length === 0 ? (
            <p className="mt-2 text-sm text-ash-573">{t('adminOps.orgNoInvites')}</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {organization.invites.map((invite) => (
                <li key={invite} className="rounded-full bg-sand-53 px-3 py-1 text-xs">
                  {invite}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  )
}
