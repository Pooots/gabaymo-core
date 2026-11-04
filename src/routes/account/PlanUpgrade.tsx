import { useEffect, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'

import { memberError, type MemberProfile } from '@/services/memberAuth'
import { startMembershipCheckout } from '@/services/payments'
import { fetchPublishedPlans, type SubscriptionPlan } from '@/services/subscriptions'

const fallbackPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'Free Trial',
    price: 0,
    price_label: '₱0',
    cadence: 'forever',
    cadence_label: 'forever',
    tokens: 20,
    summary: 'Try the assistant with full citations on a small set of questions.',
    specs: [
      '20 trial questions',
      'Full citation cards with page numbers',
      'Knowledge library search',
      'No partner lawyer support',
    ],
    featured: false,
    active: true,
    sort_order: 1,
  },
  {
    id: 2,
    name: 'Monthly Membership',
    price: 499,
    price_label: '₱499',
    cadence: 'month',
    cadence_label: 'per month',
    tokens: 300,
    summary: 'For school heads who consult policies week to week.',
    specs: [
      '300 questions every month',
      'Citation cards with page numbers',
      'Partner lawyer support tickets',
      'Token wallet and full history',
    ],
    featured: false,
    active: true,
    sort_order: 2,
  },
  {
    id: 3,
    name: 'Yearly Membership',
    price: 4990,
    price_label: '₱4,990',
    cadence: 'year',
    cadence_label: 'per year',
    tokens: 3600,
    summary: 'Twelve months of membership for the price of ten.',
    specs: [
      '3,600 questions per year',
      'Two months free',
      'Priority partner lawyer support',
      'Everything in Monthly',
    ],
    featured: true,
    active: true,
    sort_order: 3,
  },
]

