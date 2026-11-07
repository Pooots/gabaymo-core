import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { en } from './locales/en'
import { fil } from './locales/fil'
import { getLocale, setLocale, t, translate, useI18n } from '.'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'

function Greeting() {
  const { t: tr } = useI18n()
  return <p>{tr('common.retry')}</p>
}

describe('i18n', () => {
  afterEach(() => {
    act(() => setLocale('en'))
  })

  it('has a Filipino string for every English key', () => {
    for (const [ns, table] of Object.entries(en)) {
      const filTable = fil[ns as keyof typeof fil] as Record<string, string>
      for (const key of Object.keys(table)) {
        expect(filTable[key], `${ns}.${key}`).toBeTruthy()
      }
    }
  })

  it('switches language, persists it and sets <html lang>', () => {
    act(() => setLocale('fil'))
    expect(getLocale()).toBe('fil')
    expect(t('common.retry')).toBe('Subukan muli')
    expect(document.documentElement.lang).toBe('fil')
    expect(window.localStorage.getItem('gabaymo_locale')).toBe('fil')

    act(() => setLocale('en'))
    expect(t('common.retry')).toBe('Try again')
    expect(document.documentElement.lang).toBe('en')
  })

  it('re-renders components when the language changes', async () => {
    render(
      <>
        <Greeting />
        <LanguageSwitcher />
      </>,
    )
    expect(screen.getByText('Try again')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Filipino' }))
    expect(screen.getByText('Subukan muli')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Filipino' })).toHaveAttribute('aria-checked', 'true')
  })

  it('interpolates placeholders and falls back to the key', () => {
    expect(translate('en', 'common.appName')).toBe('GabayMo')
    // Unknown keys (e.g. from stale data) degrade to the key itself.
    expect(translate('fil', 'missing.key' as never)).toBe('missing.key')
  })
})
