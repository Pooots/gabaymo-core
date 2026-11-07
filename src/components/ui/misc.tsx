import type { ReactNode } from 'react'

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)} aria-label={label} className="h-1.5 w-full overflow-hidden rounded-full bg-sand-86">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.max(4, clamped)}%` }} />
      </div>
      {label ? <p className="mt-1 text-[11px] text-ash-447">{label}</p> : null}
    </div>
  )
}

/** Inline error line (renders nothing when empty). */
export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
      {children}
    </p>
  )
}

/** Highlights plain substrings (document numbers, dates, region labels, search matches). */
export function Highlighted({ text, terms }: { text: string; terms: Array<{ value: string; className: string }> }) {
  const usable = terms.filter((t) => t.value.trim().length >= 2)
  if (usable.length === 0) return <>{text}</>
  const escaped = usable.map((t) => t.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length)
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'))
  return (
    <>
      {parts.map((part, index) => {
        const match = usable.find((t) => t.value.toLowerCase() === part.toLowerCase())
        return match ? (
          <mark key={index} className={`rounded px-0.5 ${match.className}`}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </>
  )
}
