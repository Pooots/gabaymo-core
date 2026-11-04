import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'

import { readMember } from '@/services/memberAuth'

const links = [
  { href: '#home', label: 'Home' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#membership', label: 'Membership' },
  { href: '#about', label: 'About Us' },
]

export function SiteHeader() {
  const member = readMember()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
          ? 'border-[#e4ece7] bg-white/90 shadow-[0_10px_30px_-24px_rgba(16,40,28,0.7)] backdrop-blur-md'
          : 'border-transparent bg-white/75 backdrop-blur-sm'
      }`}
    >
      <div className="relative mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#home" className="shrink-0" aria-label="GabayMo home">
          <img
            src="/gabaymo-logo.png"
            alt="GabayMo"
            className="h-12 w-auto sm:h-14"
          />
        </a>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[14.5px] text-[#3d4a43] lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-[#0e6b3e]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {member ? (
            <Link to="/account" className="btn-primary">
              Account
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-[#243028]">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-[#e1eae4] text-[#173026] lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#e7eee9] bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-[#243028]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {member ? (
              <Link
                to="/account"
                className="btn-primary mt-2 justify-center"
                onClick={() => setOpen(false)}
              >
                Account
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-3 text-[#243028]"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary mt-2 justify-center"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
