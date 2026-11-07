import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { PageMeta } from '@/lib/pagination'
import { useI18n } from '@/i18n'

/**
 * Pager for `{data, meta}` lists: "21–40 of 132" plus previous / next and a
 * few page numbers. Renders nothing for an empty list or a single page.
 */
export function Pagination({
  meta,
  onPage,
  disabled = false,
  className = '',
}: {
  meta: PageMeta | undefined
  onPage: (page: number) => void
  disabled?: boolean
  className?: string
}) {
  const { t, intl } = useI18n()
  if (!meta || meta.total === 0) return null
  const current = Math.min(Math.max(1, meta.current_page), Math.max(1, meta.last_page))
  const last = Math.max(1, meta.last_page)
  const from = (current - 1) * meta.per_page + 1
  const to = Math.min(meta.total, current * meta.per_page)
  const number = (value: number) => value.toLocaleString(intl)
  const summary = t('common.pageRange', { from: number(from), to: number(to), total: number(meta.total) })

  if (last <= 1) {
    return <p className={`mt-3 text-xs text-ash-573 ${className}`}>{summary}</p>
  }

  const pages = pageWindow(current, last)
  const button =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav aria-label={t('common.pagination')} className={`mt-3 flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="text-xs text-ash-573" aria-live="polite">
        {summary}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            className={`${button} text-ash-890 hover:bg-ash-41`}
            disabled={disabled || current <= 1}
            onClick={() => onPage(current - 1)}
            aria-label={t('common.previousPage')}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
        </li>
        {pages.map((page, index) =>
          page === null ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-sm text-ash-459">
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                className={`${button} ${page === current ? 'bg-ash-910 font-medium text-white' : 'text-ash-890 hover:bg-ash-41'}`}
                aria-current={page === current ? 'page' : undefined}
                aria-label={t('common.goToPage', { page })}
                disabled={disabled}
                onClick={() => page !== current && onPage(page)}
              >
                {number(page)}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={`${button} text-ash-890 hover:bg-ash-41`}
            disabled={disabled || current >= last}
            onClick={() => onPage(current + 1)}
            aria-label={t('common.nextPage')}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </li>
      </ul>
    </nav>
  )
}

/** 1 … 4 5 [6] 7 8 … 20 (null = gap). */
export function pageWindow(current: number, last: number): Array<number | null> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)
  const out: Array<number | null> = [1]
  if (start > 2) out.push(null)
  for (let page = start; page <= end; page++) out.push(page)
  if (end < last - 1) out.push(null)
  out.push(last)
  return out
}
