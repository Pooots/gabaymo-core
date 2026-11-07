import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { PartnerSidebar } from './layout/PartnerSidebar'
import type { KeyboardEvent } from 'react'

import type { AppNotification } from '@/services/notifications'
import { IconButton } from '@/components/ui'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'
import { usePartnerRealtime } from '@/queries/partner'

export function PartnerLayout() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const current = useRouterState({ select: (state) => state.location.pathname })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawer = useRef<HTMLDivElement>(null)
  useFocusTrap(drawer, drawerOpen)
  usePartnerRealtime()

  // Following a link in the drawer closes it.
  const [lastPath, setLastPath] = useState(current)
  if (lastPath !== current) {
    setLastPath(current)
    setDrawerOpen(false)
  }

  // The drawer only exists below lg; growing the window past it closes it.
  useEffect(() => {
    if (!drawerOpen) return
    const wide = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (wide.matches) setDrawerOpen(false)
    }
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [drawerOpen])

  function openNotification(notification: AppNotification) {
    const id = notification.data.ticket_id
    if (notification.type === 'ticket.message' && id) {
      void navigate({ to: '/partner/accepted/$ticketId', params: { ticketId: String(id) } })
    } else {
      void navigate({ to: '/partner/tickets' })
    }
  }

  function onDrawerKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    setDrawerOpen(false)
  }

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-honey-63 text-moss-861 lg:flex-row">
      {/* Small screens: top bar with the menu button; the sidebar becomes a drawer. */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sand-127 bg-honey-49 px-3 pr-16 lg:hidden">
        <IconButton
          label={t('partner.openNav')}
          aria-expanded={drawerOpen}
          aria-controls="partner-nav-drawer"
          onClick={() => setDrawerOpen(true)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-moss-731 hover:bg-surface"
        >
          <Menu size={20} aria-hidden />
        </IconButton>
        <Link to="/partner" aria-label="GabayMo">
          <img src="/gabaymo-logo.png" alt="GabayMo" className="h-8 w-auto" />
        </Link>
      </header>

      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-sand-127 bg-honey-49 px-3 py-5 lg:flex">
        <PartnerSidebar current={current} />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" onKeyDown={onDrawerKeyDown}>
          {/* Backdrop: mouse/touch convenience; keyboard users have Escape and the close button. */}
          <div aria-hidden className="absolute inset-0 bg-moss-898/40" onClick={() => setDrawerOpen(false)} />
          <div
            ref={drawer}
            id="partner-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('partner.navLabel')}
            className="relative flex h-full w-[min(280px,85vw)] flex-col overflow-y-auto border-r border-sand-127 bg-honey-49 px-3 py-5"
          >
            <IconButton
              label={t('partner.closeNav')}
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-3 grid h-9 w-9 place-items-center rounded-full text-moss-731 hover:bg-surface"
            >
              <X size={18} aria-hidden />
            </IconButton>
            <PartnerSidebar current={current} />
          </div>
        </div>
      ) : null}

      {/* One bell for every screen size: in the top bar on phones, floating top-right on desktop. */}
      <div className="absolute top-2 right-3 z-40 lg:top-4 lg:right-6">
        <NotificationBell onOpen={openNotification} />
      </div>

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Outlet />
      </section>
    </main>
  )
}
