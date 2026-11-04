import { useEffect, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'

import { createPartner, fetchPartners, partnerError, type PartnerRow } from '@/services/partners'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  specialty: '',
  password: '',
  response_hours: '24',
  partner_status: 'active',
}

export function PartnersPage() {
  const [partners, setPartners] = useState<PartnerRow[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  function load() {
    void fetchPartners()
      .then(setPartners)
      .catch(() => setPartners([]))
  }

  useEffect(load, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await createPartner({
        ...form,
        mobile: form.mobile.replace(/[\s-]/g, ''),
        response_hours: Number(form.response_hours),
      })
      setForm(emptyForm)
      setOpen(false)
      load()
    } catch (caught) {
      setError(partnerError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Partners</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
            Lawyers who accept tickets when a member needs a person to review the question.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add partner
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#142019]/45"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-dialog-title"
            autoComplete="off"
            onSubmit={(event) => void onSubmit(event)}
            className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_30px_70px_-36px_rgba(18,48,32,0.55)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="partner-dialog-title" className="serif text-2xl font-medium tracking-[-0.03em]">
                New partner account
              </h2>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-[#5c6b63] hover:bg-[#f3f6f4]"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="First name" value={form.first_name} onChange={(value) => setForm({ ...form, first_name: value })} autoComplete="off" />
              <Field label="Last name" value={form.last_name} onChange={(value) => setForm({ ...form, last_name: value })} autoComplete="off" />
              <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} autoComplete="off" />
              <Field label="Mobile number" value={form.mobile} onChange={(value) => setForm({ ...form, mobile: value })} placeholder="09171234567" autoComplete="off" />
              <Field label="Specialty" value={form.specialty} onChange={(value) => setForm({ ...form, specialty: value })} placeholder="Administrative law" autoComplete="off" />
              <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} autoComplete="new-password" />
              <Field label="Response window (hours)" type="number" value={form.response_hours} onChange={(value) => setForm({ ...form, response_hours: value })} autoComplete="off" />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#3d4c44]">Status</span>
                <select
                  value={form.partner_status}
                  onChange={(event) => setForm({ ...form, partner_status: event.target.value })}
                  className="h-11 w-full rounded-xl border border-[#e6e1d8] bg-white px-3 text-sm outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            {error ? <p className="mt-3 text-sm text-[#9f2d2d]">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="h-11 px-4 text-sm font-medium text-[#5c6b63]" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? 'Saving' : 'Create partner'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-[#eceae6] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#fafaf8] text-[11px] tracking-[0.14em] text-[#8a8a8a] uppercase">
              <tr>
                {['Lawyer', 'Specialty', 'Open tickets', 'Response window', 'Status'].map((column) => (
                  <th key={column} className="px-5 py-3 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners === null ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-[#6d6d6d]">
                    Loading partners…
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-[#6d6d6d]">
                    No partner lawyers are on the platform yet.
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="border-t border-[#f3f1ed]">
                    <td className="px-5 py-4">
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-[#6d6d6d]">{partner.email}</p>
                    </td>
                    <td className="px-5 py-4">{partner.specialty}</td>
                    <td className="px-5 py-4">{partner.open_tickets}</td>
                    <td className="px-5 py-4">{partner.response_hours} hours</td>
                    <td className="px-5 py-4 capitalize">{partner.partner_status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#3d4c44]">{label}</span>
      <input
        required
        type={type}
        min={type === 'number' ? 1 : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#e6e1d8] bg-white px-3 text-sm outline-none focus:border-[#0e6b3e]"
      />
    </label>
  )
}
