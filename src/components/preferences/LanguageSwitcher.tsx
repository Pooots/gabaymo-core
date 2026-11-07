import { Languages } from 'lucide-react'

import type { Locale } from '@/i18n'
import { LOCALES, useI18n } from '@/i18n'

/**
 * English / Filipino switch. `compact` = small pill for headers; otherwise a
 * labelled radio group for settings pages. The choice is saved and sets <html lang>.
 */
export function LanguageSwitcher({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n()

  if (compact) {
    return (
      <label className={`relative inline-flex items-center ${className}`}>
        <span className="sr-only">{t('common.language')}</span>
        <Languages size={15} aria-hidden className="pointer-events-none absolute left-3 text-muted" />
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          className="h-9 appearance-none rounded-full border border-moss-135 bg-surface pr-3 pl-8 text-sm font-medium text-moss-863 outline-none hover:border-brand/40 focus-visible:ring-2 focus-visible:ring-brand"
        >
          {LOCALES.map((option) => (
            <option key={option.id} value={option.id} lang={option.htmlLang}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <fieldset className={className}>
      <legend className="mb-2 text-xs font-medium text-moss-731">{t('common.language')}</legend>
      <div role="radiogroup" aria-label={t('common.language')} className="inline-flex gap-1 rounded-full bg-sand-53 p-1">
        {LOCALES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            lang={option.htmlLang}
            aria-checked={locale === option.id}
            onClick={() => setLocale(option.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${locale === option.id ? 'bg-surface text-ash-890 shadow-sm' : 'text-ash-573 hover:text-ash-890'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
