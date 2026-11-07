import { useNavigate, useSearch } from '@tanstack/react-router'

import { useAdminFormat } from '../modules/shared'
import { DailyBars, RankedBars, SplitBar } from './charts'
import type { AiAnalytics } from '@/services/adminOps'
import { Card, CardTitle, ErrorState, Frame, LoadingState, Tabs } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useAiAnalytics } from '@/queries/admin'

const DAY_OPTIONS = ['7', '30', '90'] as const
type DayOption = (typeof DAY_OPTIONS)[number]

/** /admin/ai/analytics?days= — reviewer analytics from gabaymo-ai. */
export function AnalyticsPage() {
  const { t } = useI18n()
  const { days } = useSearch({ from: '/admin/ai/analytics' })
  const navigate = useNavigate()
  const query = useAiAnalytics(days)

  return (
    <Frame title={t('adminOps.analyticsTitle')} text={t('adminOps.analyticsText')}>
      <div className="mb-5">
        <Tabs<DayOption>
          label={t('adminOps.analyticsRange')}
          value={String(days) as DayOption}
          onChange={(next) => void navigate({ to: '/admin/ai/analytics', search: { days: Number(next) } })}
          tabs={DAY_OPTIONS.map((value) => ({ id: value, label: t('adminOps.lastDays', { days: value }) }))}
        />
      </div>
      {query.isPending ? (
        <LoadingState rows={6} />
      ) : query.isError && !query.data ? (
        <ErrorState error={query.error} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
      ) : (
        <Dashboard data={query.data} />
      )}
    </Frame>
  )
}

function Dashboard({ data }: { data: AiAnalytics }) {
  const { t, intl } = useI18n()
  const f = useAdminFormat()
  const short = new Intl.DateTimeFormat(intl, { month: 'short', day: 'numeric' })
  const day = (value: string) => short.format(new Date(`${value}T00:00:00`))
  // AI spend is often a fraction of a cent per day, so show up to 4 decimals below one dollar.
  const usdWhole = new Intl.NumberFormat(intl, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
  const usdSmall = new Intl.NumberFormat(intl, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })
  const usd = { format: (value: number) => (value > 0 && value < 1 ? usdSmall : usdWhole).format(value) }

  const totalQuestions = data.questions_per_day.reduce((sum, p) => sum + p.count, 0)
  const totalCost = data.cost_per_day.reduce((sum, p) => sum + p.usd, 0)
  const { up, down } = data.feedback
  const minutes = data.review_queue.avg_minutes_to_send

  const stats = [
    { label: t('adminOps.statQuestions'), value: f.number(totalQuestions) },
    { label: t('adminOps.statCost'), value: usd.format(totalCost) },
    { label: t('adminOps.statPending'), value: f.number(data.review_queue.pending) },
    { label: t('adminOps.statAvgReview'), value: minutes === null ? '—' : t('adminOps.minutes', { count: f.number(minutes) }) },
    { label: t('adminOps.statSearches'), value: f.number(data.knowledge_searches) },
  ]

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-sand-86 bg-surface px-5 py-4">
            <dt className="text-xs text-ash-573">{s.label}</dt>
            <dd className="serif mt-2 text-2xl tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <CardTitle>{t('adminOps.questionsPerDay')}</CardTitle>
          <div className="mt-3">
            <DailyBars
              title={t('adminOps.questionsPerDay')}
              summary={t('adminOps.questionsSummary', { total: f.number(totalQuestions), days: data.days })}
              dateHeader={t('adminOps.colDate')}
              valueHeader={t('adminOps.statQuestions')}
              points={data.questions_per_day.map((p) => ({ label: day(p.date), value: p.count, display: f.number(p.count) }))}
            />
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle>{t('adminOps.costPerDay')}</CardTitle>
          <div className="mt-3">
            <DailyBars
              title={t('adminOps.costPerDay')}
              summary={t('adminOps.costSummary', { total: usd.format(totalCost), days: data.days })}
              dateHeader={t('adminOps.colDate')}
              valueHeader={t('adminOps.statCost')}
              barClass="fill-sea-539"
              points={data.cost_per_day.map((p) => ({
                label: day(p.date),
                value: p.usd,
                display: `${usd.format(p.usd)} · ${t('admin.tokensCount', { count: f.number(p.tokens) })}`,
              }))}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <CardTitle>{t('adminOps.topTopics')}</CardTitle>
          <div className="mt-4">
            <RankedBars
              empty={t('adminOps.noData')}
              rows={data.top_topics.map((topic) => ({ key: topic.topic, label: f.area(topic.topic), value: topic.count, display: f.number(topic.count) }))}
            />
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle>{t('adminOps.lowConfidenceTopics')}</CardTitle>
          <p className="mt-1 text-xs text-ash-573">{t('adminOps.lowConfidenceHelp')}</p>
          <div className="mt-4">
            <RankedBars
              barClass="bg-honey-580"
              empty={t('adminOps.noData')}
              rows={data.low_confidence_topics.map((topic) => ({
                key: topic.topic,
                label: f.area(topic.topic),
                value: topic.rate,
                display: t('adminOps.lowConfidenceValue', {
                  count: f.number(topic.count),
                  total: f.number(topic.total),
                  percent: Math.round(topic.rate * 100),
                }),
              }))}
            />
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle>{t('adminOps.feedbackTitle')}</CardTitle>
          <div className="mt-4 space-y-3">
            <SplitBar up={up} down={down} label={t('adminOps.feedbackSplit', { up: f.number(up), down: f.number(down) })} />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-ash-573">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-brand" />
                  {t('adminOps.thumbsUp')}
                </dt>
                <dd className="mt-1 text-xl tabular-nums">{f.number(up)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-ash-573">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-rust-600" />
                  {t('adminOps.thumbsDown')}
                </dt>
                <dd className="mt-1 text-xl tabular-nums">{f.number(down)}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>
    </div>
  )
}
