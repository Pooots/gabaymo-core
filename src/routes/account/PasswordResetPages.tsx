import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { LoaderCircle, MailCheck } from 'lucide-react'
import { AccountShell } from './AccountShell'
import type { FormEvent, ReactNode } from 'react'

import { useI18n } from '@/i18n'
import { signInErrorMessage } from '@/lib/authErrors'
import { requestPasswordReset, resetPassword } from '@/services/account'

const inputClass =
  'h-[52px] w-full rounded-2xl border border-sand-125 bg-surface px-4 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-moss-833">{text}</span>
      {children}
    </label>
  )
}

function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
      {children}
    </p>
  )
}

/** /forgot-password: always answers the same way (the API never says whether the email exists). */
export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = email.trim()
    if (!value) return
    setError('')
    setPending(true)
    try {
      await requestPasswordReset(value)
      setSentTo(value)
    } catch (caught) {
      setError(signInErrorMessage(caught, t('auth.forgotError')))
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountShell eyebrow={t('auth.forgotEyebrow')} title={t('auth.forgotTitle')} text={t('auth.forgotText')}>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-moss-571">{t('auth.forgotText')}</p>
      {sentTo ? (
        <p role="status" className="mt-8 flex items-start gap-3 rounded-2xl bg-moss-53 px-4 py-4 text-sm leading-relaxed text-moss-794">
          <MailCheck size={18} aria-hidden className="mt-0.5 shrink-0 text-brand" />
          {t('auth.forgotSent', { email: sentTo })}
        </p>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={(event) => void onSubmit(event)}>
          <Label text={t('auth.email')}>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </Label>
          {error ? <Alert>{error}</Alert> : null}
          <button type="submit" className="btn-primary h-12 w-full justify-center" disabled={pending || !email.trim()}>
            {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
            {pending ? t('auth.forgotSending') : t('auth.forgotSubmit')}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-muted">
        <Link to="/login" className="font-medium text-brand">
          {t('auth.backToSignIn')}
        </Link>
      </p>
    </AccountShell>
  )
}

/** /reset-password?token=&email= from the reset email. */
export function ResetPasswordPage() {
  const { t } = useI18n()
  const search = useSearch({ from: '/reset-password' })
  const token = search.token ?? ''
  const email = search.email ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError(t('auth.passwordMin'))
    if (password !== confirm) return setError(t('auth.passwordMismatch'))
    setPending(true)
    try {
      await resetPassword({ token, email, password, password_confirmation: confirm })
      setDone(true)
    } catch (caught) {
      setError(signInErrorMessage(caught, t('auth.resetError')))
    } finally {
      setPending(false)
    }
  }

  const valid = token !== '' && email !== ''

  return (
    <AccountShell eyebrow={t('auth.resetEyebrow')} title={t('auth.resetTitle')} text={t('auth.forgotText')}>
      {!valid ? (
        <div className="mt-8 space-y-4">
          <Alert>{t('auth.resetInvalidLink')}</Alert>
          <Link to="/forgot-password" className="btn-primary inline-flex h-11">
            {t('auth.requestNewLink')}
          </Link>
        </div>
      ) : done ? (
        <div className="mt-8 space-y-5">
          <p role="status" className="rounded-2xl bg-moss-53 px-4 py-4 text-sm leading-relaxed text-moss-794">
            {t('auth.resetDone')}
          </p>
          <Link to="/login" className="btn-primary inline-flex h-12 w-full justify-center">
            {t('auth.signIn')}
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-3 max-w-sm text-sm leading-relaxed break-words text-moss-571">{t('auth.resetText', { email })}</p>
          <form className="mt-8 space-y-5" onSubmit={(event) => void onSubmit(event)} noValidate>
            <Label text={t('security.newPassword')}>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </Label>
            <Label text={t('security.confirmNewPassword')}>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={inputClass}
              />
            </Label>
            {error ? (
              <div className="space-y-2">
                <Alert>{error}</Alert>
                <Link to="/forgot-password" className="text-sm font-medium text-brand">
                  {t('auth.requestNewLink')}
                </Link>
              </div>
            ) : null}
            <button type="submit" className="btn-primary h-12 w-full justify-center" disabled={pending || !password || !confirm}>
              {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
              {pending ? t('auth.resetSaving') : t('auth.resetSubmit')}
            </button>
          </form>
        </>
      )}
    </AccountShell>
  )
}
