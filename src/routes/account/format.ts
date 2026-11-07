/** Member-screen dates in the current UI locale (pass `intl` from useI18n()). */
export function formatWhen(value: string | null | undefined, intl: string, withTime = false) {
  if (!value) return '—'
  return new Date(value).toLocaleString(
    intl,
    withTime
      ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

/** "Nov 7, 2026, 3:04 PM" style (ticket chat). */
export function formatStamp(value: string | null, intl: string) {
  if (!value) return ''
  return new Date(value).toLocaleString(intl, { dateStyle: 'medium', timeStyle: 'short' })
}
