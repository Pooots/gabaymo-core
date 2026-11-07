import { useId, useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { SearchBox, useAdminFormat } from './modules/shared'
import type { FormEvent } from 'react'

import type { Column, StatusTone } from '@/components/ui'
import type { AccountStatus, AdminPartner, ResetResult } from '@/services/adminOps'
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
  dangerButton,
  inputClass,
  primaryButton,
  secondaryButton,
  useConfirm,
} from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { usePartnerActions, usePartners } from '@/queries/admin'
import { PRACTICE_AREAS, partnerAccountStatus } from '@/services/adminOps'

const STATUS_TONE: Record<AccountStatus, StatusTone> = { invited: 'amber', active: 'green', suspended: 'red' }

export function AccountStatusPill({ status }: { status: AccountStatus }) {
  const { t } = useI18n()
  const label = status === 'invited' ? t('adminOps.statusInvited') : status === 'suspended' ? t('adminOps.statusSuspended') : t('adminOps.statusActive')
  return (
    <StatusPill tone={STATUS_TONE[status]} dot>
      {label}
    </StatusPill>
  )
}

/** One-time notice after a reset: the emailed link (section D), or an old-style temporary password. */
export function ResetNotice({ result, email }: { result: ResetResult; email: string }) {
  const { t } = useI18n()
  if (result.temporary_password) {
    return (
      <Banner tone="warning">
        {t('adminOps.temporaryPassword', { email })} <code className="font-mono font-semibold">{result.temporary_password}</code>
      </Banner>
    )
  }
  return <Banner>{t('adminOps.resetEmailed', { email })}</Banner>
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  specialty: '',
  title: '',
  response_hours: '24',
  partner_status: 'active',
  practice_areas: [] as Array<string>,
}

