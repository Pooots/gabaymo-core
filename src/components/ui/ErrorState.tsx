import { RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'

import { useI18n } from '@/i18n'
import { apiErrorMessage, isNetworkError } from '@/lib/errors'

/**
 * Shown when a load fails (instead of silently showing an empty list).
 * Pass the caught `error` to show the API's message, and `onRetry` to offer a
 * retry button. `compact` renders an inline row for cards and table bodies.
 */
export function ErrorState({
  title,
  message,
  error,
  onRetry,
  retrying = false,
  compact = false,
  className = '',
}: {
  title?: string
  message?: string
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
  compact?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const offline = isNetworkError(error) || (typeof navigator !== 'undefined' && !navigator.onLine)
  const heading = title ?? (offline ? t('common.offlineTitle') : t('common.errorTitle'))
  const body = message ?? (error === undefined ? t('common.errorBody') : apiErrorMessage(error, offline ? t('common.offlineBody') : t('common.errorBody')))
  const Icon = offline ? WifiOff : TriangleAlert

  const retry = onRetry ? (
    <button
      type="button"
      onClick={onRetry}
      disabled={retrying}
      className="inline-flex h-9 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-ash-890 ring-1 ring-sand-124 transition hover:bg-ash-44 disabled:opacity-60"
    >
      <RefreshCw size={14} aria-hidden className={retrying ? 'animate-spin' : ''} />
      {t('common.retry')}
    </button>
  ) : null

  if (compact) {
    return (
      <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rust-29 px-4 py-3 text-sm text-rust-600 ${className}`}>
        <span className="flex items-start gap-2">
          <Icon size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">{heading}.</strong> {body}
          </span>
        </span>
        {retry}
      </div>
    )
  }

  return (
    <div role="alert" className={`flex flex-col items-center px-6 py-16 text-center ${className}`}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rust-29 text-rust-600">
        <Icon size={22} aria-hidden />
      </span>
      <h2 className="mt-5 text-base font-semibold">{heading}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ash-573">{body}</p>
      {retry ? <div className="mt-6">{retry}</div> : null}
    </div>
  )
}
