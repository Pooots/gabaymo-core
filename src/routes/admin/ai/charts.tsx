import { useId } from 'react'

/**
 * Tiny accessible SVG charts (no chart dependency). Each has role="img" with
 * an aria-label summary plus a visually-hidden table of the exact values.
 * Colours are token classes (fill-brand, fill-sand-86 …), never hex.
 */

export type Point = { label: string; value: number; display: string }

export function DailyBars({
  points,
  title,
  summary,
  barClass = 'fill-brand',
  valueHeader,
  dateHeader,
}: {
  points: Array<Point>
  title: string
  summary: string
  barClass?: string
  valueHeader: string
  dateHeader: string
}) {
  const id = useId()
  const width = 600
  const height = 140
  const max = Math.max(1, ...points.map((p) => p.value))
  const gap = points.length > 45 ? 1 : 2
  const barWidth = points.length ? Math.max(1, width / points.length - gap) : 0
  const first = points[0]
  const last = points[points.length - 1]

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height + 18}`}
        role="img"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        className="h-40 w-full"
        preserveAspectRatio="none"
      >
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-desc`}>{summary}</desc>
        <line x1={0} x2={width} y1={height} y2={height} className="stroke-sand-124" strokeWidth={1} />
        {points.map((p, index) => {
          const h = p.value === 0 ? 0 : Math.max(2, (p.value / max) * (height - 8))
          return (
            <rect key={p.label} x={index * (barWidth + gap)} y={height - h} width={barWidth} height={h} rx={1.5} className={barClass}>
              <title>{`${p.label}: ${p.display}`}</title>
            </rect>
          )
        })}
        {first ? (
          <text x={0} y={height + 14} className="fill-ash-573 text-[11px]">
            {first.label}
          </text>
        ) : null}
        {last && last !== first ? (
          <text x={width} y={height + 14} textAnchor="end" className="fill-ash-573 text-[11px]">
            {last.label}
          </text>
        ) : null}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{dateHeader}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{p.display}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** Horizontal bars as a list (label, bar, value): readable without the graphic. */
export function RankedBars({ rows, empty, barClass = 'bg-brand' }: { rows: Array<{ key: string; label: string; value: number; display: string }>; empty: string; barClass?: string }) {
  if (rows.length === 0) return <p className="text-sm text-ash-573">{empty}</p>
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key} className="text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 tabular-nums text-ash-573">{row.display}</span>
          </div>
          <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-86">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(3, (row.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Up/down split bar with both numbers in text. */
export function SplitBar({ up, down, label }: { up: number; down: number; label: string }) {
  const total = up + down
  const upShare = total ? (up / total) * 100 : 0
  return (
    <div role="img" aria-label={label} className="flex h-3 overflow-hidden rounded-full bg-sand-86">
      {total ? (
        <>
          <div className="h-full bg-brand" style={{ width: `${upShare}%` }} />
          <div className="h-full bg-rust-600" style={{ width: `${100 - upShare}%` }} />
        </>
      ) : null}
    </div>
  )
}
