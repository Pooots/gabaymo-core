import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { useI18n } from '@/i18n'

/**
 * Root error boundary: a render error or a failed lazy chunk (e.g. after a
 * deploy) shows this instead of a blank screen.
 */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const { t } = useI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main role="alert" className="grid min-h-dvh place-items-center bg-paper px-4 py-16 text-ink">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rust-29 text-rust-600">
          <TriangleAlert size={22} aria-hidden />
        </span>
        <h1 className="serif mt-5 text-3xl font-medium tracking-[-0.03em]">{t('common.crashTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t('common.crashBody')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              reset()
              window.location.reload()
            }}
          >
            {t('common.reload')}
          </button>
          <Link to="/" className="btn-ghost">
            {t('common.goHome')}
          </Link>
        </div>
      </div>
    </main>
  )
}

/** Shown while a lazily loaded area (admin, partner) downloads. */
export function RoutePending() {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" className="grid min-h-dvh place-items-center bg-paper">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
