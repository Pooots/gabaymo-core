import { useEffect, useState } from 'react'

import { AnimatedNumber } from './Cards'
import { planTones } from './format'
import type { PlanStat } from '@/services/adminAuth'
import { useI18n } from '@/i18n'
import { formatTokens } from '@/services/usage'

type PlanProps = {
  plans: Array<PlanStat>
  active: string | null
  onActive: (name: string | null) => void
}

/** Bar per published plan, height ~ token allowance (eased so small plans stay visible). */
export function AllowanceChart({ plans, active, onActive }: PlanProps) {
  const { t, tn, intl } = useI18n()
  if (plans.length === 0) {
    return <p className="mt-6 text-sm text-ash-573">{t('admin.overviewNoPlans')}</p>
  }

  const max = Math.max(1, ...plans.map((plan) => plan.token_allowance))

  return (
    <div
      className="mt-3 grid h-40 items-end gap-4 xl:h-auto xl:min-h-0 xl:flex-1"
      style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}
      onMouseLeave={() => onActive(null)}
    >
      {plans.map((plan, index) => {
        const isActive = active === plan.name
        const dimmed = active !== null && !isActive
        const monthly = plan.allowance_period === 'month'
        return (
          <div
            key={plan.name}
            className="relative flex h-full min-h-0 cursor-pointer flex-col"
            onMouseEnter={() => onActive(plan.name)}
            onFocus={() => onActive(plan.name)}
            onBlur={() => onActive(null)}
            tabIndex={0}
          >
            <p className={`peso mb-1 text-center text-xs font-medium transition-opacity duration-200 ${dimmed ? 'opacity-40' : ''}`}>
              {formatTokens(plan.token_allowance)}
              <span className="font-normal text-ash-447">{monthly ? t('admin.perMonthShort') : t('admin.onceShort')}</span>
            </p>
            <div className="relative flex min-h-0 flex-1 items-end border-b border-sand-86">
              <div
                className="dash-bar w-full rounded-t-lg transition-[filter,opacity] duration-200"
                style={{
                  height: `${Math.max(4, Math.round(Math.pow(plan.token_allowance / max, 0.45) * 100))}%`,
                  background: planTones[index % planTones.length],
                  animationDelay: `${200 + index * 120}ms`,
                  opacity: dimmed ? 0.35 : 1,
                  filter: isActive ? 'brightness(1.08) saturate(1.1)' : undefined,
                }}
              />
              {isActive && (
                <div className="dash-rise pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto w-max max-w-[220px] rounded-xl bg-ink px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg [animation-duration:0.25s]">
                  <p className="text-xs font-semibold">{plan.name}</p>
                  <p className="peso text-white/80">
                    {t(monthly ? 'admin.overviewTokensMonthly' : 'admin.overviewTokensOnce', {
                      count: plan.token_allowance.toLocaleString(intl),
                    })}
                  </p>
                  <p className="text-white/80">
                    {t('admin.typicalQuestions', { count: plan.estimated_questions.toLocaleString(intl) })}
                  </p>
                  <p className="peso text-white/80">
                    {plan.price} {plan.cadence} · {tn('admin.subscribers', plan.subscribers)}
                  </p>
                </div>
              )}
            </div>
            <p className={`mt-1.5 truncate text-center text-[11px] transition-colors ${isActive ? 'font-medium text-brand-strong' : 'text-ash-573'}`}>
              {plan.name}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/** Subscriber count per plan with a share-of-members fill. */
export function PlanList({ plans, active, onActive }: PlanProps) {
  const { t } = useI18n()
  const total = plans.reduce((sum, plan) => sum + plan.subscribers, 0)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (plans.length === 0) {
    return <p className="mt-6 text-sm text-ash-573">{t('admin.overviewNoPlans')}</p>
  }

  return (
    <ul className="mt-3 flex flex-1 flex-col justify-center gap-2" onMouseLeave={() => onActive(null)}>
      {plans.map((plan, index) => {
        const share = total > 0 ? plan.subscribers / total : 0
        const isActive = active === plan.name
        return (
          <li
            key={plan.name}
            onMouseEnter={() => onActive(plan.name)}
            className={`relative overflow-hidden rounded-xl px-3 py-2 transition-all duration-200 ${isActive ? 'translate-x-0.5 bg-moss-51 ring-1 ring-moss-145' : 'bg-ash-40'}`}
          >
            <div
              className="absolute inset-y-0 left-0 transition-[width] duration-1000 ease-out"
              style={{
                width: mounted ? `${share * 100}%` : '0%',
                background: planTones[index % planTones.length],
                opacity: 0.16,
                transitionDelay: `${300 + index * 100}ms`,
              }}
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="peso text-[11px] text-ash-573">
                  {plan.price} {plan.cadence}
                </p>
              </div>
              <div className="text-right">
                <AnimatedNumber value={plan.subscribers} className="peso text-xl leading-none" />
                <p className={`text-[10px] text-ash-447 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  {t('admin.overviewShareOfMembers', { percent: Math.round(share * 100) })}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
