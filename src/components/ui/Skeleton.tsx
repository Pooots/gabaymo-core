import { useI18n } from '@/i18n'

/** A shimmering placeholder block. Size it with className (h-*, w-*). */
export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <span aria-hidden className={`skeleton block rounded-lg ${className}`} />
}

/** Placeholder list while data loads; announced to screen readers once. */
export function LoadingState({ rows = 3, label, className = '' }: { rows?: number; label?: string; className?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" className={`space-y-3 ${className}`}>
      <span className="sr-only">{label ?? t('common.loading')}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl border border-sand-86 bg-surface p-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Table-body placeholder rows (use inside <tbody>). */
export function SkeletonRows({ rows = 5, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} aria-hidden>
          {Array.from({ length: columns }, (__, c) => (
            <td key={c} className="px-5 py-4">
              <Skeleton className="h-3.5 w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
