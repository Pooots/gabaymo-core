import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, LoaderCircle, ShieldCheck, ShieldOff } from 'lucide-react'
import QRCode from 'qrcode'
import type { FormEvent } from 'react'

import type { TwoFactorSetup } from '@/services/adminAuth'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'
import { Banner, Card, CardTitle, ErrorNote, Field, Frame, StatusPill, dangerButton, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { adminKeys } from '@/queries/admin'
import { changeAdminPassword, confirmTwoFactor, disableTwoFactor, enableTwoFactor, readAdminUser, refreshAdminUser } from '@/services/adminAuth'

/** Own account: change password and two-factor sign-in (every staff account, no module gate). */
export function SecurityPage() {
  const { t } = useI18n()
  return (
    <Frame title={t('adminOps.securityTitle')} text={t('adminOps.securityText')}>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <CardTitle icon={KeyRound}>{t('adminOps.changePasswordTitle')}</CardTitle>
          <p className="mt-1 mb-5 text-sm text-ash-573">{t('adminOps.changePasswordText')}</p>
          <ChangePasswordForm minLength={10} submit={changeAdminPassword} />
        </Card>
        <TwoFactorCard />
      </div>
    </Frame>
  )
}

type Step = { kind: 'idle' } | { kind: 'setup'; setup: TwoFactorSetup } | { kind: 'codes'; codes: Array<string> } | { kind: 'disable' }

function TwoFactorCard() {
  const { t } = useI18n()
  const client = useQueryClient()
  const me = useQuery({ queryKey: [...adminKeys.all, 'me'], queryFn: refreshAdminUser, placeholderData: () => readAdminUser() ?? undefined })
  const enabled = Boolean(me.data?.two_factor_enabled)
  const [step, setStep] = useState<Step>({ kind: 'idle' })
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function run(action: () => Promise<void>) {
    setError('')
    setPending(true)
    try {
      await action()
    } catch (caught) {
      setError(apiErrorMessage(caught, t('adminOps.actionFailed')))
    } finally {
      setPending(false)
    }
  }

  const start = () =>
    run(async () => {
      const setup = await enableTwoFactor()
      setCode('')
      setStep({ kind: 'setup', setup })
    })

  const confirm = (event: FormEvent, setup: TwoFactorSetup) => {
    event.preventDefault()
    void run(async () => {
      const user = await confirmTwoFactor(code.replace(/\s+/g, ''))
      client.setQueryData([...adminKeys.all, 'me'], user)
      setStep({ kind: 'codes', codes: setup.recovery_codes })
    })
  }

  const disable = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      const user = await disableTwoFactor(password)
      client.setQueryData([...adminKeys.all, 'me'], user)
      setPassword('')
      setStep({ kind: 'idle' })
    })
  }

  return (
    <Card className="p-6">
      <CardTitle
        icon={enabled ? ShieldCheck : ShieldOff}
        action={
          <StatusPill tone={enabled ? 'green' : 'gray'} dot>
            {enabled ? t('adminOps.twoFactorOn') : t('adminOps.twoFactorOff')}
          </StatusPill>
        }
      >
        {t('adminOps.twoFactorCardTitle')}
      </CardTitle>
      <p className="mt-1 text-sm text-ash-573">{t('adminOps.twoFactorCardText')}</p>

      <div className="mt-5 space-y-4">
        {step.kind === 'setup' ? (
          <form className="space-y-4" onSubmit={(event) => confirm(event, step.setup)}>
            <p className="text-sm">{t('adminOps.twoFactorScan')}</p>
            <QrImage value={step.setup.otpauth_url} label={t('adminOps.twoFactorQrLabel')} />
            <div>
              <p className="text-xs text-ash-573">{t('adminOps.twoFactorSecret')}</p>
              <code className="mt-1 block rounded-xl bg-ash-40 px-3 py-2 font-mono text-sm break-all select-all">{step.setup.secret}</code>
            </div>
            <Field label={t('adminOps.authCode')}>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={`${inputClass} tracking-[0.2em]`}
                placeholder="123456"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primaryButton} disabled={pending || code.replace(/\s+/g, '').length < 6}>
                {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
                {t('adminOps.twoFactorConfirm')}
              </button>
              <button type="button" className={secondaryButton} onClick={() => setStep({ kind: 'idle' })}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : step.kind === 'codes' ? (
          <RecoveryCodes codes={step.codes} onDone={() => setStep({ kind: 'idle' })} />
        ) : step.kind === 'disable' ? (
          <form className="space-y-4" onSubmit={disable}>
            <Field label={t('admin.password')}>
              <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={dangerButton} disabled={pending || !password}>
                {t('adminOps.twoFactorDisable')}
              </button>
              <button type="button" className={secondaryButton} onClick={() => setStep({ kind: 'idle' })}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : enabled ? (
          <button type="button" className={secondaryButton} onClick={() => setStep({ kind: 'disable' })}>
            {t('adminOps.twoFactorDisable')}
          </button>
        ) : (
          <button type="button" className={primaryButton} disabled={pending || me.isPending} onClick={() => void start()}>
            {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('adminOps.twoFactorEnable')}
          </button>
        )}
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Card>
  )
}

/** otpauth:// URL as a QR image (rendered locally; the secret never leaves the browser). */
function QrImage({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, { margin: 1, width: 192 })
      .then((url) => {
        if (live) setSrc(url)
      })
      .catch(() => {
        if (live) setSrc(null)
      })
    return () => {
      live = false
    }
  }, [value])
  return src ? (
    <img src={src} alt={label} width={192} height={192} className="rounded-2xl bg-surface p-2 ring-1 ring-sand-86" />
  ) : (
    <div className="grid h-48 w-48 place-items-center rounded-2xl bg-ash-40">
      <LoaderCircle size={18} className="animate-spin text-ash-459" aria-hidden />
    </div>
  )
}

function RecoveryCodes({ codes, onDone }: { codes: Array<string>; onDone: () => void }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-4">
      <Banner tone="warning">{t('adminOps.recoveryCodesOnce')}</Banner>
      <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-ash-40 p-4 font-mono text-sm" aria-label={t('adminOps.recoveryCodes')}>
        {codes.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void navigator.clipboard.writeText(codes.join('\n')).then(() => setCopied(true))}
        >
          <Copy size={16} aria-hidden />
          {copied ? t('common.copied') : t('adminOps.copyCodes')}
        </button>
        <button type="button" className={primaryButton} onClick={onDone}>
          {t('adminOps.savedCodes')}
        </button>
      </div>
    </div>
  )
}
