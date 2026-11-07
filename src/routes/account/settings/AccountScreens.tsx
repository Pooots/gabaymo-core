import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Download, LoaderCircle, LogOut, MailWarning, Receipt, Ticket, TriangleAlert } from 'lucide-react'
import { formatWhen } from '../format'
import type { FormEvent, ReactNode } from 'react'

import type { MessageKey } from '@/i18n'
import type { MemberPayment, PaymentStatus } from '@/services/account'
import type { MemberProfile, SubscriptionStatus } from '@/services/memberAuth'
import type { StatusTone } from '@/components/ui'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'
import { ErrorNote, ErrorState, Field, LoadingState, Modal, Pagination, StatusPill, Toggle, dangerButton, inputClass, secondaryButton, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useIssuanceAlerts, usePayments, useRedeemAccessKey, useSubscriptionActions } from '@/queries/member'
import { changeMemberPassword, deleteAccount, exportMyData, logoutAllDevices, sendVerificationEmail } from '@/services/account'
import { clearMemberSession, logoutMember } from '@/services/memberAuth'

function Section({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface px-5 py-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {text ? <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

// ── Email verification ─────────────────────────────────────────────

/**
 * Shown above every member screen while the email is unconfirmed, and once
 * after the verification link (`/account?verified=1|0`).
 */
export function VerifyEmailBanner({ member, verified }: { member: MemberProfile | null; verified: '1' | '0' | null }) {
  const { t } = useI18n()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  if (verified === '1') {
    return (
      <p role="status" className="relative mx-4 mt-2 max-w-xl self-center rounded-2xl bg-moss-53 px-4 py-3 text-center text-sm text-moss-794 sm:mx-auto">
        {t('memberAccount.verifiedOk')}
      </p>
    )
  }
  if (verified !== '0' && member?.email_verified !== false) return null

  async function resend() {
    setState('sending')
    try {
      await sendVerificationEmail()
      setState('sent')
    } catch (caught) {
      setError(apiErrorMessage(caught, t('memberAccount.verifyResendError')))
      setState('error')
    }
  }

  return (
    <div
      role={verified === '0' ? 'alert' : 'status'}
      className="relative mx-4 mt-2 flex max-w-xl flex-wrap items-center gap-x-3 gap-y-2 self-center rounded-2xl border border-honey-169 bg-honey-47 px-4 py-3 text-sm text-honey-755 sm:mx-auto"
    >
      <MailWarning size={16} aria-hidden className="shrink-0" />
      <span className="min-w-0 flex-1">
        {verified === '0' ? t('memberAccount.verifiedFailed') : t('memberAccount.verifyBanner', { email: member?.email ?? '' })}
      </span>
      {state === 'sent' ? (
        <span className="font-medium">{t('memberAccount.verifySent')}</span>
      ) : (
        <button type="button" className="font-medium underline disabled:opacity-60" disabled={state === 'sending'} onClick={() => void resend()}>
          {state === 'sending' ? t('memberAccount.verifySending') : t('memberAccount.verifyResend')}
        </button>
      )}
      {state === 'error' ? <span className="w-full text-rust-600">{error}</span> : null}
    </div>
  )
}

// ── Security: password + sessions ──────────────────────────────────

export function SecurityScreen() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [confirm, confirmDialog] = useConfirm()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function signOutEverywhere() {
    const ok = await confirm({
      title: t('memberAccount.logoutAllTitle'),
      description: t('memberAccount.logoutAllBody'),
      confirmLabel: t('memberAccount.logoutAll'),
    })
    if (!ok) return
    setError('')
    setPending(true)
    try {
      await logoutAllDevices()
      clearMemberSession()
      await logoutMember().catch(() => undefined)
      await navigate({ to: '/login' })
    } catch (caught) {
      setError(apiErrorMessage(caught, t('memberAccount.logoutAllError')))
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Section title={t('security.changePassword')}>
        <ChangePasswordForm submit={changeMemberPassword} minLength={8} />
      </Section>
      <Section title={t('memberAccount.logoutAllTitle')} text={t('memberAccount.logoutAllText')}>
        <ErrorNote>{error}</ErrorNote>
        <button type="button" className={`${secondaryButton} mt-2`} disabled={pending} onClick={() => void signOutEverywhere()}>
          {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <LogOut size={16} aria-hidden />}
          {t('memberAccount.logoutAll')}
        </button>
      </Section>
      {confirmDialog}
    </div>
  )
}

// ── Data: export + delete ───────────────────────────────────────────

export function DataScreen({ member }: { member: MemberProfile | null }) {
  const { t } = useI18n()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function download() {
    setExportError('')
    setExporting(true)
    try {
      const data = await exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gabaymo-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (caught) {
      setExportError(apiErrorMessage(caught, t('memberAccount.exportError')))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Section title={t('memberAccount.exportTitle')} text={t('memberAccount.exportText')}>
        <ErrorNote>{exportError}</ErrorNote>
        <button type="button" className={`${secondaryButton} mt-2`} disabled={exporting} onClick={() => void download()}>
          {exporting ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}
          {exporting ? t('memberAccount.exporting') : t('memberAccount.exportButton')}
        </button>
      </Section>
      <Section title={t('memberAccount.deleteTitle')} text={t('memberAccount.deleteText')}>
        <button type="button" className={dangerButton} onClick={() => setDeleting(true)}>
          <TriangleAlert size={16} aria-hidden />
          {t('memberAccount.deleteButton')}
        </button>
      </Section>
      {deleting ? <DeleteAccountDialog email={member?.email ?? ''} onClose={() => setDeleting(false)} /> : null}
    </div>
  )
}

/** The word the member types to confirm (localized, compared case-insensitively). */
function DeleteAccountDialog({ email, onClose }: { email: string; onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const word = t('memberAccount.deleteWord')
  const [password, setPassword] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const ready = password !== '' && typed.trim().toUpperCase() === word.toUpperCase()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return
    setError('')
    setPending(true)
    try {
      await deleteAccount(password)
      await logoutMember().catch(() => undefined)
      await navigate({ to: '/' })
    } catch (caught) {
      setError(apiErrorMessage(caught, t('memberAccount.deleteError')))
      setPending(false)
    }
  }

  return (
    <Modal
      role="alertdialog"
      size="max-w-md"
      title={t('memberAccount.deleteDialogTitle')}
      onClose={() => !pending && onClose()}
      footer={
        <>
          <button type="button" className={secondaryButton} data-autofocus onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="delete-account-form" className={dangerButton} disabled={!ready || pending}>
            {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('memberAccount.deleteConfirm')}
          </button>
        </>
      }
    >
      <form id="delete-account-form" className="space-y-4 pb-2" onSubmit={(event) => void onSubmit(event)}>
        <p className="text-sm leading-relaxed text-ash-573">{t('memberAccount.deleteDialogBody', { email })}</p>
        <Field label={t('memberAccount.deletePassword')}>
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
        </Field>
        <Field label={t('memberAccount.deleteTypeWord', { word })}>
          <input value={typed} autoComplete="off" onChange={(event) => setTyped(event.target.value)} className={inputClass} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Modal>
  )
}

// ── Notifications preference ───────────────────────────────────────

export function IssuanceAlertsToggle({ member }: { member: MemberProfile | null }) {
  const { t } = useI18n()
  const update = useIssuanceAlerts()
  const enabled = member?.issuance_alerts ?? true
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t('memberAccount.alertsTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t('memberAccount.alertsText')}</p>
        </div>
        <Toggle checked={enabled} disabled={!member || update.isPending} label={t('memberAccount.alertsTitle')} onChange={(next) => update.mutate(next)} />
      </div>
      {update.isError ? (
        <p role="alert" className="mt-2 text-sm text-rust-600">
          {apiErrorMessage(update.error, t('memberAccount.alertsError'))}
        </p>
      ) : null}
    </div>
  )
}

// ── Membership: subscription, redeem, payments ─────────────────────

const SUBSCRIPTION_TONE: Record<SubscriptionStatus, StatusTone> = { active: 'green', trial: 'gray', cancelled: 'amber', expired: 'red' }
const SUBSCRIPTION_LABEL: Record<SubscriptionStatus, MessageKey> = {
  active: 'memberAccount.statusActive',
  trial: 'memberAccount.statusTrial',
  cancelled: 'memberAccount.statusCancelled',
  expired: 'memberAccount.statusExpired',
}

export function MembershipScreen({
  member,
  onRenew,
  onUpgrade,
}: {
  member: MemberProfile | null
  /** Opens the existing checkout for this plan. */
  onRenew: (planId: number) => void
  onUpgrade: () => void
}) {
  return (
    <div className="space-y-4">
      <SubscriptionCard member={member} onRenew={onRenew} onUpgrade={onUpgrade} />
      <RedeemForm />
      <PaymentHistory />
    </div>
  )
}

export function SubscriptionCard({ member, onRenew, onUpgrade }: { member: MemberProfile | null; onRenew: (planId: number) => void; onUpgrade: () => void }) {
  const { t, intl } = useI18n()
  const { cancel, resume } = useSubscriptionActions()
  const [confirm, confirmDialog] = useConfirm()
  const sub = member?.subscription ?? null
  const status: SubscriptionStatus = sub?.status ?? 'trial'
  const end = sub?.current_period_end ? formatWhen(sub.current_period_end, intl) : null
  const paid = (member?.plan_price ?? 0) > 0
  const viaOrganization = sub?.source === 'organization'
  const failure = cancel.error ?? resume.error

  async function cancelPlan() {
    const ok = await confirm({
      title: t('memberAccount.cancelTitle'),
      description: end ? t('memberAccount.cancelBody', { date: end }) : t('memberAccount.cancelBodyNoDate'),
      confirmLabel: t('memberAccount.cancelConfirm'),
      cancelLabel: t('memberAccount.keepPlan'),
      tone: 'danger',
    })
    if (ok) cancel.mutate()
  }

  return (
    <Section title={t('memberAccount.membershipTitle')}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="serif text-2xl font-medium">{sub?.plan ?? member?.plan ?? t('account.freeTrial')}</p>
        <StatusPill tone={sub?.cancel_at_period_end && status === 'active' ? 'amber' : SUBSCRIPTION_TONE[status]} dot>
          {sub?.cancel_at_period_end && status === 'active' ? t('memberAccount.statusEnding') : t(SUBSCRIPTION_LABEL[status])}
        </StatusPill>
      </div>
      <p className="mt-2 text-sm text-muted">
        {end
          ? sub?.cancel_at_period_end || status === 'cancelled'
            ? t('memberAccount.endsOn', { date: end })
            : status === 'expired'
              ? t('memberAccount.endedOn', { date: end })
              : t('memberAccount.renewsOn', { date: end })
          : t('memberAccount.noPeriod')}
      </p>
      {viaOrganization && sub.organization ? (
        <p className="mt-1 text-sm text-muted">{t('memberAccount.viaOrganization', { name: sub.organization.name })}</p>
      ) : null}
      {failure ? (
        <p role="alert" className="mt-3 text-sm text-rust-600">
          {apiErrorMessage(failure, t('memberAccount.subscriptionError'))}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {paid && sub?.plan_id && !viaOrganization ? (
          <button type="button" className="btn-primary h-11" onClick={() => sub.plan_id && onRenew(sub.plan_id)}>
            {t('memberAccount.payAgain')}
          </button>
        ) : (
          <button type="button" className="btn-primary h-11" onClick={onUpgrade}>
            {t('settings.upgrade')}
          </button>
        )}
        {paid && !viaOrganization && status === 'active' && !sub?.cancel_at_period_end ? (
          <button type="button" className={secondaryButton} disabled={cancel.isPending} onClick={() => void cancelPlan()}>
            {cancel.isPending ? t('memberAccount.cancelling') : t('memberAccount.cancelPlan')}
          </button>
        ) : null}
        {paid && !viaOrganization && sub?.cancel_at_period_end && status !== 'expired' ? (
          <button type="button" className={secondaryButton} disabled={resume.isPending} onClick={() => resume.mutate()}>
            {resume.isPending ? t('memberAccount.resuming') : t('memberAccount.resumePlan')}
          </button>
        ) : null}
      </div>
      {confirmDialog}
    </Section>
  )
}

export function RedeemForm() {
  const { t } = useI18n()
  const redeem = useRedeemAccessKey()
  const [code, setCode] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!code.trim()) return
    redeem.mutate(code, { onSuccess: () => setCode('') })
  }

  return (
    <Section title={t('memberAccount.redeemTitle')} text={t('memberAccount.redeemText')}>
      <form className="flex flex-wrap items-end gap-2" onSubmit={onSubmit}>
        <Field label={t('memberAccount.redeemCode')} className="min-w-0 flex-1">
          <input
            value={code}
            maxLength={40}
            autoComplete="off"
            onChange={(event) => {
              setCode(event.target.value.toUpperCase())
              redeem.reset()
            }}
            className={`${inputClass} font-mono tracking-wider`}
          />
        </Field>
        <button type="submit" className="btn-primary h-11" disabled={redeem.isPending || !code.trim()}>
          {redeem.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Ticket size={16} aria-hidden />}
          {t('memberAccount.redeemButton')}
        </button>
      </form>
      {redeem.isSuccess ? (
        <p role="status" className="mt-3 text-sm text-brand">
          {t('memberAccount.redeemDone', { plan: redeem.data.plan })}
        </p>
      ) : null}
      {redeem.isError ? (
        <p role="alert" className="mt-3 text-sm text-rust-600">
          {apiErrorMessage(redeem.error, t('memberAccount.redeemError'))}
        </p>
      ) : null}
    </Section>
  )
}

const PAYMENT_TONE: Record<PaymentStatus, StatusTone> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
  refunded: 'gray',
  partially_refunded: 'gray',
  disputed: 'red',
}
const PAYMENT_LABEL: Record<PaymentStatus, MessageKey> = {
  paid: 'memberAccount.paymentPaid',
  pending: 'memberAccount.paymentPending',
  failed: 'memberAccount.paymentFailed',
  refunded: 'memberAccount.paymentRefunded',
  partially_refunded: 'memberAccount.paymentPartiallyRefunded',
  disputed: 'memberAccount.paymentDisputed',
}

export function PaymentHistory() {
  const { t, intl } = useI18n()
  const [page, setPage] = useState(1)
  const payments = usePayments(page)
  const peso = new Intl.NumberFormat(intl, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })
  const amount = (payment: MemberPayment) =>
    payment.currency && payment.currency !== 'PHP'
      ? `${payment.currency} ${payment.amount.toLocaleString(intl)}`
      : peso.format(payment.amount)

  return (
    <Section title={t('memberAccount.paymentsTitle')} text={t('memberAccount.paymentsText')}>
      {payments.isPending ? (
        <LoadingState rows={3} />
      ) : payments.isError ? (
        <ErrorState compact error={payments.error} onRetry={() => void payments.refetch()} retrying={payments.isRefetching} />
      ) : payments.data.data.length === 0 ? (
        <p className="text-sm text-muted">{t('memberAccount.paymentsEmpty')}</p>
      ) : (
        <>
          <ul className="divide-y divide-ash-59">
            {payments.data.data.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Receipt size={14} aria-hidden className="text-brand" />
                    {payment.plan ?? t('memberAccount.paymentMembership')}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatWhen(payment.paid_at ?? payment.created_at, intl)}
                    {' · '}
                    {payment.receipt_number
                      ? t('memberAccount.receiptNumber', { number: payment.receipt_number })
                      : t('memberAccount.referenceNumber', { number: payment.reference })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">{amount(payment)}</p>
                  <span className="mt-1 inline-block">
                    <StatusPill tone={PAYMENT_TONE[payment.status]}>{t(PAYMENT_LABEL[payment.status])}</StatusPill>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Pagination meta={payments.data.meta} onPage={setPage} disabled={payments.isFetching} />
        </>
      )}
    </Section>
  )
}
