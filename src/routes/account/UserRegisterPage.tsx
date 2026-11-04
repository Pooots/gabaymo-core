import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, Eye, EyeOff, LoaderCircle } from 'lucide-react'

import { PHILIPPINE_REGIONS } from '@/data/philippineRegions'
import { memberError, registerMember } from '@/services/memberAuth'

import { AccountShell } from './AccountShell'

export function UserRegisterPage() {
  const navigate = useNavigate()
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
      setError('The passwords do not match.')
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
      })
      await navigate({ to: '/account' })
    } catch (caught) {
      setError(memberError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountShell
      fit
      eyebrow="GET STARTED"
      title="Create your account"
      text="Register the account that will ask questions and keep the cited answers."
    >
      <p className="mt-2 text-[13px] leading-snug text-[#66756d]">
        A new account starts on the Free Trial. One question uses one token.
      </p>
      <form className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5" onSubmit={(event) => void onSubmit(event)}>
        <Field label="First name">
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Last name">
          <input
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Mobile number">
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
        <Field label="Region">
          <span className="relative block">
            <select
              required
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={`${inputClass} appearance-none pr-9`}
            >
              <option value="" disabled>
                Select a region
              </option>
              {PHILIPPINE_REGIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#66756d]"
            />
          </span>
        </Field>
        <Field label="Email address" wide>
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Password">
          <span className="flex h-10 items-center rounded-xl border border-[#e6e1d8] bg-white pr-1 focus-within:border-[#0e6b3e] focus-within:ring-4 focus-within:ring-[#0e6b3e]/10">
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
              className="grid h-8 w-8 shrink-0 place-items-center text-[#66756d]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
        </Field>
        <Field label="Confirm password">
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
        {error ? (
          <p className="col-span-2 rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">{error}</p>
        ) : null}
        <button type="submit" className="btn-primary col-span-2 mt-1 h-11 w-full justify-center" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
          {pending ? 'Creating account' : 'Create account'}
        </button>
      </form>
      <p className="mt-3 text-sm text-[#5c6b63]">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-[#0e6b3e]">
          Sign in
        </Link>
      </p>
    </AccountShell>
  )
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? 'col-span-2 block' : 'block'}>
      <span className="mb-1 block text-xs font-medium text-[#24312a]">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'h-10 w-full rounded-xl border border-[#e6e1d8] bg-white px-3 text-[14px] outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10'
