import { ChevronDown } from 'lucide-react'
import { inputClass } from './styles'
import type { ComponentProps, ReactNode } from 'react'


export function Field({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1.5 block text-xs font-medium text-moss-731">{label}</span>
      {children}
    </label>
  )
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <span className="relative block">
      <select {...props} className={`${inputClass} appearance-none pr-10 ${className ?? ''}`} />
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ash-573" />
    </span>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? 'bg-brand' : 'bg-sand-169'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-surface shadow transition ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  )
}
