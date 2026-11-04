import { useEffect, useState, type ReactNode } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Gauge,
  History,
  LoaderCircle,
  LogOut,
  MapPin,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react'

import { PHILIPPINE_REGIONS } from '@/data/philippineRegions'
import { memberError, updateMemberRegion, type MemberProfile } from '@/services/memberAuth'

export type SettingId = 'usage' | 'profile' | 'region' | 'help' | 'activity'

export function AccountSettingsMenu({
  onOpen,
  onUpgrade,
  onLogout,
}: {
  onOpen: (setting: SettingId) => void
  onUpgrade: () => void
  onLogout: () => void
}) {
  const [themeOpen, setThemeOpen] = useState(false)

  return (
    <div className="absolute bottom-14 left-1 z-50 w-[280px] overflow-y-auto rounded-2xl border border-[#e6eeea] bg-white p-2 shadow-[0_24px_50px_-28px_rgba(23,48,38,0.45)]">
      <Section label="Account">
        <Row icon={Gauge} label="Usage limits" onClick={() => onOpen('usage')} />
        <Row icon={Sparkles} label="Upgrade membership" onClick={onUpgrade} />
      </Section>
      <Section label="Preferences">
        <Row icon={UserRound} label="Profile" onClick={() => onOpen('profile')} />
        <Row icon={Sun} label="Theme" trailing={<ChevronRight size={14} />} onClick={() => setThemeOpen((open) => !open)} />
        {themeOpen ? (
          <button
            type="button"
            className="ml-8 flex h-9 w-[calc(100%-2rem)] items-center justify-between rounded-lg px-2 text-sm text-[#24312a] hover:bg-[#f3f6f4]"
            onClick={() => setThemeOpen(false)}
          >
            Light
            <Check size={14} className="text-[#0e6b3e]" />
          </button>
        ) : null}
      </Section>
      <Section label="Data & privacy">
        <Row icon={MapPin} label="Region" onClick={() => onOpen('region')} />
        <Row icon={CircleHelp} label="Help" onClick={() => onOpen('help')} />
        <Row icon={History} label="Activity" onClick={() => onOpen('activity')} />
        <Row icon={LogOut} label="Log out" onClick={onLogout} />
      </Section>
    </div>
  )
}

export function SettingsScreen({
  setting,
  member,
  tokens,
  questions,
  onUpgrade,
  onOpenQuestion,
  onMember,
}: {
  setting: SettingId
  member: MemberProfile | null
  tokens: number
  questions: string[]
  onUpgrade: () => void
  onOpenQuestion: (question: string) => void
  onMember: (member: MemberProfile) => void
}) {
  if (setting === 'usage') {
    return (
      <Frame title="Usage limits" text={`${member?.plan ?? 'Free Trial'} · one question uses one token.`}>
        <p className="serif text-6xl tracking-[-0.04em]">{tokens.toLocaleString('en-PH')}</p>
        <p className="mt-2 text-sm text-[#5c6b63]">tokens left</p>
        <button type="button" onClick={onUpgrade} className="btn-primary mt-6">
          Upgrade membership
        </button>
      </Frame>
    )
  }

  if (setting === 'profile') {
    return (
      <Frame title="Profile" text="The details on this school account.">
        <dl className="divide-y divide-[#eef2ef] rounded-3xl border border-[#e6eeea] bg-white">
          <Detail label="Name" value={member?.name} />
          <Detail label="Email" value={member?.email} />
          <Detail label="Mobile" value={member?.mobile} />
          <Detail label="Region" value={member?.region} />
          <Detail label="Plan" value={member?.plan} />
        </dl>
      </Frame>
    )
  }

  if (setting === 'region') {
    return (
      <Frame title="Region" text="Choose the region for this account.">
        <RegionForm member={member} onMember={onMember} />
      </Frame>
    )
  }

  if (setting === 'help') {
    return (
      <Frame title="Help" text="How this account uses GabayMo.">
        <ul className="space-y-3">
          {[
            'Ask about a fund, a process, or a rule.',
            'One question uses one token from the plan on this account.',
            'A cited answer names the page it comes from. That step is not open yet, so asking does not spend a token.',
          ].map((line) => (
            <li key={line} className="rounded-2xl border border-[#e6eeea] bg-white px-4 py-3 text-sm leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </Frame>
    )
  }

  return (
    <Frame title="Activity" text="Questions asked during this visit.">
      {questions.length === 0 ? (
        <p className="text-sm text-[#5c6b63]">No questions yet.</p>
      ) : (
        <ul className="space-y-2">
          {questions.map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => onOpenQuestion(question)}
                className="w-full rounded-2xl border border-[#e6eeea] bg-white px-4 py-3 text-left text-sm leading-relaxed hover:border-[#b7d7c4]"
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  )
}

function RegionForm({
  member,
  onMember,
}: {
  member: MemberProfile | null
  onMember: (member: MemberProfile) => void
}) {
  const [region, setRegion] = useState(member?.region ?? '')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRegion(member?.region ?? '')
  }, [member?.region])

  async function save() {
    setError('')
    setSaved(false)
    setPending(true)
    try {
      onMember(await updateMemberRegion(region))
      setSaved(true)
    } catch (caught) {
      setError(memberError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-md">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Region</span>
        <span className="relative block">
          <select
            value={region}
            onChange={(event) => {
              setRegion(event.target.value)
              setSaved(false)
            }}
            className="h-12 w-full appearance-none rounded-2xl border border-[#e6e1d8] bg-white px-4 pr-10 text-[15px] outline-none focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10"
          >
            <option value="" disabled>
              Select a region
            </option>
            {PHILIPPINE_REGIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#66756d]"
          />
        </span>
      </label>
      {error ? <p className="mt-3 text-sm text-[#9f2d2d]">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-[#0e6b3e]">Region saved.</p> : null}
      <button
        type="button"
        className="btn-primary mt-5 h-11"
        disabled={pending || !region || region === member?.region}
        onClick={() => void save()}
      >
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {pending ? 'Saving' : 'Save region'}
      </button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-2 pt-2 pb-1 text-xs text-[#8a978f]">{label}</p>
      {children}
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: typeof Gauge
  label: string
  trailing?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm text-[#24312a] hover:bg-[#f3f6f4]"
    >
      <Icon size={16} className="text-[#3d4c44]" />
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  )
}

function Frame({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-xl flex-1 px-6 py-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">ACCOUNT</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{text}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-[#6b7870]">{label}</dt>
      <dd className="truncate text-sm font-medium">{value || 'Not set'}</dd>
    </div>
  )
}