export function PartnersPage() {
  const { t, tn } = useI18n()
  const f = useAdminFormat()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const partners = usePartners({ page, search })
  const actions = usePartnerActions()
  const [confirm, confirmDialog] = useConfirm()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ kind: 'text'; text: string } | { kind: 'reset'; result: ResetResult; email: string } | null>(null)
  const [suspending, setSuspending] = useState<AdminPartner | null>(null)
  const [reason, setReason] = useState('')
  const [menu, setMenu] = useState<number | null>(null)

  const failed = actions.unsuspend.error ?? actions.resetPassword.error ?? actions.resendInvite.error

  function close() {
    setOpen(false)
    setError('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await actions.invite.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.replace(/[\s-]/g, '') || undefined,
        specialty: form.specialty.trim() || undefined,
        title: form.title.trim() || undefined,
        response_hours: Number(form.response_hours),
        partner_status: form.partner_status,
        practice_areas: form.practice_areas,
      })
      setNotice({ kind: 'text', text: t('adminOps.inviteSent', { email: form.email.trim() }) })
      setForm(emptyForm)
      setOpen(false)
    } catch (caught) {
      setError(apiErrorMessage(caught, t('adminOps.actionFailed')))
    }
  }

  async function onReset(partner: AdminPartner) {
    setMenu(null)
    const ok = await confirm({
      title: t('adminOps.resetPasswordTitle', { name: partner.name }),
      description: t('adminOps.resetPasswordBody', { email: partner.email }),
      confirmLabel: t('adminOps.resetPassword'),
    })
    if (!ok) return
    actions.resetPassword.mutate(partner.id, { onSuccess: (result) => setNotice({ kind: 'reset', result, email: partner.email }) })
  }

  function onResend(partner: AdminPartner) {
    setMenu(null)
    actions.resendInvite.mutate(partner.id, { onSuccess: () => setNotice({ kind: 'text', text: t('adminOps.inviteResent', { email: partner.email }) }) })
  }

  async function onSuspend(event: FormEvent) {
    event.preventDefault()
    if (!suspending) return
    try {
      await actions.suspend.mutateAsync({ id: suspending.id, reason: reason.trim() })
      setNotice({ kind: 'text', text: t('adminOps.partnerSuspended', { name: suspending.name }) })
      setSuspending(null)
      setReason('')
    } catch {
      // shown in the dialog
    }
  }

  const columns: Array<Column<AdminPartner>> = [
    {
      key: 'lawyer',
      header: t('admin.partnersColLawyer'),
      cell: (partner) => (
        <>
          <p className="font-medium">{partner.name}</p>
          <p className="text-xs text-ash-573">{partner.email}</p>
          {partner.title ? <p className="text-xs text-ash-573">{partner.title}</p> : null}
        </>
      ),
    },
    {
      key: 'areas',
      header: t('adminOps.practiceAreas'),
      cell: (partner) =>
        partner.practice_areas.length === 0 ? (
          <span className="text-xs text-ash-573">{t('adminOps.allAreasShort')}</span>
        ) : (
          <span className="flex max-w-xs flex-wrap gap-1">
            {partner.practice_areas.map((area) => (
              <span key={area} className="rounded-full bg-sand-53 px-2 py-0.5 text-[11px] text-ash-773">
                {f.area(area)}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: 'window',
      header: t('admin.partnersColWindow'),
      className: 'whitespace-nowrap',
      cell: (partner) => (partner.response_hours ? tn('admin.partnersHours', partner.response_hours) : '—'),
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      cell: (partner) => {
        const status = partnerAccountStatus(partner)
        return (
          <span className="flex flex-col items-start gap-1">
            <AccountStatusPill status={status} />
            {status === 'invited' && partner.invitation_expires_at ? (
              <span className="text-[11px] text-ash-573">{t('adminOps.inviteExpires', { date: f.date(partner.invitation_expires_at) })}</span>
            ) : null}
            {partner.partner_status === 'inactive' ? <span className="text-[11px] text-ash-573">{t('admin.partnersInactive')}</span> : null}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: <span className="sr-only">{t('adminOps.colActions')}</span>,
      className: 'text-right',
      cell: (partner) => {
        const status = partnerAccountStatus(partner)
        return (
          <div className="relative inline-block text-left">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ash-41"
              aria-label={t('adminOps.partnerActions', { name: partner.name })}
              aria-expanded={menu === partner.id}
              onClick={() => setMenu(menu === partner.id ? null : partner.id)}
            >
              <MoreHorizontal size={16} aria-hidden />
            </button>
            {menu === partner.id ? (
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-2xl border border-sand-86 bg-surface p-1.5 shadow-sm">
                {status === 'invited' ? (
                  <MenuItem onClick={() => onResend(partner)}>{t('adminOps.resendInvite')}</MenuItem>
                ) : (
                  <MenuItem onClick={() => void onReset(partner)}>{t('adminOps.resetPassword')}</MenuItem>
                )}
                {partner.suspended ? (
                  <MenuItem
                    onClick={() => {
                      setMenu(null)
                      actions.unsuspend.mutate(partner.id, {
                        onSuccess: () => setNotice({ kind: 'text', text: t('adminOps.partnerUnsuspended', { name: partner.name }) }),
                      })
                    }}
                  >
                    {t('adminOps.unsuspend')}
                  </MenuItem>
                ) : (
                  <MenuItem
                    danger
                    onClick={() => {
                      setMenu(null)
                      setSuspending(partner)
                    }}
                  >
                    {t('adminOps.suspend')}
                  </MenuItem>
                )}
              </div>
            ) : null}
          </div>
        )
      },
    },
  ]

  const set = (key: Exclude<keyof typeof emptyForm, 'practice_areas'>) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <Frame title={t('admin.partnersTitle')} text={t('admin.partnersText')}>
      {confirmDialog}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          label={t('adminOps.partnersSearch')}
          placeholder={t('adminOps.partnersSearch')}
          onSearch={(value) => {
            if (value === search) return
            setSearch(value)
            setPage(1)
          }}
        />
        <button type="button" className={primaryButton} onClick={() => setOpen(true)}>
          <Plus size={16} aria-hidden />
          {t('adminOps.invitePartner')}
        </button>
      </div>
      <div className="mb-4 space-y-2" role="status">
        {notice?.kind === 'text' ? <Banner>{notice.text}</Banner> : null}
        {notice?.kind === 'reset' ? <ResetNotice result={notice.result} email={notice.email} /> : null}
      </div>
      <ErrorNote>{failed ? apiErrorMessage(failed, t('adminOps.actionFailed')) : ''}</ErrorNote>

      <DataTable
        columns={columns}
        rows={partners.data?.data}
        rowKey={(partner) => partner.id}
        minWidth="min-w-[820px]"
        loading={partners.isPending}
        error={partners.data ? undefined : partners.error}
        onRetry={() => void partners.refetch()}
        empty={search ? t('adminOps.partnersNoMatch') : t('admin.partnersEmpty')}
      />
      <Pagination meta={partners.data?.meta} onPage={setPage} disabled={partners.isFetching} />

      {open ? (
        <Modal
          title={t('adminOps.invitePartner')}
          onClose={close}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={close}>
                {t('common.cancel')}
              </button>
              <button type="submit" form={formId} className={primaryButton} disabled={actions.invite.isPending}>
                {actions.invite.isPending ? t('common.saving') : t('adminOps.sendInvite')}
              </button>
            </>
          }
        >
          <form id={formId} autoComplete="off" className="pb-2" onSubmit={(event) => void onSubmit(event)}>
            <p className="mb-4 text-sm text-ash-573">{t('adminOps.invitePartnerHelp')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('admin.partnersFirstName')}>
                <input required value={form.first_name} onChange={(event) => set('first_name')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={t('admin.partnersLastName')}>
                <input required value={form.last_name} onChange={(event) => set('last_name')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={t('admin.email')}>
                <input required type="email" value={form.email} onChange={(event) => set('email')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={`${t('admin.partnersMobile')} (${t('common.optional')})`}>
                <input value={form.mobile} placeholder="09171234567" onChange={(event) => set('mobile')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={`${t('admin.partnersSpecialty')} (${t('common.optional')})`}>
                <input value={form.specialty} placeholder={t('admin.partnersSpecialtyExample')} onChange={(event) => set('specialty')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={`${t('adminOps.partnerTitle')} (${t('common.optional')})`}>
                <input value={form.title} placeholder={t('adminOps.partnerTitleExample')} onChange={(event) => set('title')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={t('admin.partnersWindow')}>
                <input required type="number" min={1} max={168} value={form.response_hours} onChange={(event) => set('response_hours')(event.target.value)} className={inputClass} />
              </Field>
              <Field label={t('admin.colStatus')}>
                <Select value={form.partner_status} onChange={(event) => set('partner_status')(event.target.value)}>
                  <option value="active">{t('admin.partnersActive')}</option>
                  <option value="inactive">{t('admin.partnersInactive')}</option>
                </Select>
              </Field>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-1.5 text-xs font-medium text-moss-731">{t('adminOps.practiceAreas')}</legend>
              <p className="mb-2 text-xs text-ash-573">{t('adminOps.practiceAreasHelp')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PRACTICE_AREAS.map((area) => (
                  <label key={area} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.practice_areas.includes(area)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          practice_areas: current.practice_areas.includes(area)
                            ? current.practice_areas.filter((item) => item !== area)
                            : [...current.practice_areas, area],
                        }))
                      }
                    />
                    {f.area(area)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          </form>
        </Modal>
      ) : null}

      {suspending ? (
        <Modal
          title={t('adminOps.suspendPartnerTitle', { name: suspending.name })}
          size="max-w-md"
          onClose={() => setSuspending(null)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setSuspending(null)}>
                {t('common.cancel')}
              </button>
              <button type="submit" form="suspend-partner" className={dangerButton} disabled={actions.suspend.isPending}>
                {t('adminOps.suspend')}
              </button>
            </>
          }
        >
          <form id="suspend-partner" className="space-y-3 pb-2" onSubmit={(event) => void onSuspend(event)}>
            <p className="text-sm text-ash-573">{t('adminOps.suspendPartnerBody')}</p>
            <Field label={`${t('adminOps.suspendReason')} (${t('common.optional')})`}>
              <textarea maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} h-24 py-2`} />
            </Field>
            <ErrorNote>{actions.suspend.isError ? apiErrorMessage(actions.suspend.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
          </form>
        </Modal>
      ) : null}
    </Frame>
  )
}

function MenuItem({ children, onClick, danger = false }: { children: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ash-41 ${danger ? 'text-rust-600' : 'text-ash-890'}`}
    >
      {children}
    </button>
  )
}
