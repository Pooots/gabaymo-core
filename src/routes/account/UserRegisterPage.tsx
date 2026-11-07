import {   useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronDown, Eye, EyeOff, LoaderCircle } from 'lucide-react'

import { AccountShell } from './AccountShell'
import type {FormEvent, ReactNode} from 'react';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { registerMember } from '@/services/memberAuth'


export function UserRegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const [referral, setReferral] = useState(() => ('ref' in search && typeof search.ref === 'string' ? search.ref.toUpperCase() : ''))
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')
  const [region, setRegion] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (!acceptTerms) {
      setError(t('auth.termsRequired'))
      return
    }
    setPending(true)
    try {
      await registerMember({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile: mobile.replace(/[\s-]/g, ''),
        region,
        email: email.trim(),
        password,
        password_confirmation: confirm,
        accept_terms: true,
        ...(referral.trim() ? { referral_code: referral.trim() } : {}),
      })
      await navigate({ to: '/account' })
    } catch (caught) {
      setError(apiErrorMessage(caught, t('auth.registerError')))
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountShell
      fit
      eyebrow={t('auth.registerEyebrow')}
      title={t('auth.registerTitle')}
      text={t('auth.registerText')}
    >
      <p className="mt-2 text-[13px] leading-snug text-moss-571">
        {t('auth.registerHint')}
      </p>
      <form className="mt-4 grid grid-cols-1 gap-x-3 gap-y-2.5 min-[400px]:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <Field label={t('auth.firstName')}>
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.lastName')}>
          <input
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.mobile')}>
          <input
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="09171234567"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.region')}>
          <span className="relative block">
            <select
              required
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={`${inputClass} appearance-none pr-9`}
            >
              <option value="" disabled>
                {t('auth.regionPlaceholder')}
              </option>
              {PHILIPPINE_REGIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-moss-571"
            />
          </span>
        </Field>
        <Field label={t('auth.emailAddress')} wide>
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.password')}>
          <span className="flex h-10 items-center rounded-xl border border-sand-125 bg-surface pr-1 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <input
              required
              minLength={8}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-full w-full bg-transparent px-3 text-[14px] outline-none"
            />
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center text-moss-571"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
            </button>
          </span>
        </Field>
        <Field label={t('auth.confirmPassword')}>
          <input
            required
            minLength={8}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={`${t('auth.referralCode')} (${t('common.optional')})`} wide>
          <input
            autoComplete="off"
            maxLength={40}
            value={referral}
            onChange={(event) => setReferral(event.target.value.toUpperCase())}
            aria-describedby="referral-hint"
            className={inputClass}
          />
          <span id="referral-hint" className="mt-1 block text-[11px] text-moss-571">
            {t('auth.referralHint')}
          </span>
        </Field>
        <div className="col-span-full flex items-start gap-2.5 text-[13px] leading-snug text-moss-833">
          <input
            id="accept-terms"
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <label htmlFor="accept-terms">
            {t('auth.acceptTermsBefore')}{' '}
            <Link to="/terms" target="_blank" className="font-medium text-brand underline">
              {t('auth.termsLink')}
            </Link>{' '}
            {t('auth.acceptTermsAnd')}{' '}
            <Link to="/privacy" target="_blank" className="font-medium text-brand underline">
              {t('auth.privacyLink')}
            </Link>
          </label>
        </div>
        {error ? (
          <p role="alert" className="col-span-full rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">{error}</p>
        ) : null}
        <button type="submit" className="btn-primary col-span-full mt-1 h-11 w-full justify-center" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
          {pending ? t('auth.creatingAccount') : t('auth.createAccount')}
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">
        {t('auth.alreadyRegistered')}{' '}
        <Link to="/login" className="font-medium text-brand">
          {t('auth.signIn')}
        </Link>
      </p>
    </AccountShell>
  )
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? 'col-span-full block' : 'block'}>
      <span className="mb-1 block text-xs font-medium text-moss-833">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'h-10 w-full rounded-xl border border-sand-125 bg-surface px-3 text-[14px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'
