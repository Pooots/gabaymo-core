import { useCallback, useSyncExternalStore } from 'react'

import { en } from './locales/en'
import { fil } from './locales/fil'
import type { Messages } from './locales/en'
import { safeStorage } from '@/lib/storage'

/**
 * Tiny typed i18n. English (`en`) is the source of truth: every key used with
 * t() must exist there, and the Filipino dictionary is type-checked to have
 * exactly the same keys (a missing translation is a compile error).
 *
 *   const { t } = useI18n()
 *   t('common.retry')                       // "Try again" / "Subukan muli"
 *   t('account.greeting', { name: 'Ana' })  // "{name}" placeholders
 *   tn('usage.questions', 3)                // picks `_one` / `_other`
 *
 * Outside React use the plain `t()` export (current locale, no re-render).
 */

export type Locale = 'en' | 'fil'

export const LOCALES: ReadonlyArray<{ id: Locale; label: string; htmlLang: string; intl: string }> = [
  { id: 'en', label: 'English', htmlLang: 'en', intl: 'en-PH' },
  { id: 'fil', label: 'Filipino', htmlLang: 'fil', intl: 'fil-PH' },
]

type Namespace = keyof Messages
type KeysOf<TNamespace extends Namespace> = Extract<keyof Messages[TNamespace], string>

/** Every translation key, e.g. 'common.retry'. */
export type MessageKey = { [N in Namespace]: `${N}.${KeysOf<N>}` }[Namespace]

/** Base keys that have `_one` / `_other` forms, for tn(). */
export type PluralKey = MessageKey extends infer K
  ? K extends `${infer Base}_other`
    ? Base
    : never
  : never

export type Vars = Record<string, string | number>

const dictionaries: Record<Locale, Messages> = { en, fil }

const STORAGE_KEY = 'gabaymo_locale'
const listeners = new Set<() => void>()

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'fil'
}

/** Saved choice, else the browser language (Filipino/Tagalog → fil), else English. */
export function detectLocale(): Locale {
  const stored = safeStorage.get(STORAGE_KEY)
  if (isLocale(stored)) return stored
  const languages = typeof navigator === 'undefined' ? [] : navigator.languages
  return languages.some((lang) => /^(fil|tl)\b/i.test(lang)) ? 'fil' : 'en'
}

let current: Locale = detectLocale()

function syncHtmlLang(locale: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = LOCALES.find((l) => l.id === locale)?.htmlLang ?? 'en'
}

syncHtmlLang(current)

export function getLocale(): Locale {
  return current
}

export function setLocale(next: Locale) {
  if (next === current) return
  current = next
  safeStorage.set(STORAGE_KEY, next)
  syncHtmlLang(next)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function lookup(locale: Locale, key: string): string | undefined {
  const dot = key.indexOf('.')
  const ns = key.slice(0, dot) as Namespace
  const name = key.slice(dot + 1)
  const table = dictionaries[locale][ns] as Record<string, string> | undefined
  return table?.[name]
}

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** Translate in an explicit locale (falls back to English, then the key). */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  return interpolate(lookup(locale, key) ?? lookup('en', key) ?? key, vars)
}

/** Plural-aware translate: `${key}_one` when count === 1, else `${key}_other`. */
export function translatePlural(locale: Locale, key: PluralKey, count: number, vars?: Vars) {
  const form = (count === 1 ? `${key}_one` : `${key}_other`) as MessageKey
  return translate(locale, form, { count, ...vars })
}

/** Current-locale translate for non-React code (services, error helpers). */
export function t(key: MessageKey, vars?: Vars) {
  return translate(current, key, vars)
}

export function tn(key: PluralKey, count: number, vars?: Vars) {
  return translatePlural(current, key, count, vars)
}

/** BCP-47 tag for Intl formatting in the current locale ('en-PH' / 'fil-PH'). */
export function intlLocale(locale: Locale = current) {
  return LOCALES.find((l) => l.id === locale)?.intl ?? 'en-PH'
}

/** Locale + bound translators; re-renders the component when the language changes. */
export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale)
  const tBound = useCallback((key: MessageKey, vars?: Vars) => translate(locale, key, vars), [locale])
  const tnBound = useCallback(
    (key: PluralKey, count: number, vars?: Vars) => translatePlural(locale, key, count, vars),
    [locale],
  )
  return { locale, setLocale, t: tBound, tn: tnBound, intl: intlLocale(locale) }
}
