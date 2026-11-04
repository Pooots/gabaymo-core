import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'

import { addMemberTokens, fetchMember, memberError, type MemberRow } from '@/services/memberAuth'

export function MemberDetailPage() {
  const { memberId } = useParams({ strict: false })
  const id = Number(memberId)
  const [member, setMember] = useState<MemberRow | null>(null)
  const [missing, setMissing] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setMissing(true)
      return
    }
    void fetchMember(id)
      .then(setMember)
      .catch(() => setMissing(true))
  }, [id])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const tokens = Number(amount)
    if (!Number.isInteger(tokens) || tokens < 1) {
      setError('Enter a whole number of tokens.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const next = await addMemberTokens(id, tokens)
      setMember(next)
      setAmount('')
      setNotice(`Added ${tokens.toLocaleString('en-PH')} tokens.`)
    } catch (reason) {
      setError(memberError(reason))
    } finally {
      setSaving(false)
    }
  }

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/admin/members" className="text-sm font-medium text-[#0e5c3c]">
          Members
        </Link>
        <p className="mt-6 text-sm text-[#6d6d6d]">This member was not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/members" className="text-sm font-medium text-[#0e5c3c]">
        Members
      </Link>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">
        {member?.name ?? 'Member'}
      </h1>
      <p className="mt-2 text-sm text-[#6d6d6d]">
        {member ? `${member.plan} · joined ${when(member.joined_at)}` : 'Loading this account…'}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-[#eceae6] bg-white p-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8a8a8a]">PROFILE</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Name" value={member?.name} />
            <Row label="Email" value={member?.email} />
            <Row label="Mobile" value={member?.mobile || '—'} />
            <Row label="Region" value={member?.region || '—'} />
            <Row label="School" value={member?.school_name || '—'} />
            <Row label="Plan" value={member?.plan} />
          </dl>
        </section>
        <section className="rounded-3xl border border-[#eceae6] bg-white p-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8a8a8a]">TOKENS LEFT</p>
          <p className="mt-3 text-5xl font-medium tracking-[-0.04em]">
            {member ? member.tokens_remaining.toLocaleString('en-PH') : '—'}
          </p>
          <form onSubmit={(event) => void onSubmit(event)} className="mt-6">
            <label className="text-sm font-medium" htmlFor="token-amount">
              Add tokens
            </label>
            <input
              id="token-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              required
              min={1}
              placeholder="20"
              className="mt-2 h-11 w-full rounded-2xl border border-[#e6e2da] bg-[#fbfcfb] px-4 text-sm outline-none focus:border-[#0e5c3c]"
            />
            {error ? <p className="mt-2 text-sm text-[#9b3b3b]">{error}</p> : null}
            {notice ? <p className="mt-2 text-sm text-[#0e5c3c]">{notice}</p> : null}
            <button type="submit" disabled={saving || !amount} className="btn-primary mt-4 h-11">
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
              Add tokens
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#8a8a8a]">{label}</dt>
      <dd className="text-right font-medium text-[#1c1c1c]">{value || '—'}</dd>
    </div>
  )
}

function when(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
