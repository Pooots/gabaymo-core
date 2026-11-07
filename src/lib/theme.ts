import { useSyncExternalStore } from 'react'

import { safeStorage } from '@/lib/storage'

/** 'system' follows prefers-color-scheme; the others pin the theme. */
export type ThemePreference = 'system' | 'light' | 'dark'
/** The theme actually on screen. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'gabaymo_theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
/** Browser chrome colour (address bar on phones) per theme. */
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#0e6b3e', dark: '#161d19' }

const listeners = new Set<() => void>()

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readStored(): ThemePreference {
  const stored = safeStorage.get(THEME_STORAGE_KEY)
  return isPreference(stored) ? stored : 'system'
}

let preference: ThemePreference = readStored()

function darkMedia(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
}

export function resolveTheme(next: ThemePreference = preference): ResolvedTheme {
  if (next !== 'system') return next
  return darkMedia()?.matches ? 'dark' : 'light'
}

/** Writes the preference onto <html data-theme>; tokens.css does the rest. */
export function applyTheme(next: ThemePreference = preference) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (next === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', next)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolveTheme(next)])
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function getThemePreference(): ThemePreference {
  return preference
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  if (next === 'system') safeStorage.remove(THEME_STORAGE_KEY)
  else safeStorage.set(THEME_STORAGE_KEY, next)
  applyTheme(next)
  notify()
}

let watching = false

/** Follow OS theme changes and choices made in other tabs. Runs once. */
function watch() {
  if (watching || typeof window === 'undefined') return
  watching = true
  darkMedia()?.addEventListener('change', () => {
    if (preference !== 'system') return
    applyTheme('system')
    notify()
  })
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return
    preference = readStored()
    applyTheme(preference)
    notify()
  })
}

function subscribe(listener: () => void) {
  watch()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useThemePreference() {
  const value = useSyncExternalStore(subscribe, getThemePreference, getThemePreference)
  return [value, setThemePreference] as const
}

/** The theme on screen right now ('system' resolved against the device setting). */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, () => resolveTheme(), () => 'light')
}

/**
 * A design token as a CSS value, for inline styles / SVG (where Tailwind
 * classes don't reach). `role` picks the dark-mode variant: text (fg),
 * fills (bg, default) or strokes/borders (line).
 */
export function token(name: string, role: 'fg' | 'bg' | 'line' = 'bg') {
  return `var(--c-${name}-${role}, var(--c-${name}))`
}
