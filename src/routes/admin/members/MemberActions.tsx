import { useState } from 'react'

import { MemberStatus } from '../modules/MembersPage'
import { endOfDayIso, useAdminFormat } from '../modules/shared'
import type { FormEvent } from 'react'
import type { AdminMember } from '@/services/adminOps'
import { Banner, ErrorNote, Field, Modal, Select, dangerButton, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useMemberActions, useSubscriptions } from '@/queries/admin'

/** Membership + suspension controls on the member detail page. */
export function MemberActions({ member }: { member: AdminMember }) {
  const { t } = useI18n()
  const f = useAdminFormat()
  const actions = useMemberActions(member.id)
  const plans = useSubscriptions()
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [planId, setPlanId] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [notice, setNotice] = useState('')
  const sub = member.subscription
  const failed = actions.suspend.error ?? actions.unsuspend.error ?? actions.plan.error

  async function onSuspend(event: FormEvent) {
    event.preventDefault()
    if (!reason.trim()) return
    try {
      await actions.suspend.mutateAsync(reason.trim())
      setSuspendOpen(false)
      setReason('')
      setNotice(t('adminOps.memberSuspendedNotice'))
    } catch {
      // shown in the dialog
    }
  }

  async function onPlan(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    if (!planId) return
    try {
      const next = await actions.plan.mutateAsync({ subscription_plan_id: Number(planId), period_end: endOfDayIso(periodEnd) })
      setPlanId('')
      setPeriodEnd('')
      setNotice(t('adminOps.planChanged', { plan: next.plan }))
    } catch {
      // shown below
    }
  }

  return (
    <section className="mt-4 min-w-0 rounded-3xl border border-sand-86 bg-surface p-6">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] text-ash-459 uppercase">{t('adminOps.membership')}</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ash-573">{t('admin.colStatus')}</dt>
          <dd className="mt-1">
            <MemberStatus member={member} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ash-573">{t('admin.colPlan')}</dt>
          <dd className="mt-1 font-medium">{sub?.plan ?? member.plan}</dd>
        </div>
        <div>
          <dt className="text-xs text-ash-573">{t('adminOps.colPeriodEnd')}</dt>
          <dd className="mt-1 font-medium">{f.date(sub?.current_period_end)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ash-573">{t('adminOps.planSource')}</dt>
          <dd className="mt-1 font-medium">
            {sub?.organization ? sub.organization.name : (sub?.source ?? '—')}
          </dd>
        </div>
      </dl>
      {member.suspended ? (
        <Banner tone="warning" className="mt-4">
          {t('adminOps.suspendedSince', { date: f.date(member.suspended_at) })}
          {member.suspension_reason ? ` — ${member.suspension_reason}` : ''}
        </Banner>
      ) : null}

      <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" onSubmit={(event) => void onPlan(event)}>
        <Field label={t('adminOps.changePlan')}>
          <Select value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">{t('adminOps.choosePlan')}</option>
            {(plans.data ?? []).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${t('adminOps.colPeriodEnd')} (${t('common.optional')})`}>
          <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className={inputClass} />
        </Field>
        <button type="submit" className={primaryButton} disabled={!planId || actions.plan.isPending}>
          {actions.plan.isPending ? t('common.saving') : t('adminOps.applyPlan')}
        </button>
      </form>
      <p className="mt-2 text-xs text-ash-573">{t('adminOps.changePlanHelp')}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {member.suspended ? (
          <button
            type="button"
            className={secondaryButton}
            disabled={actions.unsuspend.isPending}
            onClick={() => actions.unsuspend.mutate(undefined, { onSuccess: () => setNotice(t('adminOps.memberUnsuspendedNotice')) })}
          >
            {t('adminOps.unsuspend')}
          </button>
        ) : (
          <button type="button" className={dangerButton} onClick={() => setSuspendOpen(true)}>
            {t('adminOps.suspend')}
          </button>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {notice ? (
          <p role="status" className="text-sm text-brand">
            {notice}
          </p>
        ) : null}
        {!suspendOpen ? <ErrorNote>{failed ? apiErrorMessage(failed, t('adminOps.actionFailed')) : ''}</ErrorNote> : null}
      </div>

      {suspendOpen ? (
        <Modal
          title={t('adminOps.suspendMemberTitle', { name: member.name })}
          size="max-w-md"
          onClose={() => setSuspendOpen(false)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setSuspendOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="submit" form="suspend-member" className={dangerButton} disabled={!reason.trim() || actions.suspend.isPending}>
                {t('adminOps.suspend')}
              </button>
            </>
          }
        >
          <form id="suspend-member" className="space-y-3 pb-2" onSubmit={(event) => void onSuspend(event)}>
            <p className="text-sm text-ash-573">{t('adminOps.suspendMemberBody')}</p>
            <Field label={t('adminOps.suspendReason')}>
              <textarea required maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} h-24 py-2`} />
            </Field>
            <ErrorNote>{actions.suspend.isError ? apiErrorMessage(actions.suspend.error, t('adminOps.actionFailed')) : ''}</ErrorNote>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
