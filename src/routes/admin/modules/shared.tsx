import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

import type { StatusTone } from '@/components/ui'
import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

/** Shared bits for the admin operations modules. */

const AREA_LABELS: Record<string, MessageKey> = {
  leave: 'adminOps.areaLeave',
  discipline: 'adminOps.areaDiscipline',
  appointment_promotion: 'adminOps.areaAppointmentPromotion',
  salary_benefits: 'adminOps.areaSalaryBenefits',
  child_protection: 'adminOps.areaChildProtection',
  school_operations: 'adminOps.areaSchoolOperations',
  ethics: 'adminOps.areaEthics',
  other: 'adminOps.areaOther',
}

/** Formatters bound to the current locale. */
export function useAdminFormat() {
  const { t, intl } = useI18n()
  const date = new Intl.DateTimeFormat(intl, { month: 'short', day: 'numeric', year: 'numeric' })
  const dateTime = new Intl.DateTimeFormat(intl, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const peso = new Intl.NumberFormat(intl, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })
  return {
    date: (value: string | null | undefined) => (value ? date.format(new Date(value)) : '—'),
    dateTime: (value: string | null | undefined) => (value ? dateTime.format(new Date(value)) : '—'),
    /** Whole pesos (ws stores plan prices and payment amounts in pesos). */
    peso: (value: number | null | undefined) => peso.format(value ?? 0),
    number: (value: number | null | undefined) => (value ?? 0).toLocaleString(intl),
    area: (key: string | null | undefined) => {
      if (!key) return t('adminOps.areaNone')
      const label = AREA_LABELS[key]
      return label ? t(label) : key.replace(/_/g, ' ')
    },
  }
}

export function codeTone(status: string): StatusTone {
  return status === 'active' ? 'green' : status === 'revoked' ? 'red' : 'gray'
}

/** Search input that reports its value after a short pause (server-side search). */
export function SearchBox({ label, placeholder, onSearch }: { label: string; placeholder: string; onSearch: (value: string) => void }) {
  const [value, setValue] = useState('')
  const latest = useRef(onSearch)
  useEffect(() => {
    latest.current = onSearch
  })
  useEffect(() => {
    const id = window.setTimeout(() => latest.current(value.trim()), 300)
    return () => window.clearTimeout(id)
  }, [value])
  return (
    <label className="flex h-11 w-full max-w-sm items-center gap-2 rounded-full border border-sand-86 bg-surface px-4 text-sm">
      <Search size={16} className="text-ash-459" aria-hidden />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ash-459"
      />
    </label>
  )
}

/** `YYYY-MM-DD` from a date input → ISO end of that day, or null. */
export function endOfDayIso(value: string) {
  return value ? new Date(`${value}T23:59:59`).toISOString() : null
}
