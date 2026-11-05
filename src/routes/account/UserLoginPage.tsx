import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'

import { loginMember, memberError, memberHome } from '@/services/memberAuth'

import { AccountShell } from './AccountShell'

export function UserLoginPage() {
  const navigate = useNavigate()
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
      setError(memberError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountShell
      eyebrow="YOUR ACCOUNT"
      title="Sign in"
      text="Sign in with your school account or partner account."
    >
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66756d]">
        School accounts and partner lawyers sign in here.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => void onSubmit(event)}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#24312a]">
            Email
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
          <span className="mb-2 block text-sm font-medium text-[#24312a]">
            Password
          </span>
          <span className="flex h-[52px] items-center rounded-2xl border border-[#e6e1d8] bg-white pr-2 focus-within:border-[#0e6b3e] focus-within:ring-4 focus-within:ring-[#0e6b3e]/10">
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
              className="grid h-9 w-9 place-items-center text-[#66756d]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>
        {error ? (
          <p className="rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="btn-primary h-12 w-full justify-center"
          disabled={pending}
        >
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
          {pending ? 'Signing in' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-[#5c6b63]">
        New to GabayMo?{' '}
        <Link to="/register" className="font-medium text-[#0e6b3e]">
          Create an account
        </Link>
      </p>
    </AccountShell>
  )
}

const inputClass =
  'h-[52px] w-full rounded-2xl border border-[#e6e1d8] bg-white px-4 text-[15px] outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10'
