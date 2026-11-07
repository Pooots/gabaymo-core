import { Check, LoaderCircle } from 'lucide-react'

import type { MemberProfile } from '@/services/memberAuth'
import type { SubscriptionPlan } from '@/services/subscriptions'
import { useI18n } from '@/i18n'

/** Review-and-pay step; "Pay now" hands over to PayMongo. */
export function Checkout({
  plan,
  member,
  paying,
  error,
  onBack,
  onPay,
}: {
  plan: SubscriptionPlan
  member: MemberProfile | null
  paying: boolean
  error: string
  onBack: () => void
  onPay: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-6 sm:px-8">
      <button type="button" className="w-fit text-sm font-medium text-muted hover:text-moss-898" disabled={paying} onClick={onBack}>
        {t('plan.backToPlans')}
      </button>
      <div className="mt-4 grid overflow-hidden rounded-[28px] border border-moss-128 bg-surface shadow-[0_30px_70px_-40px_rgba(11,63,42,0.55)] lg:grid-cols-2">
        <section className="relative flex flex-col bg-moss-855 px-6 py-8 text-white sm:px-8">
          <div className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 rounded-full bg-moss-886 blur-3xl" />
          <p className="relative text-[11px] font-semibold tracking-[0.18em] text-moss-220 uppercase">{t('plan.membershipEyebrow')}</p>
          <h1 className="serif relative mt-3 text-4xl leading-none font-medium tracking-[-0.03em] break-words">{plan.name}</h1>
          <p className="relative mt-3 max-w-sm text-sm leading-relaxed text-white/75">{plan.summary}</p>
          <p className="relative mt-8 flex flex-wrap items-end gap-2">
            <span className="peso text-5xl leading-none tracking-[-0.04em]">{plan.price_label}</span>
            <span className="mb-1 text-sm text-white/70">{plan.cadence_label}</span>
          </p>
          <p className="relative mt-4 text-sm text-white/80">{plan.allowance_label}</p>
          <ul className="relative mt-6 space-y-2.5">
            {plan.specs.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm leading-snug text-white/85">
                <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-moss-320" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col px-6 py-8 sm:px-8">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">{t('plan.checkoutEyebrow')}</p>
          <h2 className="serif mt-3 text-3xl font-medium tracking-[-0.03em] text-moss-898">{t('plan.reviewAndPay')}</h2>
          <p className="mt-2 text-sm break-words text-muted">{t('plan.billedTo', { email: member?.email ?? '' })}</p>

          <div className="mt-6 flex items-baseline justify-between gap-4 border-b border-ash-59 pb-4 text-sm">
            <span className="min-w-0 text-moss-833">{plan.name}</span>
            <span className="peso">{plan.price_label}</span>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">{t('plan.subtotal')}</dt>
              <dd className="peso text-moss-898">{plan.price_label}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-ash-59 pt-4">
              <dt className="font-semibold text-moss-898">{t('plan.total')}</dt>
              <dd className="peso text-4xl tracking-[-0.04em] text-moss-898">{plan.price_label}</dd>
            </div>
          </dl>

          <button
            type="button"
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(14,107,62,0.9)] hover:bg-brand-hover disabled:opacity-70"
            disabled={paying}
            onClick={onPay}
          >
            {paying ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('plan.payNow')}
          </button>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-rust-580">
              {error}
            </p>
          ) : null}
          <p className="mt-4 text-xs leading-relaxed text-moss-433">{t('plan.paymongoNote')}</p>
        </section>
      </div>
    </div>
  )
}
