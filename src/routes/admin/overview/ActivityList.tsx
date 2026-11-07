import { relativeTime } from './format'
import type { ActivityItem } from '@/services/adminAuth'
import { useI18n } from '@/i18n'
import { token } from '@/lib/theme'

const activityTone: Record<string, string> = {
  admin: token('ash-447'),
  ticket: token('honey-522'),
  member: token('moss-575'),
  ai: token('sea-445'),
  payment: token('brand-strong'),
}

/** Latest audit entries, coloured by area (the part of `action` before the dot). */
export function ActivityList({ items, now }: { items: Array<ActivityItem>; now: number }) {
  const { t, intl } = useI18n()
  if (items.length === 0) {
    return <p className="mt-4 text-sm leading-relaxed text-ash-573">{t('admin.activityEmpty')}</p>
  }

  return (
    <ul className="mt-3 flex flex-1 flex-col justify-center">
      {items.map((item, index) => {
        const tone = activityTone[item.action.split('.')[0] ?? ''] ?? token('brand-strong')
        const at = item.at ? new Date(item.at) : null
        return (
          <li
            key={item.id}
            className="dash-rise group -mx-2 flex gap-2.5 rounded-lg border-b border-sand-71 px-2 py-2 transition-colors last:border-0 hover:bg-ash-40"
            style={{ animationDelay: `${450 + index * 80}ms` }}
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ background: tone }}
            />
            <div className="min-w-0">
              <p className="text-sm leading-snug font-medium">{item.summary}</p>
              <p
                className="mt-0.5 text-[11px] text-ash-447"
                title={at ? new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeStyle: 'short' }).format(at) : undefined}
              >
                {at ? relativeTime(at.getTime(), now, t) : ''}
                <span className="opacity-0 transition-opacity group-hover:opacity-100">
                  {at
                    ? ` · ${new Intl.DateTimeFormat(intl, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(at)}`
                    : ''}
                </span>
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
