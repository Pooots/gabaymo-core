import { useSyncExternalStore } from 'react'

import { safeStorage } from '@/lib/storage'

/** 'system' follows prefers-color-scheme; the others pin the theme. */
export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'gabaymo_theme'
const listeners = new Set<() => void>()

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

let preference: ThemePreference = (() => {
  const stored = safeStorage.get(STORAGE_KEY)
  return isPreference(stored) ? stored : 'system'
})()

/** Writes the preference onto <html data-theme>; tokens.css does the rest. */
export function applyTheme(next: ThemePreference = preference) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (next === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', next)
}

export function getThemePreference(): ThemePreference {
  return preference
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  if (next === 'system') safeStorage.remove(STORAGE_KEY)
  else safeStorage.set(STORAGE_KEY, next)
  applyTheme(next)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useThemePreference() {
  const value = useSyncExternalStore(
    subscribe,
    getThemePreference,
    getThemePreference,
  )
  return [value, setThemePreference] as const
}

/**
 * A design token as a CSS value, for inline styles / SVG (where Tailwind
 * classes don't reach). `role` picks the dark-mode variant: text (fg),
 * fills (bg, default) or strokes/borders (line).
 */
export function token(name: string, role: 'fg' | 'bg' | 'line' = 'bg') {
  return `var(--c-${name}-${role}, var(--c-${name}))`
}
