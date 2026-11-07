import { useState } from 'react'
import { Check } from 'lucide-react'

import { Checkout } from './plan/Checkout'
import { fallbackPlans, shownPrice } from './plan/plans'
import type { Billing } from './plan/plans'
import type { MemberProfile } from '@/services/memberAuth'
import type { SubscriptionPlan } from '@/services/subscriptions'
import type { TokenUsage } from '@/services/usage'
import { ErrorState, Skeleton } from '@/components/ui'
import { UsageMeter } from '@/components/usage/UsageMeter'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { usePublishedPlans } from '@/queries/member'
import { startMembershipCheckout } from '@/services/payments'
import { formatPercent } from '@/services/usage'

export function PlanUpgrade({
  member,
  usage,
  renewPlanId = null,
}: {
  member: MemberProfile | null
  usage: TokenUsage | null
  /** "Pay again": go straight to the checkout of this plan once plans load. */
  renewPlanId?: number | null
}) {
  const { t, intl } = useI18n()
  const plansQuery = usePublishedPlans()
  const [billing, setBilling] = useState<Billing>('month')
  const [picked, setPicked] = useState<SubscriptionPlan | null>(null)
  const [renewDismissed, setRenewDismissed] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const published = plansQuery.data ?? []
  const plans = published.length > 0 ? [...published].sort((a, b) => a.sort_order - b.sort_order) : fallbackPlans
  const currentName = member?.plan ?? t('account.freeTrial')
  const renewPlan = renewPlanId !== null && !renewDismissed ? (published.find((plan) => plan.id === renewPlanId) ?? null) : null
  const checkout = picked ?? renewPlan
  const setCheckout = (plan: SubscriptionPlan | null) => {
    setPicked(plan)
    if (!plan) setRenewDismissed(true)
  }

  async function payNow() {
    if (!checkout) return
    setPayError('')
    setPaying(true)
    try {
      const session = await startMembershipCheckout(checkout.id)
      window.location.assign(session.checkout_url)
    } catch (reason) {
      setPayError(apiErrorMessage(reason, t('plan.checkoutError')))
      setPaying(false)
    }
  }

  if (checkout) {
    return (
      <Checkout
        plan={checkout}
        member={member}
        paying={paying}
        error={payError}
        onBack={() => {
          setCheckout(null)
          setPayError('')
        }}
        onPay={() => void payNow()}
      />
    )
  }

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-6 sm:px-8">
      <div className="text-center">
        <h1 className="serif text-3xl font-medium tracking-[-0.03em] text-moss-898 sm:text-4xl">{t('plan.title')}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {usage
            ? t('plan.introWithUsage', { plan: currentName, left: formatPercent(usage.percent_remaining) })
            : t('plan.intro', { plan: currentName })}
        </p>
        {usage ? (
          <div className="mx-auto mt-4 max-w-sm text-left">
            <UsageMeter usage={usage} label={t('plan.planUsage', { plan: currentName })} />
          </div>
        ) : null}
        <div role="group" aria-label={t('plan.billingLabel')} className="mt-5 inline-flex rounded-full bg-surface p-1 shadow-sm">
          {(['month', 'year'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={billing === option}
              onClick={() => setBilling(option)}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${billing === option ? 'bg-brand text-white' : 'text-moss-731'}`}
            >
              {option === 'month' ? t('plan.monthly') : t('plan.yearly')}
            </button>
          ))}
        </div>
        <p className="mt-2 h-4 text-xs font-medium text-brand">{billing === 'year' ? t('plan.saveYearly') : ''}</p>
      </div>

      {plansQuery.isPending ? (
        <div role="status" aria-busy="true" className="mt-4 grid gap-4 lg:grid-cols-3">
          <span className="sr-only">{t('plan.loading')}</span>
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 rounded-[24px] border border-line bg-surface p-5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="mt-4 h-11 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : plansQuery.isError ? (
        // Checkout needs the real plan ids, so no stand-in plans here.
        <ErrorState className="mt-4" error={plansQuery.error} title={t('plan.loadError')} retrying={plansQuery.isRefetching} onRetry={() => void plansQuery.refetch()} />
      ) : (
        <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const current = plan.name === currentName
            const price = shownPrice(plan, billing, t, intl)
            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-[24px] bg-surface p-5 ${
                  plan.featured ? 'border-2 border-brand shadow-[0_22px_40px_-28px_rgba(14,107,62,0.55)]' : 'border border-line'
                }`}
              >
                <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
                  {current ? t('plan.badgeCurrent') : plan.featured ? t('plan.badgeRecommended') : t('plan.badgeMembership')}
                </p>
                <h2 className="mt-2 text-[17px] font-semibold text-moss-898">{plan.name}</h2>
                <p className="mt-1 min-h-10 text-[13px] leading-snug text-moss-571">{plan.summary}</p>
                <p className="mt-4 flex flex-wrap items-end gap-1">
                  <span className="peso text-[2.4rem] leading-none tracking-[-0.04em] text-moss-898">{price.amount}</span>
                  <span className="mb-1 text-sm text-moss-571">{price.cadence}</span>
                </p>
                <p className="mt-1 h-4 text-xs text-moss-433">{price.note}</p>
                <p className="mt-3 text-sm font-medium text-moss-861">{plan.allowance_label}</p>
                <ul className="mt-3 flex flex-1 flex-col gap-2">
                  {plan.specs.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-[13px] leading-snug text-moss-833">
                      <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-moss-637" />
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
                      ? 'bg-ash-41 text-moss-433'
                      : plan.featured
                        ? 'bg-brand text-white hover:bg-brand-hover'
                        : 'bg-moss-898 text-white hover:bg-moss-833'
                  }`}
                >
                  {current ? t('plan.currentPlan') : t('plan.upgrade')}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
