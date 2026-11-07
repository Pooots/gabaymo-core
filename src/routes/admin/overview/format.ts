import type { MessageKey, Vars } from '@/i18n'
import { token } from '@/lib/theme'

type Translate = (key: MessageKey, vars?: Vars) => string

/** Bar/legend colours for plans, in display order. */
export const planTones = ['moss-243', 'moss-575', 'brand-strong', 'moss-704', 'moss-373'].map((name) => token(name))

export function peso(amount: number, intl: string) {
  return `₱${Math.round(amount).toLocaleString(intl)}`
}

/** "just now", "5m ago", "3h ago", "yesterday", "4d ago". */
export function relativeTime(at: number, now: number, t: Translate) {
  const seconds = Math.max(0, Math.round((now - at) / 1000))
  if (seconds < 45) return t('admin.timeJustNow')
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return t('admin.timeMinutesAgo', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('admin.timeHoursAgo', { count: hours })
  const days = Math.round(hours / 24)
  return days === 1 ? t('admin.timeYesterday') : t('admin.timeDaysAgo', { count: days })
}
