import type { ReactNode } from 'react'

import { useI18n } from '@/i18n'

/** Page frame for one settings screen. */
export function Frame({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="relative mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">{t('settings.eyebrow')}</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

export function Detail({ label, value }: { label: string; value?: string | null }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <dt className="shrink-0 text-sm text-moss-555">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium">{value || t('settings.notSet')}</dd>
    </div>
  )
}
