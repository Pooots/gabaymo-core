import { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { SearchBox, codeTone, endOfDayIso, useAdminFormat } from './shared'
import type { FormEvent } from 'react'

import type { Column } from '@/components/ui'
import type { MessageKey } from '@/i18n'
import type { AccessKey, ReferralCode } from '@/services/adminOps'
import {
  Banner,
  DataTable,
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
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useAccessKeyActions, useAccessKeys, useReferralCodeActions, useReferralCodes, useSubscriptions } from '@/queries/admin'

const CODE_STATUS: Record<string, MessageKey> = {
  active: 'adminOps.codeActive',
  revoked: 'adminOps.codeRevoked',
  used_up_or_expired: 'adminOps.codeUsedUp',
}

function CodeStatus({ status }: { status: string }) {
  const { t } = useI18n()
  const label = CODE_STATUS[status]
  return (
    <StatusPill tone={codeTone(status)} dot>
      {label ? t(label) : status}
    </StatusPill>
  )
}

function CopyCode({ code }: { code: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="font-mono text-sm font-medium hover:underline"
      title={t('common.copy')}
      onClick={(event) => {
        event.stopPropagation()
        void navigator.clipboard.writeText(code).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {code}
      {copied ? <span className="ml-2 font-sans text-xs text-brand">{t('common.copied')}</span> : null}
    </button>
  )
}

const intOrNull = (value: string) => (value.trim() === '' ? null : Number(value))

// ── Access keys ─────────────────────────────────────────────────────────

const blankKey = { kind: 'plan' as 'plan' | 'usage', plan_id: '', extra_usage_percent: '', duration_days: '30', max_uses: '1', expires_at: '', note: '' }

export function AccessKeysPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const list = useAccessKeys({ page, search })
  const actions = useAccessKeyActions()
  const plans = useSubscriptions()
  const [confirm, confirmDialog] = useConfirm()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blankKey)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<AccessKey | null>(null)
  const formId = useId()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const key = await actions.create.mutateAsync({
        plan_id: form.kind === 'plan' ? intOrNull(form.plan_id) : null,
        extra_usage_percent: form.kind === 'usage' ? intOrNull(form.extra_usage_percent) : null,
        duration_days: form.kind === 'plan' ? intOrNull(form.duration_days) : null,
        max_uses: Number(form.max_uses),
        expires_at: endOfDayIso(form.expires_at),
        note: form.note.trim() || null,
      })
      setCreated(key)
      setForm(blankKey)
      setOpen(false)
    } catch (caught) {
      setError(apiErrorMessage(caught, t('adminOps.actionFailed')))
    }
  }

  async function revoke(key: AccessKey) {
    const ok = await confirm({
      title: t('adminOps.revokeKeyTitle', { code: key.code }),
      description: t('adminOps.revokeKeyBody'),
      confirmLabel: t('common.revoke'),
      tone: 'danger',
    })
    if (ok) actions.revoke.mutate(key.id)
  }

  const columns: Array<Column<AccessKey>> = [
    { key: 'code', header: t('admin.colKey'), cell: (k) => <CopyCode code={k.code} /> },
    {
      key: 'grants',
      header: t('adminOps.colGrants'),
      cell: (k) =>
        k.plan
          ? t('adminOps.grantPlan', { plan: k.plan, days: k.duration_days ?? '—' })
          : t('adminOps.grantUsage', { percent: k.extra_usage_percent ?? 0 }),
    },
    { key: 'uses', header: t('admin.colUses'), className: 'tabular-nums whitespace-nowrap', cell: (k) => `${f.number(k.uses_count)} / ${f.number(k.max_uses)}` },
    { key: 'expires', header: t('adminOps.colExpires'), className: 'whitespace-nowrap text-ash-573', cell: (k) => (k.expires_at ? f.date(k.expires_at) : t('adminOps.never')) },
    { key: 'note', header: t('adminOps.colNote'), className: 'text-ash-573', cell: (k) => k.note ?? '' },
    { key: 'status', header: t('admin.colStatus'), cell: (k) => <CodeStatus status={k.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">{t('adminOps.colActions')}</span>,
      className: 'text-right',
      cell: (k) =>
        k.status === 'revoked' ? null : (
          <button type="button" className="text-sm font-medium text-rust-600 hover:underline" onClick={() => void revoke(k)} disabled={actions.revoke.isPending}>
            {t('common.revoke')}
          </button>
        ),
    },
  ]

  const set = (key: keyof typeof blankKey) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <Frame title={t('admin.accessKeysTitle')} text={t('adminOps.accessKeysText')}>
      {confirmDialog}
      {created ? (
        <div role="status" className="mb-4">
          <Banner>
            {t('adminOps.keyCreated')} <CopyCode code={created.code} />
          </Banner>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          label={t('adminOps.codesSearch')}
          placeholder={t('adminOps.codesSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
        <button type="button" className={primaryButton} onClick={() => setOpen(true)}>
          <Plus size={16} aria-hidden />
          {t('adminOps.newAccessKey')}
        </button>
      </div>
      <ErrorNote>{actions.revoke.isError ? apiErrorMessage(actions.revoke.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
      <DataTable
        columns={columns}
        rows={list.data?.data}
        rowKey={(k) => k.id}
        minWidth="min-w-[900px]"
        loading={list.isPending}
        error={list.data ? undefined : list.error}
        onRetry={() => void list.refetch()}
        empty={t('admin.accessKeysEmpty')}
      />
      <Pagination meta={list.data?.meta} onPage={setPage} disabled={list.isFetching} />

      {open ? (
        <Modal
          title={t('adminOps.newAccessKey')}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="submit" form={formId} className={primaryButton} disabled={actions.create.isPending}>
                {actions.create.isPending ? t('common.saving') : t('adminOps.createKey')}
              </button>
            </>
          }
        >
          <form id={formId} className="grid gap-4 pb-2 sm:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-xs font-medium text-moss-731">{t('adminOps.keyGrants')}</legend>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="kind" checked={form.kind === 'plan'} onChange={() => set('kind')('plan')} />
                  {t('adminOps.keyKindPlan')}
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="kind" checked={form.kind === 'usage'} onChange={() => set('kind')('usage')} />
                  {t('adminOps.keyKindUsage')}
                </label>
              </div>
            </fieldset>
            {form.kind === 'plan' ? (
              <>
                <Field label={t('admin.colPlan')}>
                  <Select required value={form.plan_id} onChange={(event) => set('plan_id')(event.target.value)}>
                    <option value="" disabled>
                      {t('adminOps.choosePlan')}
                    </option>
                    {(plans.data ?? []).map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('adminOps.durationDays')}>
                  <input type="number" min={1} max={1095} value={form.duration_days} onChange={(event) => set('duration_days')(event.target.value)} className={inputClass} />
                </Field>
              </>
            ) : (
              <Field label={t('adminOps.extraUsagePercent')}>
                <input required type="number" min={1} max={500} value={form.extra_usage_percent} onChange={(event) => set('extra_usage_percent')(event.target.value)} className={inputClass} />
              </Field>
            )}
            <Field label={t('adminOps.maxUses')}>
              <input required type="number" min={1} max={100000} value={form.max_uses} onChange={(event) => set('max_uses')(event.target.value)} className={inputClass} />
            </Field>
            <Field label={`${t('adminOps.expiresAt')} (${t('common.optional')})`}>
              <input type="date" value={form.expires_at} onChange={(event) => set('expires_at')(event.target.value)} className={inputClass} />
            </Field>
            <Field label={`${t('adminOps.colNote')} (${t('common.optional')})`} className="sm:col-span-2">
              <input maxLength={200} value={form.note} onChange={(event) => set('note')(event.target.value)} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <ErrorNote>{error}</ErrorNote>
            </div>
          </form>
        </Modal>
      ) : null}
    </Frame>
  )
}

// ── Referral codes ──────────────────────────────────────────────────────

const blankReferral = { code: '', owner_user_id: '', reward_extra_usage_percent: '10', max_uses: '', expires_at: '' }

export function ReferralCodesPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const list = useReferralCodes({ page, search })
  const actions = useReferralCodeActions()
  const [confirm, confirmDialog] = useConfirm()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blankReferral)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<ReferralCode | null>(null)
  const formId = useId()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const code = await actions.create.mutateAsync({
        code: form.code.trim() || null,
        owner_user_id: intOrNull(form.owner_user_id),
        reward_extra_usage_percent: Number(form.reward_extra_usage_percent),
        max_uses: intOrNull(form.max_uses),
        expires_at: endOfDayIso(form.expires_at),
      })
      setCreated(code)
      setForm(blankReferral)
      setOpen(false)
    } catch (caught) {
      setError(apiErrorMessage(caught, t('adminOps.actionFailed')))
    }
  }

  async function revoke(code: ReferralCode) {
    const ok = await confirm({
      title: t('adminOps.revokeReferralTitle', { code: code.code }),
      description: t('adminOps.revokeReferralBody'),
      confirmLabel: t('common.revoke'),
      tone: 'danger',
    })
    if (ok) actions.revoke.mutate(code.id)
  }

  const columns: Array<Column<ReferralCode>> = [
    { key: 'code', header: t('admin.colCode'), cell: (c) => <CopyCode code={c.code} /> },
    { key: 'owner', header: t('admin.colOwner'), cell: (c) => (c.owner ? `${c.owner.name} · ${c.owner.email}` : t('adminOps.noOwner')) },
    { key: 'reward', header: t('adminOps.colReward'), cell: (c) => t('adminOps.grantUsage', { percent: c.reward_extra_usage_percent }) },
    {
      key: 'uses',
      header: t('admin.colUses'),
      className: 'tabular-nums whitespace-nowrap',
      cell: (c) => (c.max_uses ? `${f.number(c.uses_count)} / ${f.number(c.max_uses)}` : f.number(c.uses_count)),
    },
    { key: 'expires', header: t('adminOps.colExpires'), className: 'whitespace-nowrap text-ash-573', cell: (c) => (c.expires_at ? f.date(c.expires_at) : t('adminOps.never')) },
    { key: 'status', header: t('admin.colStatus'), cell: (c) => <CodeStatus status={c.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">{t('adminOps.colActions')}</span>,
      className: 'text-right',
      cell: (c) =>
        c.status === 'revoked' ? null : (
          <button type="button" className="text-sm font-medium text-rust-600 hover:underline" onClick={() => void revoke(c)} disabled={actions.revoke.isPending}>
            {t('common.revoke')}
          </button>
        ),
    },
  ]

  const set = (key: keyof typeof blankReferral) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <Frame title={t('admin.referralTitle')} text={t('adminOps.referralText')}>
      {confirmDialog}
      {created ? (
        <div role="status" className="mb-4">
          <Banner>
            {t('adminOps.referralCreated')} <CopyCode code={created.code} />
          </Banner>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          label={t('adminOps.codesSearch')}
          placeholder={t('adminOps.codesSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
        <button type="button" className={primaryButton} onClick={() => setOpen(true)}>
          <Plus size={16} aria-hidden />
          {t('adminOps.newReferral')}
        </button>
      </div>
      <ErrorNote>{actions.revoke.isError ? apiErrorMessage(actions.revoke.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
      <DataTable
        columns={columns}
        rows={list.data?.data}
        rowKey={(c) => c.id}
        minWidth="min-w-[860px]"
        loading={list.isPending}
        error={list.data ? undefined : list.error}
        onRetry={() => void list.refetch()}
        empty={t('admin.referralEmpty')}
      />
      <Pagination meta={list.data?.meta} onPage={setPage} disabled={list.isFetching} />

      {open ? (
        <Modal
          title={t('adminOps.newReferral')}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="submit" form={formId} className={primaryButton} disabled={actions.create.isPending}>
                {actions.create.isPending ? t('common.saving') : t('adminOps.createReferral')}
              </button>
            </>
          }
        >
          <form id={formId} className="grid gap-4 pb-2 sm:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
            <Field label={`${t('admin.colCode')} (${t('common.optional')})`}>
              <input
                value={form.code}
                maxLength={40}
                pattern="[A-Za-z0-9-]{4,40}"
                placeholder={t('adminOps.codeAuto')}
                onChange={(event) => set('code')(event.target.value.toUpperCase())}
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label={t('adminOps.rewardPercent')}>
              <input required type="number" min={1} max={500} value={form.reward_extra_usage_percent} onChange={(event) => set('reward_extra_usage_percent')(event.target.value)} className={inputClass} />
            </Field>
            <Field label={`${t('adminOps.ownerMemberId')} (${t('common.optional')})`}>
              <input type="number" min={1} value={form.owner_user_id} onChange={(event) => set('owner_user_id')(event.target.value)} className={inputClass} />
            </Field>
            <Field label={`${t('adminOps.maxUses')} (${t('common.optional')})`}>
              <input type="number" min={1} max={100000} value={form.max_uses} onChange={(event) => set('max_uses')(event.target.value)} className={inputClass} />
            </Field>
            <Field label={`${t('adminOps.expiresAt')} (${t('common.optional')})`}>
              <input type="date" value={form.expires_at} onChange={(event) => set('expires_at')(event.target.value)} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <ErrorNote>{error}</ErrorNote>
            </div>
          </form>
        </Modal>
      ) : null}
    </Frame>
  )
}
