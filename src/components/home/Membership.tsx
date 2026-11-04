import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'

import { fetchPublishedPlans, type SubscriptionPlan } from '@/services/subscriptions'

import { Reveal } from './Reveal'

const fallbackPlans = [
  {
    name: 'Free Trial',
    price: '₱0',
    cadence: 'forever',
    blurb: 'Try the assistant with full citations on a small set of questions.',
    quota: '20 questions included',
    points: [
      '20 trial questions',
      'Full citation cards with page numbers',
      'Knowledge library search',
      'No partner lawyer support',
    ],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Monthly Membership',
    price: '₱499',
    cadence: 'per month',
    blurb: 'For school heads who consult policies week to week.',
    quota: '300 questions included',
    points: [
      '300 questions every month',
      'Citation cards with page numbers',
      'Partner lawyer support tickets',
      'Token wallet and full history',
    ],
    cta: 'Choose plan',
    featured: false,
  },
  {
    name: 'Yearly Membership',
    price: '₱4,990',
    cadence: 'per year',
    blurb: 'Twelve months of membership for the price of ten.',
    quota: '3,600 questions included',
    points: [
      '3,600 questions per year',
      'Two months free',
      'Priority partner lawyer support',
      'Everything in Monthly',
    ],
    cta: 'Choose plan',
    featured: true,
  },
]

export function Membership() {
  const [plans, setPlans] = useState(fallbackPlans)

  useEffect(() => {
    void fetchPublishedPlans()
      .then((rows) => {
        if (rows.length > 0) setPlans(rows.map(toCard))
      })
      .catch(() => undefined)
  }, [])

  return (
    <section id="membership" className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#0e6b3e]">
              MEMBERSHIP
            </p>
            <h2 className="serif mt-3 text-4xl leading-tight font-medium tracking-[-0.03em] text-[#142019] sm:text-5xl">
              One token, one answer.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#5c6b63]">
              Every question you ask GabayMo consumes one token. Unused
              subscription tokens refresh at the start of each billing cycle.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 90}>
              <article
                className={`lift-card relative flex h-full flex-col rounded-[26px] border p-6 sm:p-7 ${
                  plan.featured
                    ? 'border-[#0c4f34] bg-[#0e5c3c] text-white shadow-[0_24px_50px_-28px_rgba(14,92,60,0.8)]'
                    : 'border-[#e6eeea] bg-white text-[#173026]'
                }`}
              >
                {plan.featured ? (
                  <span className="absolute top-5 right-5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                    BEST VALUE
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p
                  className={`mt-2 min-h-12 text-sm leading-relaxed ${
                    plan.featured ? 'text-[#d5e8de]' : 'text-[#66756d]'
                  }`}
                >
                  {plan.blurb}
                </p>
                <p className="mt-6">
                  <span className="peso text-5xl tracking-[-0.04em]">
                    {plan.price}
                  </span>{' '}
                  <span
                    className={`text-sm ${plan.featured ? 'text-[#d5e8de]' : 'text-[#66756d]'}`}
                  >
                    {plan.cadence}
                  </span>
                </p>
                <p
                  className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                    plan.featured
                      ? 'bg-white/10 text-white'
                      : 'bg-[#f3f7f4] text-[#173026]'
                  }`}
                >
                  {plan.quota}
                </p>
                <ul className="mt-5 flex flex-1 flex-col gap-3 text-sm">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? 'text-[#9ee0bf]' : 'text-[#1f9a5a]'
                        }`}
                      />
                      <span className={plan.featured ? 'text-[#e7f3ec]' : ''}>
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-7 inline-flex justify-center rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    plan.featured
                      ? 'bg-white text-[#0e5c3c]'
                      : 'bg-[#0e6b3e] text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#7d8b84]">
          Plans, pricing and token allocations are configurable by the platform
          administrator.
        </p>
      </div>
    </section>
  )
}

function toCard(plan: SubscriptionPlan) {
  return {
    name: plan.name,
    price: plan.price_label,
    cadence: plan.cadence_label,
    blurb: plan.summary,
    quota: `${plan.tokens.toLocaleString('en-PH')} questions included`,
    points: plan.specs,
    cta: plan.price === 0 ? 'Start free' : 'Choose plan',
    featured: plan.featured,
  }
}
