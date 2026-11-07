import type { MessageKey, Vars } from '@/i18n'
import type { SubscriptionPlan } from '@/services/subscriptions'

type T = (key: MessageKey, vars?: Vars) => string

/** Shown only when the API has no published plans. */
export const fallbackPlans: Array<SubscriptionPlan> = [
  {
    id: 1,
    name: 'Free Trial',
    price: 0,
    price_label: '₱0',
    cadence: 'forever',
    cadence_label: 'forever',
    token_allowance: 200_000,
    allowance_period: 'once',
    estimated_questions: 20,
    allowance_label: 'About 20 questions of usage',
    summary: 'Try the assistant with full citations on a small set of questions.',
    specs: [
      'Trial usage for about 20 questions',
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
    token_allowance: 3_000_000,
    allowance_period: 'month',
    estimated_questions: 300,
    allowance_label: 'About 300 questions of usage each month',
    summary: 'For school heads who consult policies week to week.',
    specs: [
      'Usage for about 300 questions, refreshed monthly',
      'Citation cards with page numbers',
      'Partner lawyer support tickets',
      'Usage meter and full history',
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
    token_allowance: 3_600_000,
    allowance_period: 'month',
    estimated_questions: 360,
    allowance_label: 'About 360 questions of usage each month',
    summary: 'Twelve months of membership for the price of ten.',
    specs: ['20% more monthly usage than Monthly', 'Two months free', 'Priority partner lawyer support', 'Everything in Monthly'],
    featured: true,
    active: true,
    sort_order: 3,
  },
]

export type Billing = 'month' | 'year'

/** Price as shown for the chosen billing toggle (monthly equivalent or yearly total). */
export function shownPrice(plan: SubscriptionPlan, billing: Billing, t: T, intl: string) {
  const peso = (amount: number) => `₱${amount.toLocaleString(intl)}`
  if (plan.price === 0 || plan.cadence === 'forever') {
    return { amount: plan.price_label, cadence: t('plan.forever'), note: '' }
  }
  if (billing === 'month') {
    if (plan.cadence === 'month') return { amount: plan.price_label, cadence: t('plan.perMonthShort'), note: '' }
    return { amount: peso(Math.round(plan.price / 12)), cadence: t('plan.perMonthShort'), note: t('plan.billedYearly', { price: plan.price_label }) }
  }
  if (plan.cadence === 'year') return { amount: plan.price_label, cadence: t('plan.perYearShort'), note: t('plan.twoMonthsFree') }
  return { amount: peso(plan.price * 12), cadence: t('plan.perYearShort'), note: t('plan.billedMonthly', { price: plan.price_label }) }
}
