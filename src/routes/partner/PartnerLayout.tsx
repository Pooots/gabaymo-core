import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { BookOpen, Inbox, LayoutDashboard, LogOut, MessageSquare, ScrollText, UserRound } from 'lucide-react'

import { logoutPartner } from '@/services/partners'

const items = [
  { to: '/partner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/partner/tickets', label: 'Ticket inbox', icon: Inbox, exact: true },
  { to: '/partner/accepted', label: 'Accepted', icon: MessageSquare, exact: false },
  { to: '/partner/instructions', label: 'Service instructions', icon: ScrollText, exact: false },
  { to: '/partner/library', label: 'Knowledge library', icon: BookOpen, exact: false },
  { to: '/partner/profile', label: 'My profile', icon: UserRound, exact: false },
] as const

export function PartnerLayout() {
  const navigate = useNavigate()
  const current = useRouterState({ select: (state) => state.location.pathname })

  return (
    <main className="flex h-dvh overflow-hidden bg-[#f4f1ea] text-[#173026]">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-[#e7e1d6] bg-[#f7f4ee] px-3 py-5">
        <Link to="/partner" className="px-2" aria-label="GabayMo">
          <img src="/gabaymo-logo.png" alt="GabayMo" className="h-10 w-auto" />
        </Link>
        <p className="mt-6 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#8a8478]">PARTNER</p>
        <nav className="mt-2 flex flex-col gap-1">
          {items.map((item) => {
            const active = item.exact ? current === item.to : current.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex h-10 items-center gap-2.5 rounded-full px-3 text-sm ${
                  active ? 'bg-[#171717] font-medium text-white' : 'text-[#3d4c44] hover:bg-white'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button
          type="button"
          className="mt-auto flex h-10 items-center gap-2 rounded-full px-3 text-sm text-[#5c6b63] hover:bg-white"
          onClick={() => {
            void logoutPartner().finally(() => {
              void navigate({ to: '/login' })
            })
          }}
        >
          <LogOut size={16} />
          Log out
        </button>
      </aside>
      <section className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </section>
    </main>
  )
}
