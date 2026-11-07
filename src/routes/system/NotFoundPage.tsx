import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'

import { useI18n } from '@/i18n'

/** 404 for any unknown URL (router-wide notFoundComponent). */
export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 py-16 text-ink">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-moss-53 text-brand">
          <Compass size={22} aria-hidden />
        </span>
        <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">404</p>
        <h1 className="serif mt-2 text-3xl font-medium tracking-[-0.03em]">{t('common.notFoundTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t('common.notFoundBody')}</p>
        <Link to="/" className="btn-primary mt-6">
          {t('common.goHome')}
        </Link>
      </div>
    </main>
  )
}
