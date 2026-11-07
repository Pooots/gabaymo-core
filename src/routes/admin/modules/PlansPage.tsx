import { Frame, QueryState, Skeleton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useSubscriptions } from '@/queries/admin'
import { formatTokens } from '@/services/usage'

function PlanSkeletons() {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" className="grid gap-4 lg:grid-cols-3">
      <span className="sr-only">{t('admin.plansLoading')}</span>
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-4 rounded-3xl border border-sand-86 bg-surface p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function PlansPage() {
  const { t, intl } = useI18n()
  const plans = useSubscriptions()

  return (
    <Frame title={t('admin.plansTitle')} text={t('admin.plansText')}>
      <QueryState query={plans} loading={<PlanSkeletons />}>
        {(rows) => (
          <div className="grid gap-4 lg:grid-cols-3">
            {rows.map((plan) => (
              <article
                key={plan.id}
                className={`rounded-3xl border p-6 ${
                  plan.featured ? 'border-brand-strong bg-brand-strong text-white' : 'border-sand-86 bg-surface'
                }`}
              >
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="peso mt-4 text-4xl tracking-[-0.04em]">{plan.price_label}</p>
                <p className={`mt-1 text-sm ${plan.featured ? 'text-moss-112' : 'text-ash-573'}`}>{plan.cadence_label}</p>
                <p className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${plan.featured ? 'bg-surface/10' : 'bg-ash-40'}`}>
                  {t(plan.allowance_period === 'month' ? 'admin.plansTokensMonthly' : 'admin.plansTokensOnce', {
                    tokens: formatTokens(plan.token_allowance),
                  })}
                  <span className={`block text-xs font-normal ${plan.featured ? 'text-moss-112' : 'text-ash-573'}`}>
                    {t('admin.typicalQuestions', { count: plan.estimated_questions.toLocaleString(intl) })}
                  </span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.specs.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <p className={`mt-6 text-xs ${plan.featured ? 'text-moss-112' : 'text-ash-447'}`}>
                  {plan.active ? t('admin.published') : t('admin.hidden')} · {t('admin.plansNoSubscribers')}
                </p>
              </article>
            ))}
          </div>
        )}
      </QueryState>
    </Frame>
  )
}
