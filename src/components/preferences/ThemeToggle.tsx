import { Monitor, Moon, Sun } from 'lucide-react'

import type { ThemePreference } from '@/lib/theme'
import { useI18n } from '@/i18n'
import {
  setThemePreference,
  useResolvedTheme,
  useThemePreference,
} from '@/lib/theme'

const OPTIONS: Array<{
  id: ThemePreference
  icon: typeof Sun
  key: 'common.themeSystem' | 'common.themeLight' | 'common.themeDark'
}> = [
  { id: 'system', icon: Monitor, key: 'common.themeSystem' },
  { id: 'light', icon: Sun, key: 'common.themeLight' },
  { id: 'dark', icon: Moon, key: 'common.themeDark' },
]

/**
 * Light / dark / match-device. Saved in localStorage (when available).
 * `compact` = one round button for headers that flips between light and dark;
 * otherwise a labelled radio group for settings pages (which also offers "Match device").
 */
export function ThemeToggle({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const [theme, setTheme] = useThemePreference()
  const resolved = useResolvedTheme()

  if (compact) {
    const next = resolved === 'dark' ? 'light' : 'dark'
    const label =
      next === 'dark' ? t('common.switchToDark') : t('common.switchToLight')
    const Icon = resolved === 'dark' ? Sun : Moon
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setThemePreference(next)}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-moss-135 bg-surface text-moss-863 outline-none hover:border-brand/40 focus-visible:ring-2 focus-visible:ring-brand ${className}`}
      >
        <Icon size={16} aria-hidden />
      </button>
    )
  }

  return (
    <fieldset className={className}>
      <legend className="mb-2 text-xs font-medium text-moss-731">
        {t('common.theme')}
      </legend>
      <div
        role="radiogroup"
        aria-label={t('common.theme')}
        className="inline-flex flex-wrap gap-1 rounded-full bg-sand-53 p-1"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={theme === option.id}
            onClick={() => setTheme(option.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${theme === option.id ? 'bg-surface text-ash-890 shadow-sm' : 'text-ash-573 hover:text-ash-890'}`}
          >
            <option.icon size={14} aria-hidden />
            {t(option.key)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
