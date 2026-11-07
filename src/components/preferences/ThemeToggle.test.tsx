import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { ThemeToggle } from './ThemeToggle'
import {
  THEME_STORAGE_KEY,
  getThemePreference,
  setThemePreference,
} from '@/lib/theme'

function themeColor() {
  return document
    .querySelector('meta[name="theme-color"]')
    ?.getAttribute('content')
}

describe('ThemeToggle', () => {
  afterEach(() => {
    act(() => setThemePreference('system'))
    document.head.innerHTML = ''
  })

  it('header button flips between light and dark and saves the choice', async () => {
    document.head.innerHTML = '<meta name="theme-color" content="#0e6b3e" />'
    render(<ThemeToggle compact />)

    // jsdom reports a light device, so "Match device" resolves to light.
    await userEvent.click(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(themeColor()).toBe('#161d19')

    await userEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(themeColor()).toBe('#0e6b3e')
  })

  it('settings picker offers Match device, which clears the pinned theme', async () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('radio', { name: 'Match device' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    await userEvent.click(screen.getByRole('radio', { name: 'Match device' }))
    expect(document.documentElement).not.toHaveAttribute('data-theme')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('follows a choice made in another tab', () => {
    render(<ThemeToggle compact />)
    act(() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      window.dispatchEvent(
        new StorageEvent('storage', { key: THEME_STORAGE_KEY }),
      )
    })
    expect(getThemePreference()).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeInTheDocument()
  })
})
