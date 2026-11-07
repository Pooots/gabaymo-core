import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Friendly "nothing here" block with an optional call to action. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  children,
  action,
  className = 'py-20',
}: {
  icon?: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center px-6 text-center ${className}`}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-moss-53 text-brand">
        <Icon size={22} aria-hidden />
      </span>
      <h2 className="mt-5 text-base font-semibold">{title}</h2>
      {children ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-ash-573">{children}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
