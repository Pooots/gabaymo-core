import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { ArrowUp, Menu, MessageSquareText, Settings, Sparkles, SquarePen, Ticket, X } from 'lucide-react'

import { logoutMember, memberError, readMember, refreshMember, type MemberProfile } from '@/services/memberAuth'
import { confirmMembershipPayment } from '@/services/payments'

import { AccountSettingsMenu, SettingsScreen, type SettingId } from './AccountSettings'
import { MemberTickets } from './MemberTickets'
import { PlanUpgrade } from './PlanUpgrade'

type Panel = 'ask' | 'answers' | 'plan' | 'tickets' | 'settings'

const starters = [
  'Can MOOE funds pay for the school’s internet subscription?',
  'What belongs in a liquidation report?',
  'How is a teacher’s teaching load counted?',
]

export function AccountPage() {
  const navigate = useNavigate()
  const [member, setMember] = useState<MemberProfile | null>(readMember)
  const [panel, setPanel] = useState<Panel>('ask')
  const [draft, setDraft] = useState('')
  const [asked, setAsked] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [setting, setSetting] = useState<SettingId>('usage')
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)

  useEffect(() => {
    void refreshMember()
      .then((next) => {
        if (next) setMember(next)
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          void logoutMember().finally(() => {
            void navigate({ to: '/login' })
          })
        }
      })
  }, [navigate])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('payment')
    if (!reference) return
    const cancelled = params.get('cancelled') === '1'
    window.history.replaceState({}, '', '/account')
    if (cancelled) {
      setPanel('plan')
      setPaymentMessage('Payment was not completed. Your membership is unchanged.')
      return
    }
    void confirmMembershipPayment(reference)
      .then(async (result) => {
        const next = await refreshMember()
        if (next) setMember(next)
        setPanel('plan')
        setPaymentMessage(
          result.status === 'paid'
            ? `Payment received. Your membership is now ${next?.plan ?? 'updated'}.`
            : 'PayMongo has not confirmed this payment yet. Your membership is unchanged.',
        )
      })
      .catch((error: unknown) => {
        setPanel('plan')
        setPaymentMessage(memberError(error))
      })
  }, [])

  function openPanel(next: Panel) {
    setPanel(next)
    setMenuOpen(false)
    setSettingsOpen(false)
    if (next === 'ask') setActive(null)
  }

  function openSetting(next: SettingId) {
    setSetting(next)
    setPanel('settings')
    setSettingsOpen(false)
    setMenuOpen(false)
  }

  function logOut() {
    void logoutMember().finally(() => {
      void navigate({ to: '/login' })
    })
  }

  function ask(question: string) {
    const text = question.trim()
    if (!text) return
    setAsked((current) => [text, ...current.filter((item) => item !== text)])
    setActive(text)
    setDraft('')
    setPanel('ask')
    setMenuOpen(false)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    ask(draft)
  }

  const first = member?.first_name?.trim() || member?.name?.split(' ')[0] || 'there'
  const tokens = member?.tokens_remaining ?? 0
  const ticketsOpen = (member?.plan_price ?? 0) > 0

  return (
    <main className="flex h-dvh overflow-hidden bg-[#f3f6f4] text-[#173026]">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-[#173026]/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col border-r border-[#e6eeea] bg-[#fbfcfb] px-3 py-4 transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <button type="button" onClick={() => openPanel('ask')} aria-label="GabayMo">
            <img src="/gabaymo-logo.png" alt="GabayMo" className="h-10 w-auto" />
          </button>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-[#5c6b63] lg:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => openPanel('ask')}
          className="mt-5 flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-[#24312a] hover:bg-[#eef3ef]"
        >
          <SquarePen size={16} />
          New question
        </button>

        <nav className="mt-2 space-y-1">
          <NavButton
            icon={MessageSquareText}
            label="Answers"
            active={panel === 'answers'}
            onClick={() => openPanel('answers')}
          />
          <NavButton
            icon={Sparkles}
            label="Plan"
            active={panel === 'plan'}
            onClick={() => openPanel('plan')}
          />
          {ticketsOpen ? (
            <NavButton
              icon={Ticket}
              label="Tickets"
              active={panel === 'tickets'}
              onClick={() => openPanel('tickets')}
            />
          ) : null}
        </nav>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-2">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8a978f]">RECENT</p>
          {asked.length === 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-[#8a978f]">
              Questions you ask will be kept here.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {asked.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(question)
                      setPanel('ask')
                      setMenuOpen(false)
                    }}
                    className={`w-full truncate rounded-xl px-2.5 py-2 text-left text-[13px] ${
                      active === question ? 'bg-[#e7f3ec] text-[#0e6b3e]' : 'text-[#3d4c44] hover:bg-[#f3f6f4]'
                    }`}
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative mt-3">
          {settingsOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              />
              <AccountSettingsMenu onOpen={openSetting} onUpgrade={() => openPanel('plan')} onLogout={logOut} />
            </>
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0e6b3e] text-sm font-semibold text-white">
              {first.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{member?.name ?? 'Your account'}</span>
              <span className="block truncate text-xs text-[#6b7870]">{member?.plan ?? 'Free Trial'}</span>
            </span>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#5c6b63] hover:bg-[#eef3ef]"
              aria-label="Settings"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>

      <section
        className={`relative flex min-w-0 flex-1 flex-col ${panel === 'tickets' ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(820px_460px_at_50%_42%,rgba(170,214,188,0.55),transparent_68%)]" />

        <header className="relative flex h-14 items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/70 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} />
          </button>
          <button
            type="button"
            onClick={() => openPanel('plan')}
            className="ml-auto rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[13px] font-medium text-[#0e6b3e] shadow-sm backdrop-blur"
          >
            {tokens.toLocaleString('en-PH')} tokens left
          </button>
        </header>
        {paymentMessage ? (
          <p className="relative mx-auto mt-2 max-w-xl rounded-2xl bg-white/90 px-4 py-3 text-center text-sm text-[#24312a] shadow-sm">
            {paymentMessage}
          </p>
        ) : null}

        {panel === 'plan' ? (
          <PlanUpgrade member={member} tokens={tokens} />
        ) : panel === 'tickets' && ticketsOpen ? (
          <MemberTickets />
        ) : panel === 'settings' ? (
          <SettingsScreen
            setting={setting}
            member={member}
            tokens={tokens}
            questions={asked}
            onUpgrade={() => openPanel('plan')}
            onOpenQuestion={(question) => ask(question)}
            onMember={setMember}
          />
        ) : panel === 'answers' ? (
          <AnswersView questions={asked} onOpen={(question) => ask(question)} onStart={() => openPanel('ask')} />
        ) : active ? (
          <Thread question={active} onSubmit={onSubmit} draft={draft} setDraft={setDraft} />
        ) : (
          <div className="relative flex flex-1 flex-col items-center justify-center px-5 pb-16">
            <h1 className="serif text-center text-[2.6rem] leading-none font-medium tracking-[-0.03em] text-[#1c2a22] sm:text-5xl">
              Where should we start?
            </h1>
            <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-[#5c6b63]">
              Ask about a fund, a process, or a rule, {first}. GabayMo answers from the page it relies on.
            </p>
            <Composer draft={draft} setDraft={setDraft} onSubmit={onSubmit} />
            <div className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
              {starters.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setDraft(prompt)}
                  className="rounded-full border border-[#e1ebe4] bg-white/80 px-3 py-1.5 text-left text-[13px] text-[#3d4c44] hover:border-[#b7d7c4]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof SquarePen
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center gap-2 rounded-full px-3 text-sm ${
        active ? 'bg-[#e7f3ec] font-medium text-[#0e6b3e]' : 'text-[#3d4c44] hover:bg-[#f3f6f4]'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

function Composer({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string
  setDraft: (value: string) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-white bg-white pr-2 pl-5 shadow-[0_18px_50px_-28px_rgba(23,48,38,0.45)]"
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Ask about a fund, a process, or a rule"
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#8a978f]"
      />
      <button
        type="submit"
        disabled={!draft.trim()}
        aria-label="Ask"
        className="grid h-10 w-10 place-items-center rounded-full bg-[#0e6b3e] text-white disabled:bg-[#d5e3da]"
      >
        <ArrowUp size={18} />
      </button>
    </form>
  )
}

function Thread({
  question,
  draft,
  setDraft,
  onSubmit,
}: {
  question: string
  draft: string
  setDraft: (value: string) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end gap-4 overflow-y-auto px-5 py-6">
        <p className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-white px-4 py-3 text-[15px] leading-relaxed shadow-sm">
          {question}
        </p>
        <article className="max-w-[85%] rounded-3xl rounded-bl-md border border-[#e6eeea] bg-white/90 px-4 py-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">GABAYMO</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#24312a]">
            A cited answer is not open on this account yet, so this question did not use a token. When it is, the answer will name the page it comes from.
          </p>
        </article>
      </div>
      <div className="px-5 pb-6">
        <Composer draft={draft} setDraft={setDraft} onSubmit={onSubmit} />
      </div>
    </div>
  )
}

function AnswersView({
  questions,
  onOpen,
  onStart,
}: {
  questions: string[]
  onOpen: (question: string) => void
  onStart: () => void
}) {
  if (questions.length === 0) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">ANSWERS</p>
        <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">No cited answers yet.</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#5c6b63]">
          Questions you ask from this account will be listed here with the page they rely on.
        </p>
        <button type="button" onClick={onStart} className="btn-primary mt-6">
          Ask a question
        </button>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">ANSWERS</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">Waiting on a citation.</h1>
      <ul className="mt-6 space-y-3">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onOpen(question)}
              className="w-full rounded-3xl border border-[#e6eeea] bg-white px-5 py-4 text-left hover:border-[#b7d7c4]"
            >
              <p className="text-[15px] leading-relaxed">{question}</p>
              <p className="mt-2 text-xs text-[#6b7870]">No token used · citation not open yet</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

