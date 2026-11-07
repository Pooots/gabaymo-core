import { Link, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  NotebookPen,
  ScrollText,
  UserRound,
} from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'
import { logoutPartner } from '@/services/partners'

const items = [
  { to: '/partner', label: 'partner.navDashboard', icon: LayoutDashboard, exact: true },
  { to: '/partner/tickets', label: 'partner.navTickets', icon: Inbox, exact: true },
  { to: '/partner/accepted', label: 'partner.navAccepted', icon: MessageSquare, exact: false },
  { to: '/partner/train', label: 'partner.navTrain', icon: GraduationCap, exact: false },
  { to: '/partner/answers', label: 'partner.navAnswers', icon: NotebookPen, exact: false },
  { to: '/partner/instructions', label: 'partner.navInstructions', icon: ScrollText, exact: false },
  { to: '/partner/library', label: 'partner.navLibrary', icon: BookOpen, exact: false },
  { to: '/partner/profile', label: 'partner.navProfile', icon: UserRound, exact: false },
] as const satisfies ReadonlyArray<{ to: string; label: MessageKey; icon: unknown; exact: boolean }>

/** Logo, partner navigation and log out: the desktop sidebar and the phone drawer. */
export function PartnerSidebar({ current }: { current: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <>
      <Link to="/partner" className="w-fit px-2" aria-label="GabayMo">
        <img src="/gabaymo-logo.png" alt="GabayMo" className="h-10 w-auto" />
      </Link>
      <p className="mt-6 px-3 text-[11px] font-semibold tracking-[0.16em] text-sand-494">{t('partner.sectionLabel')}</p>
      <nav aria-label={t('partner.navLabel')} className="mt-2 flex flex-col gap-1">
        {items.map((item) => {
          const active = item.exact ? current === item.to : current.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex h-10 items-center gap-2.5 rounded-full px-3 text-sm ${
                active ? 'bg-ash-910 font-medium text-white' : 'text-moss-731 hover:bg-surface'
              }`}
            >
              <item.icon size={16} aria-hidden />
              {t(item.label)}
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        className="mt-auto flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm text-muted hover:bg-surface"
        onClick={() => {
          void logoutPartner().finally(() => {
            void navigate({ to: '/login' })
          })
        }}
      >
        <LogOut size={16} aria-hidden />
        {t('partner.logOut')}
      </button>
    </>
  )
}
