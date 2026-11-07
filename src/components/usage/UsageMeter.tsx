import type { TokenUsage, UsageStatus } from '@/services/usage'
import { useI18n } from '@/i18n'
import { formatPercent } from '@/services/usage'

type Translate = ReturnType<typeof useI18n>['t']

/** Plain-language line under the meter, in the current language. */
function summary(usage: TokenUsage, t: Translate, intl: string) {
  const reset = usage.resets_at ? new Date(usage.resets_at).toLocaleDateString(intl, { month: 'long', day: 'numeric' }) : null
  if (usage.status === 'exhausted') {
    if (usage.percent_used < 100) return t('usage.heldAll')
    return reset ? t('usage.monthUsedUp', { date: reset }) : t('usage.trialUsedUp')
  }
  const left = t('usage.left', { percent: formatPercent(usage.percent_remaining) })
  return reset ? t('usage.leftRefreshes', { left, date: reset }) : left
}

const TONE: Record<UsageStatus, { bar: string; text: string; soft: string }> = {
  ok: { bar: 'bg-brand', text: 'text-brand', soft: 'bg-brand/25' },
  warning: {
    bar: 'bg-honey-571',
    text: 'text-honey-682',
    soft: 'bg-honey-571/25',
  },
  critical: {
    bar: 'bg-rust-596',
    text: 'text-rust-631',
    soft: 'bg-rust-596/25',
  },
  exhausted: {
    bar: 'bg-rust-601',
    text: 'text-rust-601',
    soft: 'bg-rust-601/25',
  },
}

/** Horizontal meter: used (solid) + held by in-flight questions (soft). */
export function UsageBar({
  usage,
  className = 'h-2',
}: {
  usage: TokenUsage
  className?: string
}) {
  const { t } = useI18n()
  const tone = TONE[usage.status]
  const used = Math.min(100, usage.percent_used)
  const held = Math.min(100 - used, usage.percent_in_progress)

  return (
    <div
      className={`flex w-full overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-label={t('usage.barLabel')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(used)}
      aria-valuetext={t('usage.used', { percent: formatPercent(used) })}
    >
      <div
        className={`${tone.bar} transition-[width] duration-500`}
        style={{ width: `${used}%` }}
      />
      {held > 0 ? (
        <div
          className={`${tone.soft} transition-[width] duration-500`}
          style={{ width: `${held}%` }}
        />
      ) : null}
    </div>
  )
}

/** Compact header pill: "34% used". */
export function UsagePill({
  usage,
  onClick,
}: {
  usage: TokenUsage | null
  onClick?: () => void
}) {
  const { t } = useI18n()
  const tone = TONE[usage?.status ?? 'ok']
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border border-surface/80 bg-surface/80 px-3 py-1.5 text-[13px] font-medium shadow-sm backdrop-blur ${tone.text}`}
    >
      {usage ? (
        <>
          <span className="block w-14">
            <UsageBar usage={usage} className="h-1.5" />
          </span>
          <span className="whitespace-nowrap">
            {usage.status === 'exhausted' && usage.percent_used >= 100
              ? t('usage.limitReached')
              : t('usage.used', { percent: formatPercent(usage.percent_used) })}
          </span>
        </>
      ) : (
        t('usage.pill')
      )}
    </button>
  )
}

/** Full meter with the plain-language summary and extra usage. */
export function UsageMeter({
  usage,
  label,
}: {
  usage: TokenUsage
  label?: string
}) {
  const { t, intl } = useI18n()
  const tone = TONE[usage.status]
  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-moss-833">{label ?? t('usage.thisPeriod')}</p>
        <p className={`serif text-3xl tracking-[-0.03em] ${tone.text}`}>
          {formatPercent(usage.percent_used)}
        </p>
      </div>
      <UsageBar usage={usage} className="mt-3 h-2.5" />
      <p className="mt-3 text-sm text-muted">{summary(usage, t, intl)}</p>
      {usage.percent_in_progress > 0 ? (
        <p className="mt-1 text-xs text-muted">
          {t('usage.held', { percent: formatPercent(usage.percent_in_progress) })}
        </p>
      ) : null}
      {usage.extra_percent > 0 ? (
        <p className="mt-3 rounded-2xl bg-ash-41 px-3 py-2 text-xs text-moss-833">
          {t('usage.extraLabel')} <strong>{formatPercent(usage.extra_percent)}</strong>{' '}
          {t('usage.extraBody')}
        </p>
      ) : null}
    </div>
  )
}
