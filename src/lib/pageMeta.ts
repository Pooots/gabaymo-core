import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

type PageMeta = { title: MessageKey; index: boolean }

/**
 * Title and search-engine rules per path. Public marketing pages are indexed;
 * signed-in areas and one-time links (reset, setup) are kept out of search results.
 * Social previews use the tags in index.html (crawlers there do not run JavaScript).
 */
const PAGES: Array<{ match: (path: string) => boolean; meta: PageMeta }> = [
  {
    match: (p) => p === '/',
    meta: { title: 'common.pageTitleHome', index: true },
  },
  {
    match: (p) => p === '/login',
    meta: { title: 'common.pageTitleLogin', index: true },
  },
  {
    match: (p) => p === '/register',
    meta: { title: 'common.pageTitleRegister', index: true },
  },
  {
    match: (p) => p === '/terms',
    meta: { title: 'common.pageTitleTerms', index: true },
  },
  {
    match: (p) => p === '/privacy',
    meta: { title: 'common.pageTitlePrivacy', index: true },
  },
  {
    match: (p) => p === '/forgot-password',
    meta: { title: 'common.pageTitleForgotPassword', index: false },
  },
  {
    match: (p) => p === '/reset-password',
    meta: { title: 'common.pageTitleResetPassword', index: false },
  },
  {
    match: (p) => p === '/setup-account',
    meta: { title: 'common.pageTitleSetupAccount', index: false },
  },
  {
    match: (p) => p === '/account' || p.startsWith('/account/'),
    meta: { title: 'common.pageTitleAccount', index: false },
  },
  {
    match: (p) => p === '/admin' || p.startsWith('/admin/'),
    meta: { title: 'common.pageTitleAdmin', index: false },
  },
  {
    match: (p) => p === '/partner' || p.startsWith('/partner/'),
    meta: { title: 'common.pageTitlePartner', index: false },
  },
]

const NOT_FOUND: PageMeta = { title: 'common.pageTitleNotFound', index: false }

export function pageMetaFor(path: string): PageMeta {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  return PAGES.find((page) => page.match(clean))?.meta ?? NOT_FOUND
}

function setMeta(
  selector: string,
  create: () => HTMLElement,
  attr: string,
  value: string,
) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/** Keeps <title>, robots and canonical in step with the current page and language. */
export function usePageMeta() {
  const { t } = useI18n()
  const path = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    const meta = pageMetaFor(path)
    const name = t('common.appName')
    const title = t(meta.title)
    document.title =
      meta.title === 'common.pageTitleHome' ? title : `${title} · ${name}`

    setMeta(
      'meta[name="robots"]',
      () => Object.assign(document.createElement('meta'), { name: 'robots' }),
      'content',
      meta.index
        ? 'index, follow, max-image-preview:large'
        : 'noindex, nofollow',
    )

    // Canonical: the clean public URL of this page (no query string or hash).
    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    )
    if (canonical) {
      const origin = new URL(canonical.href, window.location.origin).origin
      canonical.href = `${origin}${path === '/' ? '/' : path.replace(/\/+$/, '')}`
    }
  }, [path, t])
}
