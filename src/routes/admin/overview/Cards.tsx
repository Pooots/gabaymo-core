import { useCountUp } from './hooks'
import type { ReactNode } from 'react'

import { useI18n } from '@/i18n'

/** Dashboard panel with a staggered rise-in. `flush` hides the visible title (the child draws its own). */
export function Panel({
  index,
  title,
  subtitle,
  className = '',
  flush = false,
  children,
}: {
  index: number
  title: string
  subtitle?: string
  className?: string
  flush?: boolean
  children: ReactNode
}) {
  return (
    <article
      className={`dash-rise flex flex-col rounded-2xl border border-sand-86 bg-surface p-4 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgba(14,92,60,0.18)] xl:min-h-0 ${className}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {!flush && (
        <>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ash-573">{subtitle}</p>}
        </>
      )}
      {flush && <span className="sr-only">{title}</span>}
      {children}
    </article>
  )
}

export type StatCardProps = {
  label: string
  value: number
  note: string
  format?: (value: number) => string
  positive?: boolean
}

export function StatCard({
  label,
  value,
  note,
  format,
  positive,
  index,
  loading,
}: StatCardProps & { index: number; loading: boolean }) {
  const { intl } = useI18n()
  const shown = useCountUp(value)
  const formatted = format ? format(shown) : Math.round(shown).toLocaleString(intl)

  return (
    <article
      className="dash-rise group cursor-default rounded-2xl border border-sand-86 bg-surface px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-moss-145 hover:shadow-[0_10px_30px_-14px_rgba(14,92,60,0.25)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="text-xs text-ash-573 transition-colors group-hover:text-brand-strong">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-[1.7rem] w-16 animate-pulse rounded-md bg-sand-71" />
      ) : (
        <p className="peso mt-1.5 text-[1.7rem] leading-none tracking-[-0.03em] tabular-nums">{formatted}</p>
      )}
      <p className={`mt-1.5 text-[11px] ${positive ? 'text-moss-637' : 'text-ash-447'}`}>{note}</p>
    </article>
  )
}

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const shown = useCountUp(value)
  return <p className={`${className ?? ''} tabular-nums`}>{Math.round(shown)}</p>
}
