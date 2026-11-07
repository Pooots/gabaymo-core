import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { ActivityList } from './overview/ActivityList'
import { Panel, StatCard } from './overview/Cards'
import { peso, relativeTime } from './overview/format'
import { useNow } from './overview/hooks'
import { AllowanceChart, PlanList } from './overview/PlanCharts'
import { TrendChart } from './overview/TrendChart'
import type { StatCardProps } from './overview/Cards'
import type { OverviewStats } from '@/services/adminAuth'
import { ErrorState } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useOverview } from '@/queries/admin'

const empty: OverviewStats = {
  members: 0,
  partners: 0,
  open_tickets: 0,
  documents: 0,
  payments_total: 0,
  signups: [],
  plans: [],
  activity: [],
}

export function OverviewPage() {
  const { t, tn, intl } = useI18n()
  const overview = useOverview()
  const stats = overview.data ?? empty
  // Once loaded, a failed background refresh keeps the last numbers (like before); only a first-load failure is "offline".
  const failed = overview.isError && overview.data === undefined
  const loading = overview.isPending
  const updatedAt = overview.dataUpdatedAt || null
  const [activePlan, setActivePlan] = useState<string | null>(null)
  const now = useNow()
  const today = new Intl.DateTimeFormat(intl, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  const delta = (count: number | undefined, text: string, fallback: string) =>
    count !== undefined && count > 0 ? text : fallback

  const cards: Array<StatCardProps> = [
    {
      label: t('admin.statMembers'),
      value: stats.members,
      note: delta(stats.members_new_7d, t('admin.statNewThisWeek', { count: stats.members_new_7d ?? 0 }), t('admin.statSchoolAccounts')),
      positive: (stats.members_new_7d ?? 0) > 0,
    },
    {
      label: t('admin.statOpenTickets'),
      value: stats.open_tickets,
      note: delta(stats.tickets_new_7d, t('admin.statFiledThisWeek', { count: stats.tickets_new_7d ?? 0 }), t('admin.statWaitingPartner')),
    },
    {
      label: t('admin.statDocuments'),
      value: stats.documents,
      note: stats.documents_pending
        ? t('admin.statAwaitingReview', { count: stats.documents_pending })
        : t('admin.statApprovedSources'),
    },
    {
      label: t('admin.statCollected'),
      value: stats.payments_total,
      format: (amount) => peso(amount, intl),
      note:
        stats.payments_count !== undefined
          ? tn('admin.statPaidMemberships', stats.payments_count)
          : t('admin.statMembershipPayments'),
    },
  ]

  return (
    <div className="flex h-full w-full flex-col xl:min-h-0 xl:overflow-hidden">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="serif text-[1.65rem] leading-none font-medium tracking-[-0.03em]">{t('admin.overviewTitle')}</h1>
        <div className="flex items-center gap-3 text-sm text-ash-573">
          <button
            type="button"
            onClick={() => void overview.refetch()}
            className="group flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors hover:bg-surface hover:text-ink"
            title={t('admin.refreshNow')}
          >
            <span className="sr-only">{t('admin.refreshNow')} · </span>
            <span className={`h-1.5 w-1.5 rounded-full ${failed ? 'bg-rust-535' : 'pulse-dot bg-moss-637'}`} aria-hidden />
            <span>
              {failed
                ? t('admin.offline')
                : updatedAt
                  ? t('admin.updatedAgo', { time: relativeTime(updatedAt, now, t) })
                  : t('common.loading')}
            </span>
            <RefreshCw
              size={12}
              aria-hidden
              className={`transition-transform duration-500 group-hover:rotate-90 ${overview.isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <p className="hidden sm:block">{today}</p>
        </div>
      </div>

      {failed ? (
        <ErrorState
          compact
          className="mt-3"
          error={overview.error}
          retrying={overview.isFetching}
          onRetry={() => void overview.refetch()}
        />
      ) : null}

      <div className="mt-3 grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card, index) => (
          <StatCard key={card.label} {...card} index={index} loading={loading || failed} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.72fr)] xl:grid-rows-2">
        <Panel index={4} title={t('admin.allowanceTitle')} subtitle={t('admin.allowanceSubtitle')}>
          <AllowanceChart plans={stats.plans} active={activePlan} onActive={setActivePlan} />
        </Panel>

        <Panel index={5} title={t('admin.plansPanelTitle')} subtitle={t('admin.plansPanelSubtitle')}>
          <PlanList plans={stats.plans} active={activePlan} onActive={setActivePlan} />
        </Panel>

        <Panel index={6} title={t('admin.trendsTitle')} subtitle={t('admin.trendLast14')} flush>
          <TrendChart points={stats.signups} stats={stats} />
        </Panel>

        <Panel index={7} title={t('admin.activityTitle')} className="xl:overflow-hidden">
          <ActivityList items={stats.activity.slice(0, 4)} now={now} />
        </Panel>
      </div>
    </div>
  )
}
