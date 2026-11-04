import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'

import { loginAdmin } from '@/services/adminAuth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setPending(true)
    try {
      await loginAdmin(email.trim(), password)
      await navigate({ to: '/admin' })
    } catch {
      setError('These credentials do not match our records.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="home-shell flex min-h-screen items-center justify-center px-5 py-12">
      <div className="hero-rise grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#e4ece7] bg-white shadow-[0_30px_80px_-48px_rgba(16,40,28,0.55)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-[#0e5c3c] p-10 text-white lg:flex">
          <span className="inline-flex w-fit rounded-2xl bg-white px-3 py-2">
            <img src="/gabaymo-logo.png" alt="GabayMo" className="h-12 w-auto" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#b7e4cc]">
              ADMIN
            </p>
            <h1 className="serif mt-3 text-4xl leading-tight font-medium">
              Know what the rule says, before you act.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#d7eee3]">
              Sign in to manage members, documents, plans, and the records
              behind every cited answer.
            </p>
          </div>
          <p className="text-xs text-[#b7e4cc]">GabayMo platform administration</p>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#5c6b63]"
          >
            <ArrowLeft size={16} />
            Back to site
          </Link>
          <img
            src="/gabaymo-logo.png"
            alt="GabayMo"
            className="mt-6 h-12 w-auto lg:hidden"
          />
          <h2 className="serif mt-6 text-4xl font-medium tracking-[-0.03em] text-[#142019]">
            Admin sign in
          </h2>
          <p className="mt-2 text-sm text-[#5c6b63]">
            Use your platform administrator account.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#24312a]">
                Email
              </span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#e1eae4] bg-[#fbfcfb] px-4 outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10"
                placeholder="admin@gabaymo.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#24312a]">
                Password
              </span>
              <span className="flex h-12 items-center rounded-2xl border border-[#e1eae4] bg-[#fbfcfb] pr-2 transition focus-within:border-[#0e6b3e] focus-within:ring-4 focus-within:ring-[#0e6b3e]/10">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
        </section>
      </div>
    </main>
  )
}
