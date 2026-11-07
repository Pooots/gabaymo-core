import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'

import { Reveal } from './Reveal'
import type { MessageKey } from '@/i18n'
import type { SubscriptionPlan } from '@/services/subscriptions'
import { useI18n } from '@/i18n'
import { usePublishedPlans } from '@/queries/member'

type PlanCard = {
  name: string
  price: string
  cadence: string
  blurb: string
  quota: string
  points: Array<string>
  cta: MessageKey
  featured: boolean
}

/** Plan content mirrors what the API publishes (admin-written, not translated). */

const fallbackPlans: Array<PlanCard> = [
  {
    name: 'Free Trial',
    price: '₱0',
    cadence: 'forever',
    blurb: 'Try the assistant with full citations on a small set of questions.',
    quota: 'Usage for about 20 questions',
    points: [
      'Trial usage for about 20 questions',
      'Full citation cards with page numbers',
      'Knowledge library search',
      'No partner lawyer support',
    ],
    cta: 'home.planStartFree',
    featured: false,
  },
  {
    name: 'Monthly Membership',
    price: '₱499',
    cadence: 'per month',
    blurb: 'For school heads who consult policies week to week.',
    quota: 'Usage for about 300 questions a month',
    points: [
      'Usage for about 300 questions, refreshed monthly',
      'Citation cards with page numbers',
      'Partner lawyer support tickets',
      'Usage meter and full history',
    ],
    cta: 'home.planChoose',
    featured: false,
  },
  {
    name: 'Yearly Membership',
    price: '₱4,990',
    cadence: 'per year',
    blurb: 'Twelve months of membership for the price of ten.',
    quota: 'Usage for about 360 questions a month',
    points: [
      '20% more monthly usage than Monthly',
      'Two months free',
      'Priority partner lawyer support',
      'Everything in Monthly',
    ],
    cta: 'home.planChoose',
    featured: true,
  },
]

export function Membership() {
  const { t } = useI18n()
  const query = usePublishedPlans()
  // Public landing page: while loading, on failure or with nothing published we
  // show the standard plans instead of an error. Pricing is re-checked at checkout.
  const plans = query.data && query.data.length > 0 ? query.data.map(toCard) : fallbackPlans

  return (
    <section id="membership" className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              {t('home.membershipEyebrow')}
            </p>
            <h2 className="serif mt-3 text-4xl leading-tight font-medium tracking-[-0.03em] text-moss-898 sm:text-5xl">
              {t('home.membershipTitle')}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">
              {t('home.membershipBody')}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 90}>
              <article
                className={`lift-card relative flex h-full flex-col rounded-[26px] border p-6 sm:p-7 ${
                  plan.featured
                    ? 'border-moss-822 bg-brand-strong text-white shadow-[0_24px_50px_-28px_rgba(14,92,60,0.8)]'
                    : 'border-line bg-surface text-moss-861'
                }`}
              >
                {plan.featured ? (
                  <span className="absolute top-5 right-5 rounded-full bg-surface/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                    {t('home.bestValue')}
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p
                  className={`mt-2 min-h-12 text-sm leading-relaxed ${
                    plan.featured ? 'text-moss-127' : 'text-moss-571'
                  }`}
                >
                  {plan.blurb}
                </p>
                <p className="mt-6">
                  <span className="peso text-5xl tracking-[-0.04em]">
                    {plan.price}
                  </span>{' '}
                  <span
                    className={`text-sm ${plan.featured ? 'text-moss-127' : 'text-moss-571'}`}
                  >
                    {plan.cadence}
                  </span>
                </p>
                <p
                  className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                    plan.featured
                      ? 'bg-surface/10 text-white'
                      : 'bg-ash-39 text-moss-861'
                  }`}
                >
                  {plan.quota}
                </p>
                <ul className="mt-5 flex flex-1 flex-col gap-3 text-sm">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? 'text-moss-251' : 'text-moss-637'
                        }`}
                      />
                      <span className={plan.featured ? 'text-moss-71' : ''}>
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-7 inline-flex justify-center rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    plan.featured
                      ? 'bg-surface text-brand-strong'
                      : 'bg-brand text-white'
                  }`}
                >
                  {t(plan.cta)}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-moss-482">
          {t('home.membershipNote')}
        </p>
      </div>
    </section>
  )
}

function toCard(plan: SubscriptionPlan): PlanCard {
  return {
    name: plan.name,
    price: plan.price_label,
    cadence: plan.cadence_label,
    blurb: plan.summary,
    quota: plan.allowance_label,
    points: plan.specs,
    cta: plan.price === 0 ? 'home.planStartFree' : 'home.planChoose',
    featured: plan.featured,
  }
}
