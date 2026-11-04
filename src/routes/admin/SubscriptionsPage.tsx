import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import {
  fetchSubscriptions,
  saveSubscription,
  subscriptionError,
  type SubscriptionCadence,
  type SubscriptionPlan,
} from '@/services/subscriptions'

type Draft = {
  name: string
  price: string
  cadence: SubscriptionCadence
  tokens: string
  summary: string
  specs: string
  featured: boolean
  active: boolean
  sort_order: string
}

const blank: Draft = {
  name: '',
  price: '',
  cadence: 'month',
  tokens: '',
  summary: '',
  specs: '',
  featured: false,
  active: true,
  sort_order: '1',
}

export function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void fetchSubscriptions()
      .then((rows) => {
        setPlans(rows)
        if (rows[0]) {
          setSelectedId(rows[0].id)
          setDraft(toDraft(rows[0]))
        }
      })
      .catch(() => setError('Could not load subscriptions.'))
      .finally(() => setLoading(false))
  }, [])

  function selectPlan(plan: SubscriptionPlan) {
    setSelectedId(plan.id)
    setDraft(toDraft(plan))
    setError('')
    setNotice('')
  }

  function startNew() {
    const nextOrder = plans.reduce((max, plan) => Math.max(max, plan.sort_order), 0) + 1
    setSelectedId(null)
    setDraft({ ...blank, sort_order: String(nextOrder) })
    setError('')
    setNotice('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const specs = draft.specs
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    setPending(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveSubscription(selectedId, {
        name: draft.name.trim(),
        price: Number(draft.price),
        cadence: draft.cadence,
        tokens: Number(draft.tokens),
        summary: draft.summary.trim(),
        specs,
        featured: draft.featured,
        active: draft.active,
        sort_order: Number(draft.sort_order),
      })
      const rows = await fetchSubscriptions()
      setPlans(rows)
      setSelectedId(saved.id)
      setDraft(toDraft(rows.find((plan) => plan.id === saved.id) ?? saved))
      setNotice(selectedId ? 'Subscription updated.' : 'Subscription added.')
    } catch (caught) {
      setError(subscriptionError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Subscriptions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
            Add a tier or update its price, question allowance, and the specs shown on the membership page.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-white"
          onClick={startNew}
        >
          Add subscription
        </button>
      </div>

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <section className="rounded-3xl border border-[#eceae6] bg-white">
          {loading ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">Loading subscriptions…</p>
          ) : plans.length === 0 ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">No subscription tiers yet.</p>
          ) : (
            <ul>
              {plans.map((plan) => {
                const selected = plan.id === selectedId
                return (
                  <li key={plan.id} className="border-b border-[#f3f1ed] last:border-0">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left ${
                        selected ? 'bg-[#f7f6f3]' : 'hover:bg-[#fafaf8]'
                      }`}
                      onClick={() => selectPlan(plan)}
                    >
                      <span>
                        <span className="block text-sm font-medium">{plan.name}</span>
                        <span className="peso mt-1 block text-xs text-[#6d6d6d]">
                          {plan.price_label} {plan.cadence_label} · {plan.tokens.toLocaleString('en-PH')} questions
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {plan.featured ? (
                          <span className="rounded-full bg-[#0e5c3c] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                            BEST VALUE
                          </span>
                        ) : null}
                        <span className="text-[11px] text-[#8d8d8d]">
                          {plan.active ? 'Published' : 'Hidden'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <form
          className="rounded-3xl border border-[#eceae6] bg-white p-5 sm:p-6"
          onSubmit={(event) => void onSubmit(event)}
        >
          <h2 className="text-lg font-semibold">
            {selectedId ? 'Edit subscription' : 'New subscription'}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <input
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Price (PHP)">
              <input
                required
                inputMode="numeric"
                min={0}
                type="number"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Billing">
              <select
                value={draft.cadence}
                onChange={(event) =>
                  setDraft({ ...draft, cadence: event.target.value as SubscriptionCadence })
                }
                className={inputClass}
              >
                <option value="forever">Forever</option>
                <option value="month">Per month</option>
                <option value="year">Per year</option>
              </select>
            </Field>
            <Field label="Questions included">
              <input
                required
                inputMode="numeric"
                min={0}
                type="number"
                value={draft.tokens}
                onChange={(event) => setDraft({ ...draft, tokens: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Display order">
              <input
                required
                inputMode="numeric"
                min={0}
                type="number"
                value={draft.sort_order}
                onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Summary" className="sm:col-span-2">
              <textarea
                required
                rows={2}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
            <Field label="Specs, one per line" className="sm:col-span-2">
              <textarea
                required
                rows={5}
                value={draft.specs}
                onChange={(event) => setDraft({ ...draft, specs: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
              />
              Best value
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Published on the site
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-4 rounded-xl bg-[#eef7f1] px-3 py-2 text-sm text-[#0e5c3c]">{notice}</p>
          ) : null}

          <button
            type="submit"
            className="btn-primary mt-5 h-11 justify-center px-5"
            disabled={pending}
          >
            {pending ? 'Saving…' : selectedId ? 'Save changes' : 'Add subscription'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-2xl border border-[#e4e1db] bg-[#fbfcfb] px-3 text-sm outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10'

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-[#6d6d6d] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function toDraft(plan: SubscriptionPlan): Draft {
  return {
    name: plan.name,
    price: String(plan.price),
    cadence: plan.cadence,
    tokens: String(plan.tokens),
    summary: plan.summary,
    specs: plan.specs.join('\n'),
    featured: plan.featured,
    active: plan.active,
    sort_order: String(plan.sort_order),
  }
}
