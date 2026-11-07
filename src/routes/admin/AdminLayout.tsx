import { useEffect, useRef, useState } from 'react'
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'

import { AdminNav, adminModules, canOpen } from './AdminNav'
import type { AdminUser } from '@/services/adminAuth'
import { useDismiss } from '@/hooks/useDismiss'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ThemeToggle } from '@/components/preferences/ThemeToggle'
import { useI18n } from '@/i18n'
import {
  loadAdminSession,
  logoutAdmin,
  readAdminUser,
} from '@/services/adminAuth'

const NAV_ID = 'admin-nav-panel'
const DESKTOP_QUERY = '(min-width: 1024px)'

/** True at the `lg` breakpoint, where the sidebar is always shown. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  )
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => setDesktop(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return desktop
}

function isCurrent(item: { to: string; exact?: boolean }, current: string) {
  return item.exact
    ? current === item.to
    : current === item.to || current.startsWith(`${item.to}/`)
}

export function AdminLayout() {
  const { t } = useI18n()
  const current = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<AdminUser | null>(readAdminUser())
  const [menuOpen, setMenuOpen] = useState(false)
  const desktop = useIsDesktop()
  const panel = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  // The mobile panel only counts as open below `lg`; resizing up closes it.
  const open = menuOpen && !desktop

  useFocusTrap(panel, open)
  useDismiss(panel, open, () => setMenuOpen(false), trigger)

  useEffect(() => {
    void loadAdminSession().then((user) => {
      if (user) setAdmin(user)
    })
  }, [])

  useEffect(() => {
    const permissions = admin?.permissions
    if (!permissions) return
    const currentItem = adminModules.find((item) => isCurrent(item, current))
    if (!currentItem || canOpen(currentItem, permissions)) return
    const next =
      adminModules.find(
        (item) => item.keys.length > 0 && canOpen(item, permissions),
      ) ?? adminModules.find((item) => canOpen(item, permissions))
    if (next) void navigate({ to: next.to })
  }, [admin, current, navigate])

  const currentModule = adminModules.find((item) => isCurrent(item, current))
  const title = currentModule ? t(currentModule.label) : t('admin.consoleTitle')
  const isOverview = current === '/admin'

  return (
    <div className="min-h-screen bg-ash-44 text-ash-890">
      <aside
        ref={panel}
        id={NAV_ID}
        aria-label={t('admin.navLabel')}
        // Off-screen on phones while closed: keep it out of the tab order and the accessibility tree.
        inert={!desktop && !open}
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sand-86 bg-ash-40 px-3 py-5 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-5 flex items-center justify-between gap-2 px-2">
          <Link to="/" className="block" aria-label={t('admin.homeLink')}>
            <img
              src="/gabaymo-logo.png"
              alt="GabayMo"
              className="h-10 w-auto"
            />
          </Link>
          {open ? (
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ash-41 lg:hidden"
              aria-label={t('admin.closeMenu')}
              onClick={() => {
                setMenuOpen(false)
                trigger.current?.focus()
              }}
            >
              <X size={16} aria-hidden />
            </button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav
            current={current}
            permissions={admin?.permissions}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      </aside>

      {open ? (
        // Backdrop: mouse/touch convenience only; keyboard users have Escape and the close button.
        <div
          aria-hidden
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div
        className={`min-w-0 lg:pl-64 ${isOverview ? 'xl:h-dvh xl:overflow-hidden' : ''}`}
      >
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-sand-86 bg-ash-44/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={trigger}
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sand-124 lg:hidden"
              aria-label={open ? t('admin.closeMenu') : t('common.openMenu')}
              aria-expanded={open}
              aria-controls={NAV_ID}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {open ? (
                <X size={18} aria-hidden />
              ) : (
                <Menu size={18} aria-hidden />
              )}
            </button>
            <p className="truncate text-sm font-medium text-ash-773">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <ThemeToggle compact />
            <p className="hidden text-sm text-ash-573 sm:block">
              {admin?.email}
            </p>
            <button
              type="button"
              className="text-sm font-medium text-ash-890"
              onClick={() => {
                void logoutAdmin().finally(() => {
                  window.location.assign('/admin/login')
                })
              }}
            >
              {t('admin.logOut')}
            </button>
          </div>
        </header>
        <main
          className={
            isOverview
              ? 'min-w-0 px-4 py-4 sm:px-6 xl:h-[calc(100dvh-3.5rem)] xl:overflow-hidden'
              : 'min-w-0 px-4 py-8 sm:px-8'
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
