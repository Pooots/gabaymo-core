import { Detail, Frame } from './settings/Frame'
import {
  DataScreen,
  IssuanceAlertsToggle,
  MembershipScreen,
  SecurityScreen,
} from './settings/AccountScreens'
import { MemoryScreen } from './settings/MemoryScreen'
import { RemindersScreen } from './settings/Reminders'
import { RegionForm } from './settings/RegionForm'
import { UsageScreen } from './settings/UsageScreen'
import type { SettingId } from './settings/SettingsMenu'
import type { MessageKey } from '@/i18n'
import type { ConversationSummary } from '@/services/ai'
import type { MemberProfile } from '@/services/memberAuth'
import type { TokenUsage } from '@/services/usage'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'
import { ThemeToggle } from '@/components/preferences/ThemeToggle'
import { useI18n } from '@/i18n'

export { AccountSettingsMenu } from './settings/SettingsMenu'
export type { SettingId } from './settings/SettingsMenu'

const HELP_LINES: Array<MessageKey> = [
  'settings.help1',
  'settings.help2',
  'settings.help3',
]

export function SettingsScreen({
  setting,
  member,
  usage,
  conversations,
  onUpgrade,
  onRenew = () => undefined,
  onOpenConversation,
  onMember,
}: {
  setting: SettingId
  member: MemberProfile | null
  usage: TokenUsage | null
  conversations: Array<ConversationSummary>
  onUpgrade: () => void
  /** "Pay again": opens the checkout for this plan. */
  onRenew?: (planId: number) => void
  /** Reopens a past question by its conversation id (titles can repeat). */
  onOpenConversation: (id: string) => void
  onMember: (member: MemberProfile) => void
}) {
  const { t } = useI18n()

  if (setting === 'usage') {
    return (
      <Frame
        title={t('settings.usageTitle')}
        text={t('settings.usageText', {
          plan: member?.plan ?? t('account.freeTrial'),
        })}
      >
        <UsageScreen initial={usage} onUpgrade={onUpgrade} />
      </Frame>
    )
  }

  if (setting === 'membership') {
    return (
      <Frame
        title={t('memberAccount.membershipTitle')}
        text={t('memberAccount.membershipText')}
      >
        <MembershipScreen
          member={member}
          onRenew={onRenew}
          onUpgrade={onUpgrade}
        />
      </Frame>
    )
  }

  if (setting === 'reminders') {
    return (
      <Frame
        title={t('memberAccount.remindersTitle')}
        text={t('memberAccount.remindersText')}
      >
        <RemindersScreen />
      </Frame>
    )
  }

  if (setting === 'security') {
    return (
      <Frame
        title={t('memberAccount.securityTitle')}
        text={t('memberAccount.securityText')}
      >
        <SecurityScreen />
      </Frame>
    )
  }

  if (setting === 'data') {
    return (
      <Frame
        title={t('memberAccount.dataTitle')}
        text={t('memberAccount.dataText')}
      >
        <DataScreen member={member} />
      </Frame>
    )
  }

  if (setting === 'profile') {
    return (
      <Frame
        title={t('settings.profileTitle')}
        text={t('settings.profileText')}
      >
        <dl className="divide-y divide-ash-59 rounded-3xl border border-line bg-surface">
          <Detail label={t('settings.fieldName')} value={member?.name} />
          <Detail label={t('settings.fieldEmail')} value={member?.email} />
          <Detail label={t('settings.fieldMobile')} value={member?.mobile} />
          <Detail label={t('settings.fieldRegion')} value={member?.region} />
          <Detail label={t('settings.fieldPlan')} value={member?.plan} />
        </dl>
      </Frame>
    )
  }

  if (setting === 'preferences') {
    return (
      <Frame
        title={t('settings.preferencesTitle')}
        text={t('settings.preferencesText')}
      >
        <div className="space-y-6 rounded-3xl border border-line bg-surface px-5 py-5">
          <LanguageSwitcher />
          <ThemeToggle />
          <IssuanceAlertsToggle member={member} />
        </div>
      </Frame>
    )
  }

  if (setting === 'region') {
    return (
      <Frame title={t('settings.regionTitle')} text={t('settings.regionText')}>
        <RegionForm member={member} onMember={onMember} />
      </Frame>
    )
  }

  if (setting === 'memory') {
    return (
      <Frame title={t('settings.memoryTitle')} text={t('settings.memoryText')}>
        <MemoryScreen />
      </Frame>
    )
  }

  if (setting === 'help') {
    return (
      <Frame title={t('settings.helpTitle')} text={t('settings.helpText')}>
        <ul className="space-y-3">
          {HELP_LINES.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed"
            >
              {t(key)}
            </li>
          ))}
        </ul>
      </Frame>
    )
  }

  return (
    <Frame
      title={t('settings.activityTitle')}
      text={t('settings.activityText')}
    >
      {conversations.length === 0 ? (
        <p className="text-sm text-muted">{t('settings.activityEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onOpenConversation(conversation.id)}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm leading-relaxed break-words hover:border-moss-220"
              >
                {conversation.title ?? t('ask.untitled')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  )
}
