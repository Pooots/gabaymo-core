import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'
import { ThemeToggle } from '@/components/preferences/ThemeToggle'
import { useDismiss } from '@/hooks/useDismiss'
import { useI18n } from '@/i18n'
import { readMember } from '@/services/memberAuth'

const links: Array<{ href: string; label: MessageKey }> = [
  { href: '#home', label: 'home.navHome' },
  { href: '#how-it-works', label: 'home.navHow' },
  { href: '#features', label: 'home.navFeatures' },
  { href: '#membership', label: 'home.navMembership' },
  { href: '#about', label: 'home.navAbout' },
]

export function SiteHeader() {
  const { t } = useI18n()
  const member = readMember()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  useDismiss(panelRef, open, () => setOpen(false), toggleRef)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 border-b transition duration-300 ${
        scrolled
          ? 'border-moss-90 bg-surface/90 shadow-[0_10px_30px_-24px_rgba(16,40,28,0.7)] backdrop-blur-md'
          : 'border-transparent bg-surface/75 backdrop-blur-sm'
      }`}
    >
      <div className="relative mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#home" className="shrink-0" aria-label={t('home.logoLabel')}>
          <img src="/gabaymo-logo.png" alt="" className="h-12 w-auto sm:h-14" />
        </a>

        <nav
          aria-label={t('home.navLabel')}
          className="hidden flex-1 items-center justify-center gap-6 text-[14.5px] whitespace-nowrap text-moss-735 xl:flex 2xl:gap-7"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-brand"
            >
              {t(link.label)}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <ThemeToggle compact />
          <LanguageSwitcher compact />
          {member ? (
            <Link to="/account" className="btn-primary">
              {t('home.account')}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-moss-835"
              >
                {t('home.logIn')}
              </Link>
              <Link to="/register" className="btn-primary">
                {t('home.getStartedCta')}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle compact />
          <LanguageSwitcher compact />
          <button
            ref={toggleRef}
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-moss-101 text-moss-861"
            aria-label={open ? t('home.closeMenu') : t('common.openMenu')}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X size={18} aria-hidden />
            ) : (
              <Menu size={18} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          ref={panelRef}
          id="site-mobile-menu"
          className="border-t border-moss-80 bg-surface px-5 py-4 xl:hidden"
        >
          <nav aria-label={t('home.navLabel')} className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-moss-835"
                onClick={() => setOpen(false)}
              >
                {t(link.label)}
              </a>
            ))}
            {member ? (
              <Link
                to="/account"
                className="btn-primary mt-2 justify-center"
                onClick={() => setOpen(false)}
              >
                {t('home.account')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-3 text-moss-835"
                  onClick={() => setOpen(false)}
                >
                  {t('home.logIn')}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary mt-2 justify-center"
                  onClick={() => setOpen(false)}
                >
                  {t('home.getStartedCta')}
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
