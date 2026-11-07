import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'

import { useI18n } from '@/i18n'
import { loginAdmin, loginAdminTwoFactor } from '@/services/adminAuth'

type Failure = 'locked' | 'suspended' | 'credentials' | 'code' | 'expired' | 'other'

/** Sorts a sign-in failure: 429 account_locked, 403 account_suspended, 422 wrong password / code. */
export function loginFailure(error: unknown, step: 'password' | 'code'): Failure {
  if (!axios.isAxiosError(error) || !error.response) return 'other'
  const { status, data } = error.response as { status: number; data?: { error?: string; message?: string } }
  if (status === 429 && data?.error === 'account_locked') return 'locked'
  if (status === 429) return 'locked'
  if (status === 403 && data?.error === 'account_suspended') return 'suspended'
  if (status === 422 && step === 'code') return data?.message === 'Sign in with your password first.' ? 'expired' : 'code'
  if (status === 422) return 'credentials'
  return 'other'
}

export function AdminLoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const notice = 'notice' in search ? search.notice : undefined
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<'password' | 'code'>('password')
  const [code, setCode] = useState('')
  const [recovery, setRecovery] = useState(false)

  const failureText: Record<Failure, string> = {
    locked: t('adminOps.loginLocked'),
    suspended: t('adminOps.loginSuspended'),
    credentials: t('admin.loginFailed'),
    code: t('adminOps.twoFactorInvalid'),
    expired: t('adminOps.twoFactorExpired'),
    other: t('adminOps.loginOther'),
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError(t('admin.loginMissing'))
      return
    }
    setPending(true)
    try {
      const result = await loginAdmin(email.trim(), password)
      if ('two_factor_required' in result) {
        setStep('code')
        setCode('')
        return
      }
      await navigate({ to: '/admin' })
    } catch (caught) {
      setError(failureText[loginFailure(caught, 'password')])
    } finally {
      setPending(false)
    }
  }

  async function onCode(event: FormEvent) {
    event.preventDefault()
    setError('')
    const value = recovery ? code.trim() : code.replace(/\s+/g, '')
    if (!recovery && !/^\d{6}$/.test(value)) {
      setError(t('adminOps.twoFactorSixDigits'))
      return
    }
    if (!value) {
      setError(t('adminOps.twoFactorRecoveryMissing'))
      return
    }
    setPending(true)
    try {
      await loginAdminTwoFactor(value)
      await navigate({ to: '/admin' })
    } catch (caught) {
      const failure = loginFailure(caught, 'code')
      if (failure === 'expired' || failure === 'locked') {
        setStep('password')
        setPassword('')
      }
      setError(failureText[failure])
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="home-shell flex min-h-screen items-center justify-center px-5 py-12">
      <div className="hero-rise grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-moss-90 bg-surface shadow-[0_30px_80px_-48px_rgba(16,40,28,0.55)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-brand-strong p-10 text-white lg:flex">
          <span className="inline-flex w-fit rounded-2xl bg-surface px-3 py-2">
            <img src="/gabaymo-logo.png" alt="GabayMo" className="h-12 w-auto" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-moss-194">
              {t('admin.loginEyebrow')}
            </p>
            <h1 className="serif mt-3 text-4xl leading-tight font-medium">
              {t('admin.loginHeadline')}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-moss-112">
              {t('admin.loginIntro')}
            </p>
          </div>
          <p className="text-xs text-moss-194">{t('admin.loginFooter')}</p>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted"
          >
            <ArrowLeft size={16} aria-hidden />
            {t('admin.backToSite')}
          </Link>
          <img
            src="/gabaymo-logo.png"
            alt="GabayMo"
            className="mt-6 h-12 w-auto lg:hidden"
          />
          <h2 className="serif mt-6 text-4xl font-medium tracking-[-0.03em] text-moss-898">
            {t('admin.loginTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.loginSubtitle')}
          </p>

          {step === 'code' ? (
            <form className="mt-8 space-y-4" onSubmit={(event) => void onCode(event)} aria-label={t('adminOps.twoFactorTitle')}>
              <div>
                <p className="text-sm font-medium text-moss-833">{t('adminOps.twoFactorTitle')}</p>
                <p className="mt-1 text-sm text-muted">{recovery ? t('adminOps.twoFactorRecoveryHelp') : t('adminOps.twoFactorHelp')}</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-moss-833">
                  {recovery ? t('adminOps.recoveryCode') : t('adminOps.authCode')}
                </span>
                <input
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode={recovery ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  maxLength={recovery ? 40 : 7}
                  placeholder={recovery ? 'abcde-fghij' : '123456'}
                  className="h-12 w-full rounded-2xl border border-moss-101 bg-ash-14 px-4 tracking-[0.2em] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </label>
              {error ? (
                <p role="alert" className="rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="btn-primary h-12 w-full justify-center" disabled={pending}>
                {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
                {pending ? t('admin.signingIn') : t('adminOps.verify')}
              </button>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="font-medium text-brand hover:underline"
                  onClick={() => {
                    setRecovery((value) => !value)
                    setCode('')
                    setError('')
                  }}
                >
                  {recovery ? t('adminOps.useAuthCode') : t('adminOps.useRecoveryCode')}
                </button>
                <button
                  type="button"
                  className="text-muted hover:underline"
                  onClick={() => {
                    setStep('password')
                    setError('')
                  }}
                >
                  {t('adminOps.backToPassword')}
                </button>
              </div>
            </form>
          ) : (
            <>
            {notice === 'password_reset' || notice === 'account_ready' ? (
              <p role="status" className="mt-6 rounded-2xl bg-moss-53 px-4 py-3 text-sm text-moss-794">
                {notice === 'password_reset' ? t('auth.noticePasswordReset') : t('auth.noticeAccountReady')}
              </p>
            ) : null}
            <form className="mt-8 space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-moss-833">
                  {t('admin.email')}
                </span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-moss-101 bg-ash-14 px-4 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  placeholder="admin@gabaymo.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-moss-833">
                  {t('admin.password')}
                </span>
                <span className="flex h-12 items-center rounded-2xl border border-moss-101 bg-ash-14 pr-2 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-full w-full bg-transparent px-4 outline-none"
                  />
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center text-moss-571"
                    aria-label={showPassword ? t('admin.hidePassword') : t('admin.showPassword')}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                  </button>
                </span>
              </label>

              {error ? (
                <p role="alert" className="rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="btn-primary h-12 w-full justify-center"
                disabled={pending}
              >
                {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
                {pending ? t('admin.signingIn') : t('admin.signIn')}
              </button>
            </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
