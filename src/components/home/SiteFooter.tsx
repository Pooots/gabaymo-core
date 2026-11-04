import { Link } from '@tanstack/react-router'

const platform = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#membership', label: 'Membership' },
  { href: '#about', label: 'About us' },
]

const account = [{ href: '#about', label: 'Partner support' }]

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e6eeea] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <div>
          <img src="/gabaymo-logo.png" alt="GabayMo" className="h-16 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5c6b63]">
            Reliable guidance. Verified references. Better decisions. An AI
            policy companion for Philippine public school administrators.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#8b9891]">
            PLATFORM
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-[#24312a]">
            {platform.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-[#0e6b3e]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#8b9891]">
            ACCOUNT
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-[#24312a]">
            <li>
              <Link to="/login" className="hover:text-[#0e6b3e]">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-[#0e6b3e]">
                Get started
              </Link>
            </li>
            {account.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-[#0e6b3e]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
