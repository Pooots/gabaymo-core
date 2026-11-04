import { useEffect, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'

import {
  fetchPartnerDashboard,
  fetchPartnerInstructions,
  fetchPartnerKnowledge,
  partnerError,
  updatePartnerProfile,
  type PartnerDocument,
  type PartnerInstruction,
  type PartnerProfile,
} from '@/services/partners'

const duties = [
  'A member opens a ticket when the library cannot answer the question.',
  'You reply inside your response window and name the page the answer comes from.',
  'If no approved source covers it, say the source is missing.',
]

export function PartnerDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPartnerDashboard>> | null>(null)

  useEffect(() => {
    void fetchPartnerDashboard()
      .then(setData)
      .catch(() => undefined)
  }, [])

  const partner = data?.partner
  const rules = data?.instructions ?? []
  const sources = data?.sources ?? []

  return (
    <div className="flex min-h-full flex-1 flex-col px-6 py-5 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">DASHBOARD</p>
          <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">
            {partner ? `Good day, ${partner.first_name || partner.name}.` : 'Partner desk'}
          </h1>
        </div>
        <p className="rounded-full border border-[#e6eeea] bg-white px-4 py-2 text-sm text-[#3d4c44]">
          <span className="capitalize">{partner?.partner_status ?? 'Active'}</span>
          {partner?.specialty ? ` · ${partner.specialty}` : ''}
          {partner ? ` · ${partner.response_hours}-hour reply` : ''}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open tickets" value={String(data?.open_tickets ?? 0)} note="In your inbox" />
        <Stat label="Reply within" value={partner ? `${partner.response_hours}h` : '0h'} note="Your response window" />
        <Stat label="Service rules" value={String(rules.length)} note="Follow these on every ticket" />
        <Stat label="Approved sources" value={String(data?.documents ?? 0)} note="Ready to cite" />
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <section className="flex flex-col rounded-3xl border border-[#e6eeea] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Ticket inbox</h2>
            <Link to="/partner/tickets" className="text-sm font-medium text-[#0e6b3e]">
              Open inbox
            </Link>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#5c6b63]">
            {data?.open_tickets
              ? `${data.open_tickets} ticket${data.open_tickets === 1 ? '' : 's'} waiting for a reply.`
              : 'Nothing is waiting. New tickets from members will appear here.'}
          </p>
          <ol className="mt-5 flex flex-1 flex-col justify-center gap-5">
            {duties.map((duty, index) => (
              <li key={duty} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e7f3ec] text-xs font-semibold text-[#0e6b3e]">
                  {index + 1}
                </span>
                <span className="pt-1 text-[#24312a]">{duty}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-[#eef2ef] pt-4 text-sm leading-relaxed text-[#3d4c44]">
            {partner
              ? `Your commitment is a reply within ${partner.response_hours} hours${
                  partner.specialty ? ` on ${partner.specialty} questions` : ''
                }, with the page the answer comes from.`
              : 'A reply names the page it comes from.'}
          </p>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-3xl border border-[#e6eeea] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Your practice</h2>
              <Link to="/partner/profile" className="text-sm font-medium text-[#0e6b3e]">
                Profile
              </Link>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Specialty" value={partner?.specialty} />
              <Row label="Email" value={partner?.email} />
              <Row label="Mobile" value={partner?.mobile} />
              <Row label="Window" value={partner ? `${partner.response_hours} hours` : null} />
            </dl>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-[#e6eeea] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Before you reply</h2>
              <Link to="/partner/instructions" className="text-sm font-medium text-[#0e6b3e]">
                Rules
              </Link>
            </div>
            {rules.length === 0 ? (
              <p className="mt-3 text-sm text-[#6d6d6d]">No service instructions are active.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rules.map((rule) => (
                  <li key={rule.id} className="text-sm text-[#24312a]">
                    {rule.title}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-[#eef2ef] pt-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Library</h2>
                <Link to="/partner/library" className="text-sm font-medium text-[#0e6b3e]">
                  Sources
                </Link>
              </div>
              {sources.length === 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-[#6d6d6d]">
                  No approved sources yet. A reply still has to name the page it comes from.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {sources.map((source) => (
                    <li key={source.id} className="truncate text-sm text-[#24312a]">
                      {source.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export function PartnerInstructions() {
  const [rows, setRows] = useState<PartnerInstruction[] | null>(null)

  useEffect(() => {
    void fetchPartnerInstructions()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">HOW TO ANSWER</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">Service instructions</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">
        Follow these when you accept a ticket. GabayMo keeps the rules; you apply them.
      </p>
      <div className="mt-8 space-y-3">
        {rows === null ? (
          <p className="text-sm text-[#6d6d6d]">Loading instructions…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-3xl border border-[#e6eeea] bg-white px-6 py-16 text-center text-sm text-[#6d6d6d]">
            No service instructions are active.
          </p>
        ) : (
          rows.map((row, index) => (
            <article key={row.id} className="rounded-3xl border border-[#e6eeea] bg-white px-5 py-5">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0e6b3e]">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{row.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#3d4c44]">{row.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export function PartnerLibrary() {
  const [rows, setRows] = useState<PartnerDocument[] | null>(null)
  const [open, setOpen] = useState<PartnerDocument | null>(null)

  useEffect(() => {
    void fetchPartnerKnowledge()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">SOURCES</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">Knowledge library</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c6b63]">
        Approved documents you can cite. A source stays here after review.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          {rows === null ? (
            <p className="text-sm text-[#6d6d6d]">Loading the library…</p>
          ) : rows.length === 0 ? (
            <p className="rounded-3xl border border-[#e6eeea] bg-white px-6 py-16 text-center text-sm text-[#6d6d6d]">
              No approved sources yet.
            </p>
          ) : (
            rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setOpen(row)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${
                  open?.id === row.id ? 'border-[#0e6b3e] bg-white' : 'border-[#e6eeea] bg-white hover:border-[#b7d7c4]'
                }`}
              >
                <p className="text-sm font-medium">{row.title}</p>
                <p className="mt-1 text-xs text-[#6b7870]">
                  {row.kind_label}
                  {row.reference ? ` · ${row.reference}` : ''}
                </p>
              </button>
            ))
          )}
        </div>
        <article className="rounded-3xl border border-[#e6eeea] bg-white p-6">
          {open ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0e6b3e]">{open.category}</p>
              <h2 className="serif mt-2 text-3xl font-medium tracking-[-0.03em]">{open.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#3d4c44]">{open.summary}</p>
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-[#24312a]">{open.content}</p>
            </>
          ) : (
            <p className="text-sm text-[#6d6d6d]">Select a source to read it.</p>
          )}
        </article>
      </div>
    </div>
  )
}

export function PartnerProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [mobile, setMobile] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [hours, setHours] = useState('24')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    void fetchPartnerDashboard()
      .then((data) => {
        setProfile(data.partner)
        setFirst(data.partner.first_name ?? '')
        setLast(data.partner.last_name ?? '')
        setMobile(data.partner.mobile ?? '')
        setSpecialty(data.partner.specialty ?? '')
        setHours(String(data.partner.response_hours))
      })
      .catch(() => undefined)
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    setPending(true)
    try {
      const next = await updatePartnerProfile({
        first_name: first.trim(),
        last_name: last.trim(),
        mobile: mobile.replace(/[\s-]/g, ''),
        specialty: specialty.trim(),
        response_hours: Number(hours),
      })
      setProfile(next)
      setSaved(true)
    } catch (caught) {
      setError(partnerError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-8 py-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">ACCOUNT</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">My profile</h1>
      <p className="mt-2 text-sm text-[#5c6b63]">{profile?.email}</p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-3">
        <label className="block text-sm">
          First name
          <input value={first} onChange={(event) => setFirst(event.target.value)} required className={field} />
        </label>
        <label className="block text-sm">
          Last name
          <input value={last} onChange={(event) => setLast(event.target.value)} required className={field} />
        </label>
        <label className="block text-sm">
          Mobile number
          <input value={mobile} onChange={(event) => setMobile(event.target.value)} required className={field} />
        </label>
        <label className="block text-sm">
          Specialty
          <input value={specialty} onChange={(event) => setSpecialty(event.target.value)} required placeholder="Administrative law" className={field} />
        </label>
        <label className="block text-sm">
          Response window (hours)
          <input type="number" min={1} max={168} value={hours} onChange={(event) => setHours(event.target.value)} required className={field} />
        </label>
        {error ? <p className="text-sm text-[#9f2d2d]">{error}</p> : null}
        {saved ? <p className="text-sm text-[#0e6b3e]">Profile saved.</p> : null}
        <button type="submit" className="btn-primary mt-2" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
          {pending ? 'Saving' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-3xl border border-[#e6eeea] bg-white px-4 py-4">
      <p className="text-xs text-[#6b7870]">{label}</p>
      <p className="serif mt-1 text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[#8a978f]">{note}</p>
    </article>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[#6b7870]">{label}</dt>
      <dd className="truncate text-right font-medium">{value || 'Not set'}</dd>
    </div>
  )
}

const field =
  'mt-1.5 h-11 w-full rounded-xl border border-[#e6e1d8] bg-white px-3 text-sm outline-none focus:border-[#0e6b3e]'
