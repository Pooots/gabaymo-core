import type { MessageKey } from '@/i18n'
import type { TokenUsage, UsageEvent } from '@/services/usage'
import { ErrorState, Skeleton } from '@/components/ui'
import { UsageMeter } from '@/components/usage/UsageMeter'
import { useI18n } from '@/i18n'
import { useUsage } from '@/queries/member'
import { EMPTY_USAGE, formatPercent } from '@/services/usage'

export function UsageScreen({ initial, onUpgrade }: { initial: TokenUsage | null; onUpgrade: () => void }) {
  const { t, intl } = useI18n()
  const query = useUsage()
  const usage = query.data?.usage ?? initial

  return (
    <>
      <UsageMeter usage={usage ?? EMPTY_USAGE} label={usage?.refreshes ? t('usage.thisMonth') : t('usage.trial')} />
      <button type="button" onClick={onUpgrade} className="btn-primary mt-6">
        {t('settings.upgrade')}
      </button>

      <h2 className="mt-8 text-sm font-semibold text-moss-833">{t('settings.recentUsage')}</h2>
      {query.isPending ? (
        <div role="status" aria-busy="true" className="mt-3 space-y-2 rounded-3xl border border-line bg-surface px-5 py-4">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : query.isError ? (
        <ErrorState className="mt-3" compact error={query.error} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
      ) : query.data.events.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('settings.noUsage')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ash-59 rounded-3xl border border-line bg-surface">
          {query.data.events.map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="min-w-0 break-words text-moss-833">{eventLabel(event, t)}</span>
              <span className="flex shrink-0 items-baseline gap-3">
                <span className={event.type === 'usage' ? 'font-medium text-moss-833' : 'font-medium text-brand'}>
                  {event.type === 'usage' ? '−' : '+'}
                  {formatPercent(event.percent)}
                </span>
                <span className="w-16 text-right text-xs text-moss-433 sm:w-20">
                  {event.created_at ? new Date(event.created_at).toLocaleDateString(intl, { month: 'short', day: 'numeric' }) : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function eventLabel(event: UsageEvent, t: (key: MessageKey, vars?: Record<string, string | number>) => string) {
  switch (event.type) {
    case 'usage':
      return t('settings.eventAnswered')
    case 'period_start':
      return t('settings.eventRefreshed')
    case 'extra_grant':
      return event.note ? t('settings.eventExtraNote', { note: event.note }) : t('settings.eventExtra')
    default:
      return t('settings.eventAdjustment')
  }
}
