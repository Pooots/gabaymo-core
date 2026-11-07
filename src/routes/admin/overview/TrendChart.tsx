import { useState } from 'react'

import { niceMax, smoothPath } from './chartMath'
import { useElementSize } from './hooks'
import type { OverviewStats, SignupPoint } from '@/services/adminAuth'
import { useI18n } from '@/i18n'
import { token } from '@/lib/theme'
import { formatTokens } from '@/services/usage'

type Metric = 'value' | 'questions' | 'tokens'

const METRICS: [Metric, ...Array<Metric>] = ['value', 'questions', 'tokens']

/** 14-day line chart of sign-ups, AI questions or tokens, with a hover tooltip. */
export function TrendChart({ points, stats }: { points: Array<SignupPoint>; stats: OverviewStats }) {
  const { t, tn, intl } = useI18n()
  const [metric, setMetric] = useState<Metric>('value')
  const [hover, setHover] = useState<number | null>(null)
  const [ref, size] = useElementSize<HTMLDivElement>()
  const hasUsage = points.some((p) => p.questions !== undefined)
  const available = hasUsage ? METRICS : METRICS.slice(0, 1)

  const labels: Record<Metric, string> = {
    value: t('admin.trendNewMembers'),
    questions: t('admin.trendQuestions'),
    tokens: t('admin.trendTokens'),
  }
  const unit = (n: number) =>
    metric === 'value'
      ? tn('admin.trendNewMemberUnit', n)
      : metric === 'questions'
        ? tn('admin.trendQuestionUnit', n)
        : t('admin.tokensCount', { count: n.toLocaleString(intl) })

  const totals: Record<Metric, number> = {
    value: points.reduce((sum, p) => sum + p.value, 0),
    questions: stats.questions_14d ?? 0,
    tokens: stats.tokens_used_14d ?? 0,
  }

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-semibold">{labels[metric]}</h2>
        <p className="mt-0.5 text-xs text-ash-573">
          {t('admin.trendLast14')} ·{' '}
          <span className="peso font-medium text-ink">
            {metric === 'tokens' ? formatTokens(totals.tokens) : totals[metric].toLocaleString(intl)}
          </span>{' '}
          {t('admin.trendTotal')}
        </p>
      </div>
      {available.length > 1 && (
        <div className="flex rounded-full bg-ash-40 p-0.5 text-[11px]" role="group" aria-label={t('admin.trendMetric')}>
          {available.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
              className={`rounded-full px-2.5 py-1 transition-all duration-200 ${metric === key ? 'bg-surface font-medium text-brand-strong shadow-sm' : 'text-ash-573 hover:text-ink'}`}
            >
              {labels[key]}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  if (points.length === 0) {
    return (
      <>
        {header}
        <p className="mt-6 text-sm text-ash-573">{t('admin.trendNoHistory')}</p>
      </>
    )
  }

  const { width, height } = size
  const padLeft = 28
  const padRight = 12
  const padTop = 14
  const padBottom = 22
  const values = points.map((p) => (metric === 'value' ? p.value : (p[metric] ?? 0)))
  const max = niceMax(Math.max(...values))
  const innerW = Math.max(1, width - padLeft - padRight)
  const innerH = Math.max(1, height - padTop - padBottom)
  const step = innerW / Math.max(1, points.length - 1)
  const coords = points.map((point, index) => {
    const value = values[index] ?? 0
    return { point, value, x: padLeft + index * step, y: padTop + innerH - (value / max) * innerH }
  })
  const line = smoothPath(coords)
  const baseY = padTop + innerH
  const firstCoord = coords[0]
  const lastCoord = coords[coords.length - 1]
  const area = firstCoord && lastCoord ? `${line} L ${lastCoord.x} ${baseY} L ${firstCoord.x} ${baseY} Z` : ''
  const active = hover !== null ? (coords[hover] ?? null) : null
  const labelEvery = width < 420 ? 4 : width < 640 ? 3 : 2

  return (
    <>
      {header}
      <div ref={ref} className="relative mt-2 h-40 w-full xl:h-auto xl:min-h-0 xl:flex-1" onMouseLeave={() => setHover(null)}>
        {width > 0 && height > 0 && (
          <svg width={width} height={height} className="absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: token('brand') }} stopOpacity="0.22" />
                <stop offset="100%" style={{ stopColor: token('brand') }} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((row) => {
              const y = padTop + row * innerH
              return (
                <g key={row}>
                  <line x1={padLeft} x2={width - padRight} y1={y} y2={y} style={{ stroke: token('sand-86', 'line') }} />
                  <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="10" style={{ fill: token('ash-361', 'fg') }}>
                    {metric === 'tokens' ? formatTokens(max * (1 - row)) : Math.round(max * (1 - row))}
                  </text>
                </g>
              )
            })}
            <g key={metric}>
              <path d={area} fill="url(#trend-fill)" className="dash-fade" />
              <path
                d={line}
                fill="none"
                style={{ stroke: token('brand-strong', 'line') }}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                className="dash-line"
              />
              {coords.map((c, index) => (
                <circle
                  key={c.point.label}
                  cx={c.x}
                  cy={c.y}
                  r={hover === index ? 5 : c.value > 0 ? 3 : 2}
                  style={{
                    fill: hover === index ? token('surface') : token('brand-strong', 'line'),
                    stroke: token('brand-strong', 'line'),
                  }}
                  strokeWidth={hover === index ? 2.5 : 0}
                  className="dash-fade transition-all duration-150"
                />
              ))}
            </g>
            {active && (
              <line
                x1={active.x}
                x2={active.x}
                y1={padTop}
                y2={baseY}
                style={{ stroke: token('brand-strong', 'line') }}
                strokeOpacity="0.25"
                strokeDasharray="3 3"
              />
            )}
            {coords.map((c, index) =>
              index % labelEvery === 0 || index === coords.length - 1 ? (
                <text
                  key={`${c.point.label}-label`}
                  x={c.x}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize="11"
                  style={{ fill: hover === index ? token('brand-strong', 'fg') : token('ash-447', 'fg') }}
                  fontWeight={hover === index ? 600 : 400}
                >
                  {c.point.label}
                </text>
              ) : null,
            )}
            {coords.map((c, index) => (
              <rect
                key={`${c.point.label}-hit`}
                x={c.x - step / 2}
                y={0}
                width={step}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
              />
            ))}
          </svg>
        )}
        {active && (
          <div
            className="pointer-events-none absolute z-10 w-max -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-[11px] text-white shadow-lg transition-[left,top] duration-150 ease-out"
            style={{ left: Math.min(Math.max(active.x, 70), width - 70), top: active.y - 10 }}
          >
            <p className="font-semibold">{active.point.label}</p>
            <p className="text-white/80">{unit(active.value)}</p>
          </div>
        )}
      </div>
    </>
  )
}
