import {  useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'

import { AccountShell } from './AccountShell'
import type {FormEvent} from 'react';
import { useI18n } from '@/i18n'
import { signInErrorMessage } from '@/lib/authErrors'
import { loginMember, memberHome } from '@/services/memberAuth'


export function UserLoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const notice = 'notice' in search ? search.notice : undefined
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const user = await loginMember(email.trim(), password)
      // The API says which portal this account belongs to.
      await navigate({ to: memberHome(user) })
    } catch (caught) {
      setError(signInErrorMessage(caught, t('auth.loginError')))
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountShell
      eyebrow={t('auth.loginEyebrow')}
      title={t('auth.loginTitle')}
      text={t('auth.loginText')}
    >
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-moss-571">
        {t('auth.loginHint')}
      </p>
      {notice === 'password_reset' || notice === 'account_ready' ? (
        <p role="status" className="mt-5 rounded-2xl bg-moss-53 px-4 py-3 text-sm leading-relaxed text-moss-794">
          {notice === 'password_reset' ? t('auth.noticePasswordReset') : t('auth.noticeAccountReady')}
        </p>
      ) : null}
      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => void onSubmit(event)}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-moss-833">
            {t('auth.email')}
          </span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium text-moss-833">
            {t('auth.password')}
            <Link to="/forgot-password" className="text-[13px] font-medium text-brand hover:underline">
              {t('auth.forgotLink')}
            </Link>
          </span>
          <span className="flex h-[52px] items-center rounded-2xl border border-sand-125 bg-surface pr-2 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-full w-full bg-transparent px-4 outline-none"
            />
            <button
              type="button"
              className="grid h-9 w-9 place-items-center text-moss-571"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
          {pending ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {t('auth.newHere')}{' '}
        <Link to="/register" className="font-medium text-brand">
          {t('auth.createAccountLink')}
        </Link>
      </p>
    </AccountShell>
  )
}

const inputClass =
  'h-[52px] w-full rounded-2xl border border-sand-125 bg-surface px-4 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'
