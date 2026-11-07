import { forwardRef } from 'react'
import { BellRing, Brain, CircleHelp, CreditCard, Database, Gauge, History, KeyRound, Languages, LogOut, MapPin, Sparkles, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

export type SettingId =
  | 'usage'
  | 'membership'
  | 'reminders'
  | 'profile'
  | 'security'
  | 'preferences'
  | 'region'
  | 'memory'
  | 'data'
  | 'help'
  | 'activity'

/** The account popover (role=menu). The parent owns open state, dismissal and arrow keys. */
export const AccountSettingsMenu = forwardRef<
  HTMLDivElement,
  {
    id?: string
    onOpen: (setting: SettingId) => void
    onUpgrade: () => void
    onLogout: () => void
  }
>(function AccountSettingsMenu({ id, onOpen, onUpgrade, onLogout }, ref) {
  const { t } = useI18n()
  return (
    <div
      ref={ref}
      id={id}
      role="menu"
      aria-label={t('settings.menuLabel')}
      className="absolute bottom-14 left-1 z-50 max-h-[calc(100dvh-6rem)] w-[min(280px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_50px_-28px_rgba(23,48,38,0.45)]"
    >
      <Section label={t('settings.groupAccount')}>
        <Row icon={Gauge} label="settings.usageTitle" onClick={() => onOpen('usage')} />
        <Row icon={CreditCard} label="memberAccount.membershipTitle" onClick={() => onOpen('membership')} />
        <Row icon={Sparkles} label="settings.upgrade" onClick={onUpgrade} />
        <Row icon={BellRing} label="memberAccount.remindersTitle" onClick={() => onOpen('reminders')} />
      </Section>
      <Section label={t('settings.groupPreferences')}>
        <Row icon={UserRound} label="settings.profileTitle" onClick={() => onOpen('profile')} />
        <Row icon={KeyRound} label="memberAccount.securityTitle" onClick={() => onOpen('security')} />
        <Row icon={Languages} label="settings.preferencesTitle" onClick={() => onOpen('preferences')} />
      </Section>
      <Section label={t('settings.groupPrivacy')}>
        <Row icon={MapPin} label="settings.regionTitle" onClick={() => onOpen('region')} />
        <Row icon={Brain} label="settings.memoryTitle" onClick={() => onOpen('memory')} />
        <Row icon={Database} label="memberAccount.dataTitle" onClick={() => onOpen('data')} />
        <Row icon={CircleHelp} label="settings.helpTitle" onClick={() => onOpen('help')} />
        <Row icon={History} label="settings.activityTitle" onClick={() => onOpen('activity')} />
        <Row icon={LogOut} label="settings.logout" onClick={onLogout} />
      </Section>
    </div>
  )
})

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="py-1">
      <p aria-hidden className="px-2 pt-2 pb-1 text-xs text-moss-433">
        {label}
      </p>
      {children}
    </div>
  )
}

function Row({ icon: Icon, label, onClick }: { icon: LucideIcon; label: MessageKey; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm text-moss-833 hover:bg-ash-41 focus-visible:bg-ash-41 focus-visible:outline-none"
    >
      <Icon size={16} aria-hidden className="text-moss-731" />
      <span className="flex-1">{t(label)}</span>
    </button>
  )
}
