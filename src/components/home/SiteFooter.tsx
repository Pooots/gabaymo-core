import { Link } from '@tanstack/react-router'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const platform: Array<{ href: string; label: MessageKey }> = [
  { href: '#how-it-works', label: 'home.footerHow' },
  { href: '#features', label: 'home.footerFeatures' },
  { href: '#membership', label: 'home.footerMembership' },
  { href: '#about', label: 'home.footerAbout' },
]

const account: Array<{ href: string; label: MessageKey }> = [{ href: '#about', label: 'home.footerPartnerSupport' }]

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <div>
          <img src="/gabaymo-logo.png" alt="GabayMo" className="h-16 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {t('home.footerTagline')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-moss-429 uppercase">
            {t('home.footerPlatform')}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-moss-833">
            {platform.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-brand">
                  {t(link.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-moss-429 uppercase">
            {t('home.footerAccount')}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-moss-833">
            <li>
              <Link to="/login" className="hover:text-brand">
                {t('home.logIn')}
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-brand">
                {t('home.getStarted')}
              </Link>
            </li>
            {account.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-brand">
                  {t(link.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
