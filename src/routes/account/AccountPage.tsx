import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Menu } from 'lucide-react'

import { SettingsScreen } from './AccountSettings'
import { MemberTickets } from './MemberTickets'
import { PlanUpgrade } from './PlanUpgrade'
import { AnswersView } from './ask/AnswersView'
import { AskHome } from './ask/AskHome'
import { Thread } from './ask/Thread'
import { useAsk } from './ask/useAsk'
import { AccountSidebar } from './shell/AccountSidebar'
import { usePaymentReturn } from './plan/usePaymentReturn'
import { VerifyEmailBanner } from './settings/AccountScreens'
import { ReminderDialog } from './settings/Reminders'
import type { ReminderDraft } from './settings/Reminders'
import type { FormEvent } from 'react'
import type { Panel } from './shell/AccountSidebar'
import type { SettingId } from './settings/SettingsMenu'
import { IconButton } from '@/components/ui'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'
import { ThemeToggle } from '@/components/preferences/ThemeToggle'
import { UsagePill } from '@/components/usage/UsageMeter'
import { useI18n } from '@/i18n'
import { memberKeys, useConversations, useMe } from '@/queries/member'
import { logoutMember } from '@/services/memberAuth'

export function AccountPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const client = useQueryClient()
  const me = useMe()
  const member = me.data ?? null
  const conversations = useConversations()
  const askFlow = useAsk()
  const {
    active,
    setActive,
    pendingQuestion,
    asking,
    askError,
    setAskError,
    draft,
    setDraft,
  } = askFlow
  const [panel, setPanel] = useState<Panel>('ask')
  const [menuOpen, setMenuOpen] = useState(false)
  const [setting, setSetting] = useState<SettingId>('usage')
  // Ticket chat to open from a notification click (key re-triggers the same ticket).
  const [ticketFocus, setTicketFocus] = useState<{
    id: number
    key: number
  } | null>(null)
  // "Pay again" from the membership card: open the checkout of that plan.
  const [renewPlanId, setRenewPlanId] = useState<number | null>(null)
  // "Add reminder" from an answer.
  const [reminderDraft, setReminderDraft] = useState<ReminderDraft | null>(null)
  const [reminderSaved, setReminderSaved] = useState(false)

  // Back from the verification email: show the result once, then drop it from the URL.
  const search = useSearch({ from: '/account' })
  const [verified] = useState(search.verified ?? null)
  useEffect(() => {
    if (search.verified) {
      void navigate({ to: '/account', search: {}, replace: true })
      if (search.verified === '1')
        void client.invalidateQueries({ queryKey: memberKeys.me() })
    }
  }, [search.verified, navigate, client])

  // The session ended on the server: sign out here too.
  useEffect(() => {
    if (axios.isAxiosError(me.error) && me.error.response?.status === 401) {
      void logoutMember().finally(() => {
        void navigate({ to: '/login' })
      })
    }
  }, [me.error, navigate])

  const paymentMessage = usePaymentReturn(() => setPanel('plan'))

  function closeMenu() {
    setMenuOpen(false)
  }

  function openPanel(next: Panel) {
    setPanel(next)
    if (next !== 'plan') setRenewPlanId(null)
    setTicketFocus(null)
    closeMenu()
    if (next === 'ask') setActive(null)
  }

  function openSetting(next: SettingId) {
    setSetting(next)
    setPanel('settings')
    closeMenu()
  }

  function logOut() {
    void logoutMember().finally(() => {
      void navigate({ to: '/login' })
    })
  }

  function openConversation(id: string) {
    setActive(id)
    setAskError('')
    setPanel('ask')
    closeMenu()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPanel('ask')
    closeMenu()
    void askFlow.ask(draft)
  }

  const first =
    member?.first_name?.trim() ||
    member?.name.split(' ')[0] ||
    t('account.there')
  const usage = member?.usage ?? null
  const ticketsOpen = (member?.plan_price ?? 0) > 0
  const activeTitle =
    conversations.data?.find((c) => c.id === active)?.title ?? null
  const threadOpen =
    panel === 'ask' && (active !== null || pendingQuestion !== null)

  return (
    <main className="flex h-dvh overflow-hidden bg-ash-41 text-moss-861">
      <AccountSidebar
        open={menuOpen}
        onClose={closeMenu}
        member={member}
        firstName={first}
        panel={panel}
        active={active}
        conversations={conversations}
        ticketsOpen={ticketsOpen}
        onPanel={openPanel}
        onOpenConversation={openConversation}
        onSetting={openSetting}
        onLogout={logOut}
      />

      <section
        className={`relative flex min-w-0 flex-1 flex-col overflow-x-hidden ${panel === 'tickets' || threadOpen ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(820px_460px_at_50%_42%,rgba(170,214,188,0.55),transparent_68%)]" />

        <header className="relative flex h-14 shrink-0 items-center justify-between gap-2 px-4 sm:px-6">
          <IconButton
            label={t('common.openMenu')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-surface/70 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="account-sidebar"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} aria-hidden />
          </IconButton>
          <span className="ml-auto flex min-w-0 items-center gap-2">
            <ThemeToggle compact />
            <span className="hidden sm:inline-flex">
              <LanguageSwitcher compact />
            </span>
            <NotificationBell
              onOpen={(notification) => {
                const id = notification.data.ticket_id
                openPanel('tickets')
                if (id) setTicketFocus({ id, key: Date.now() })
              }}
            />
            <UsagePill usage={usage} onClick={() => openPanel('plan')} />
          </span>
        </header>
        <VerifyEmailBanner member={member} verified={verified} />
        {reminderSaved ? (
          <p
            role="status"
            className="relative mx-4 mt-2 max-w-xl self-center rounded-2xl bg-surface/90 px-4 py-3 text-center text-sm text-moss-833 shadow-sm sm:mx-auto"
          >
            {t('memberAccount.reminderSaved')}{' '}
            <button
              type="button"
              className="font-medium text-brand underline"
              onClick={() => {
                setReminderSaved(false)
                openSetting('reminders')
              }}
            >
              {t('memberAccount.reminderView')}
            </button>
          </p>
        ) : null}
        {paymentMessage ? (
          <p
            role="status"
            className="relative mx-4 mt-2 max-w-xl self-center rounded-2xl bg-surface/90 px-4 py-3 text-center text-sm text-moss-833 shadow-sm sm:mx-auto"
          >
            {paymentMessage}
          </p>
        ) : null}

        {panel === 'plan' ? (
          <PlanUpgrade
            key={renewPlanId ?? 'plans'}
            member={member}
            usage={usage}
            renewPlanId={renewPlanId}
          />
        ) : panel === 'tickets' && ticketsOpen ? (
          <MemberTickets focus={ticketFocus} />
        ) : panel === 'settings' ? (
          <SettingsScreen
            setting={setting}
            member={member}
            usage={usage}
            conversations={conversations.data ?? []}
            onUpgrade={() => openPanel('plan')}
            onRenew={(planId) => {
              openPanel('plan')
              setRenewPlanId(planId)
            }}
            onOpenConversation={openConversation}
            onMember={(next) => client.setQueryData(memberKeys.me(), next)}
          />
        ) : panel === 'answers' ? (
          <AnswersView
            onOpen={openConversation}
            onStart={() => openPanel('ask')}
          />
        ) : threadOpen ? (
          <Thread
            key={active ?? 'new'}
            conversationId={active}
            title={activeTitle}
            pendingQuestion={pendingQuestion}
            error={askError}
            asking={asking}
            onSubmit={onSubmit}
            draft={draft}
            setDraft={setDraft}
            onAddReminder={(next) => {
              setReminderSaved(false)
              setReminderDraft(next)
            }}
            onDeleted={() => {
              setActive(null)
              setPanel('answers')
            }}
          />
        ) : (
          <AskHome
            firstName={first}
            draft={draft}
            setDraft={setDraft}
            onSubmit={onSubmit}
            asking={asking}
            error={askError}
          />
        )}
      </section>
      {reminderDraft ? (
        <ReminderDialog
          reminder={null}
          draft={reminderDraft}
          onClose={() => setReminderDraft(null)}
          onSaved={() => setReminderSaved(true)}
        />
      ) : null}
    </main>
  )
}