export function PlanUpgrade({ member, tokens }: { member: MemberProfile | null; tokens: number }) {
  const [plans, setPlans] = useState(fallbackPlans)
  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const [checkout, setCheckout] = useState<SubscriptionPlan | null>(null)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  useEffect(() => {
    void fetchPublishedPlans()
      .then((rows) => {
        if (rows.length > 0) setPlans([...rows].sort((a, b) => a.sort_order - b.sort_order))
      })
      .catch(() => undefined)
  }, [])

  const currentName = member?.plan ?? 'Free Trial'

  async function payNow() {
    if (!checkout) return
    setPayError('')
    setPaying(true)
    try {
      const session = await startMembershipCheckout(checkout.id)
      window.location.assign(session.checkout_url)
    } catch (reason) {
      setPayError(memberError(reason))
      setPaying(false)
    }
  }

  if (checkout) {
    return (
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-6 sm:px-8">
        <button
          type="button"
          className="w-fit text-sm font-medium text-[#5c6b63] hover:text-[#142019]"
          disabled={paying}
          onClick={() => {
            setCheckout(null)
            setPayError('')
          }}
        >
          Back to plans
        </button>
        <div className="mt-4 grid overflow-hidden rounded-[28px] border border-[#d7e6dc] bg-white shadow-[0_30px_70px_-40px_rgba(11,63,42,0.55)] lg:grid-cols-2">
          <section className="relative flex flex-col bg-[#0b3f2a] px-7 py-8 text-white sm:px-8">
            <div className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 rounded-full bg-[#083224] blur-3xl" />
            <p className="relative text-[11px] font-semibold tracking-[0.18em] text-[#b7d7c4]">MEMBERSHIP</p>
            <h1 className="serif relative mt-3 text-4xl leading-none font-medium tracking-[-0.03em]">
              {checkout.name}
            </h1>
            <p className="relative mt-3 max-w-sm text-sm leading-relaxed text-white/75">{checkout.summary}</p>
            <p className="relative mt-8 flex items-end gap-2">
              <span className="peso text-5xl leading-none tracking-[-0.04em]">{checkout.price_label}</span>
              <span className="mb-1 text-sm text-white/70">{checkout.cadence_label}</span>
            </p>
            <p className="relative mt-4 text-sm text-white/80">
              {checkout.tokens.toLocaleString('en-PH')} questions included
            </p>
            <ul className="relative mt-6 space-y-2.5">
              {checkout.specs.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm leading-snug text-white/85">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#8dceab]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col px-7 py-8 sm:px-8">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#0e6b3e]">CHECKOUT</p>
            <h2 className="serif mt-3 text-3xl font-medium tracking-[-0.03em] text-[#142019]">
              Review and pay
            </h2>
            <p className="mt-2 text-sm text-[#5c6b63]">Billed to {member?.email}</p>

            <div className="mt-6 flex items-baseline justify-between gap-4 border-b border-[#eef2ef] pb-4 text-sm">
              <span className="text-[#24312a]">{checkout.name}</span>
              <span className="peso">{checkout.price_label}</span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[#5c6b63]">Subtotal</dt>
                <dd className="peso text-[#142019]">{checkout.price_label}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-[#eef2ef] pt-4">
                <dt className="font-semibold text-[#142019]">Total</dt>
                <dd className="peso text-4xl tracking-[-0.04em] text-[#142019]">{checkout.price_label}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e6b3e] text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(14,107,62,0.9)] hover:bg-[#0c5c36] disabled:opacity-70"
              disabled={paying}
              onClick={() => void payNow()}
            >
              {paying ? <LoaderCircle size={16} className="animate-spin" /> : null}
              Pay Now
            </button>
            {payError ? <p className="mt-3 text-sm text-[#9b3b3b]">{payError}</p> : null}
            <p className="mt-4 text-xs leading-relaxed text-[#8a978f]">
              Card and e-wallet are collected by PayMongo. This membership updates after the payment is confirmed.
            </p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-6 sm:px-8">
      <div className="text-center">
        <h1 className="serif text-3xl font-medium tracking-[-0.03em] text-[#142019] sm:text-4xl">
          Upgrade your membership
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#5c6b63]">
          You are on {currentName}, with {tokens.toLocaleString('en-PH')} tokens left. One question uses one token.
        </p>
        <div className="mt-5 inline-flex rounded-full bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBilling('month')}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              billing === 'month' ? 'bg-[#0e6b3e] text-white' : 'text-[#3d4c44]'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('year')}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              billing === 'year' ? 'bg-[#0e6b3e] text-white' : 'text-[#3d4c44]'
            }`}
          >
            Yearly
          </button>
        </div>
        <p className="mt-2 h-4 text-xs font-medium text-[#0e6b3e]">
          {billing === 'year' ? 'Save with yearly billing' : ''}
        </p>
      </div>

      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const current = plan.name === currentName
          const price = shownPrice(plan, billing)
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-[24px] bg-white p-5 ${
                plan.featured
                  ? 'border-2 border-[#0e6b3e] shadow-[0_22px_40px_-28px_rgba(14,107,62,0.55)]'
                  : 'border border-[#e6eeea]'
              }`}
            >
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0e6b3e]">
                {current ? 'CURRENT' : plan.featured ? 'RECOMMENDED' : 'MEMBERSHIP'}
              </p>
              <h2 className="mt-2 text-[17px] font-semibold text-[#142019]">{plan.name}</h2>
              <p className="mt-1 min-h-10 text-[13px] leading-snug text-[#66756d]">{plan.summary}</p>
              <p className="mt-4 flex items-end gap-1">
                <span className="peso text-[2.4rem] leading-none tracking-[-0.04em] text-[#142019]">
                  {price.amount}
                </span>
                <span className="mb-1 text-sm text-[#66756d]">{price.cadence}</span>
              </p>
              <p className="mt-1 h-4 text-xs text-[#8a978f]">{price.note}</p>
              <p className="mt-3 text-sm font-medium text-[#173026]">
                {plan.tokens.toLocaleString('en-PH')} questions
              </p>
              <ul className="mt-3 flex flex-1 flex-col gap-2">
                {plan.specs.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13px] leading-snug text-[#24312a]">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#1f9a5a]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={current || plan.price === 0}
                onClick={() => {
                  setPayError('')
                  setCheckout(plan)
                }}
                className={`mt-5 h-11 rounded-full text-sm font-semibold ${
                  current || plan.price === 0
                    ? 'bg-[#f3f6f4] text-[#8a978f]'
                    : plan.featured
                      ? 'bg-[#0e6b3e] text-white hover:bg-[#0c5c36]'
                      : 'bg-[#142019] text-white hover:bg-[#24312a]'
                }`}
              >
                {current ? 'Current plan' : 'Upgrade'}
              </button>
            </article>
          )
        })}
      </div>

    </div>
  )
}

function shownPrice(plan: SubscriptionPlan, billing: 'month' | 'year') {
  if (plan.price === 0 || plan.cadence === 'forever') {
    return { amount: plan.price_label, cadence: 'forever', note: '' }
  }
  if (billing === 'month') {
    if (plan.cadence === 'month') return { amount: plan.price_label, cadence: '/mo', note: '' }
    return {
      amount: peso(Math.round(plan.price / 12)),
      cadence: '/mo',
      note: `${plan.price_label} billed yearly`,
    }
  }
  if (plan.cadence === 'year') return { amount: plan.price_label, cadence: '/yr', note: 'Two months free' }
  return {
    amount: peso(plan.price * 12),
    cadence: '/yr',
    note: `${plan.price_label} billed monthly`,
  }
}

function peso(amount: number) {
  return `₱${amount.toLocaleString('en-PH')}`
}
