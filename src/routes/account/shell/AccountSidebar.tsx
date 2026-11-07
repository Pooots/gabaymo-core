import { useId, useRef, useState } from 'react'
import {
  MessageSquareText,
  Settings,
  Sparkles,
  SquarePen,
  Ticket,
  X,
} from 'lucide-react'
import { AccountSettingsMenu } from '../settings/SettingsMenu'
import { useMediaQuery } from './useMediaQuery'
import type { UseQueryResult } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import type { SettingId } from '../settings/SettingsMenu'
import type { ConversationSummary } from '@/services/ai'
import type { MemberProfile } from '@/services/memberAuth'
import { ErrorState, IconButton, Skeleton } from '@/components/ui'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'
import { useDismiss, useMenuKeyboard } from '@/hooks/useDismiss'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'

export type Panel = 'ask' | 'answers' | 'plan' | 'tickets' | 'settings'

/**
 * Left rail: new question, sections, recent questions and the account menu.
 * On screens below `lg` it is an off-canvas drawer: focus is trapped while it
 * is open, Escape closes it and focus returns to the menu button.
 */
export function AccountSidebar({
  open,
  onClose,
  member,
  firstName,
  panel,
  active,
  conversations,
  ticketsOpen,
  onPanel,
  onOpenConversation,
  onSetting,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  member: MemberProfile | null
  firstName: string
  panel: Panel
  active: string | null
  conversations: UseQueryResult<Array<ConversationSummary>>
  ticketsOpen: boolean
  onPanel: (panel: Panel) => void
  onOpenConversation: (id: string) => void
  onSetting: (setting: SettingId) => void
  onLogout: () => void
}) {
  const { t } = useI18n()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const drawer = !desktop
  const asideRef = useRef<HTMLElement>(null)
  useFocusTrap(asideRef, drawer && open)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  useDismiss(menuRef, settingsOpen, () => setSettingsOpen(false), triggerRef)
  useMenuKeyboard(menuRef, settingsOpen)

  function onKeyDown(event: KeyboardEvent) {
    // The account menu handles its own Escape first.
    if (event.key === 'Escape' && drawer && open && !settingsOpen) {
      event.stopPropagation()
      onClose()
    }
  }

  function pick(run: () => void) {
    setSettingsOpen(false)
    run()
  }

  const list = conversations.data ?? []

  return (
    <>
      {drawer && open ? (
        <div
          aria-hidden
          className="fixed inset-0 z-20 bg-moss-861/30"
          onClick={onClose}
        />
      ) : null}
      <aside
        ref={asideRef}
        id="account-sidebar"
        onKeyDown={onKeyDown}
        inert={drawer && !open ? true : undefined}
        role={drawer && open ? 'dialog' : undefined}
        aria-modal={drawer && open ? true : undefined}
        aria-label={t('account.sidebarLabel')}
        className={`fixed inset-y-0 left-0 z-30 flex w-[272px] max-w-[85vw] flex-col border-r border-line bg-ash-14 px-3 py-4 transition-transform lg:static lg:max-w-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => onPanel('ask')}
            aria-label={t('account.home')}
          >
            <img src="/gabaymo-logo.png" alt="" className="h-10 w-auto" />
          </button>
          {drawer ? (
            <IconButton
              label={t('account.closeMenu')}
              className="grid h-8 w-8 place-items-center rounded-full text-muted"
              onClick={onClose}
            >
              <X size={16} aria-hidden />
            </IconButton>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onPanel('ask')}
          className="mt-5 flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-moss-833 hover:bg-moss-57"
        >
          <SquarePen size={16} aria-hidden />
          {t('account.newQuestion')}
        </button>

        <nav className="mt-2 space-y-1" aria-label={t('account.sectionsLabel')}>
          <NavButton
            icon={MessageSquareText}
            label={t('account.navAnswers')}
            active={panel === 'answers'}
            onClick={() => onPanel('answers')}
          />
          <NavButton
            icon={Sparkles}
            label={t('account.navPlan')}
            active={panel === 'plan'}
            onClick={() => onPanel('plan')}
          />
          {ticketsOpen ? (
            <NavButton
              icon={Ticket}
              label={t('account.navTickets')}
              active={panel === 'tickets'}
              onClick={() => onPanel('tickets')}
            />
          ) : null}
        </nav>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-2">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-moss-433 uppercase">
            {t('account.recent')}
          </p>
          {conversations.isPending ? (
            <div role="status" aria-busy="true" className="mt-3 space-y-2">
              <span className="sr-only">{t('account.loadingRecent')}</span>
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : conversations.isError ? (
            <ErrorState
              compact
              className="mt-3"
              error={conversations.error}
              title={t('account.recentError')}
              retrying={conversations.isRefetching}
              onRetry={() => void conversations.refetch()}
            />
          ) : list.length === 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-moss-433">
              {t('account.recentEmpty')}
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {list.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onOpenConversation(conversation.id)}
                    aria-current={
                      active === conversation.id ? 'true' : undefined
                    }
                    className={`w-full truncate rounded-xl px-2.5 py-2 text-left text-[13px] ${
                      active === conversation.id
                        ? 'bg-moss-71 text-brand'
                        : 'text-moss-731 hover:bg-ash-41'
                    }`}
                  >
                    {conversation.title ?? t('ask.untitled')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 px-2 sm:hidden">
          <LanguageSwitcher compact />
        </div>

        <div className="relative mt-3">
          {settingsOpen ? (
            <AccountSettingsMenu
              ref={menuRef}
              id={menuId}
              onOpen={(setting) => pick(() => onSetting(setting))}
              onUpgrade={() => pick(() => onPanel('plan'))}
              onLogout={() => pick(onLogout)}
            />
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl px-2 py-2">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white"
            >
              {firstName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {member?.name ?? t('account.yourAccount')}
              </span>
              <span className="block truncate text-xs text-moss-555">
                {member?.plan ?? t('account.freeTrial')}
              </span>
            </span>
            <button
              ref={triggerRef}
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-moss-57"
              aria-label={t('account.settingsMenu')}
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
              aria-controls={settingsOpen ? menuId : undefined}
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <Settings size={16} aria-hidden />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex h-10 w-full items-center gap-2 rounded-full px-3 text-sm ${
        active
          ? 'bg-moss-71 font-medium text-brand'
          : 'text-moss-731 hover:bg-ash-41'
      }`}
    >
      <Icon size={16} aria-hidden />
      {label}
    </button>
  )
}
