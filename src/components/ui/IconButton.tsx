import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /** Required: icon-only buttons need an accessible name. */
  label: string
  children: ReactNode
}

/** Icon-only button with a required accessible label (also used as tooltip). */
export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, children, className = 'grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ash-41', title, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} aria-label={label} title={title ?? label} className={className} {...props}>
      {children}
    </button>
  )
})
