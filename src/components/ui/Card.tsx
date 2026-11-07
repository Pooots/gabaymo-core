import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-sand-86 bg-surface ${className}`}>{children}</section>
}

export function CardTitle({ icon: Icon, children, action }: { icon?: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        {Icon ? <Icon size={16} aria-hidden className="text-brand" /> : null}
        {children}
      </h2>
      {action}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-[0.16em] text-ash-447 uppercase">{children}</p>
}
