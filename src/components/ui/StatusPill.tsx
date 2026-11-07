import type { ReactNode } from 'react'

const statusTones = {
  green: 'bg-moss-53 text-brand-strong ring-moss-128',
  amber: 'bg-honey-47 text-honey-694 ring-honey-169',
  red: 'bg-rust-33 text-rust-620 ring-rust-124',
  gray: 'bg-ash-44 text-ash-639 ring-sand-124',
} as const

export type StatusTone = keyof typeof statusTones

export function StatusPill({ tone, children, dot = false }: { tone: StatusTone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${statusTones[tone]}`}>
      {dot ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
