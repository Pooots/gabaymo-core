import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  Building2,
  FileSearch,
  KeyRound,
  Layers,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Lock,
  MessageSquareText,
  Receipt,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

export type AdminPath =
  | '/admin'
  | '/admin/members'
  | '/admin/roles'
  | '/admin/partners'
  | '/admin/tickets'
  | '/admin/access-keys'
  | '/admin/referral-codes'
  | '/admin/plans'
  | '/admin/subscriptions'
  | '/admin/payments'
  | '/admin/audit-log'
  | '/admin/knowledge-library'
  | '/admin/source-review'
  | '/admin/knowledge-search'
  | '/admin/service-instructions'
  | '/admin/ai-review'
  | '/admin/organizations'
  | '/admin/ai/feedback'
  | '/admin/ai/analytics'
  | '/admin/security'

type NavItem = {
  to: AdminPath
  /** i18n key of the visible label. */
  label: MessageKey
  /** Permission keys (any of) from ws AdminPermissions; empty = every signed-in staff account. */
  keys: Array<string>
  icon: LucideIcon
  exact?: boolean
}

/** True when the staff role can open this nav item. */
export function canOpen(item: { keys: Array<string> }, permissions: Array<string> | undefined) {
  return !permissions || item.keys.length === 0 || item.keys.some((key) => permissions.includes(key))
}

export const adminSections: Array<{ label: MessageKey; items: Array<NavItem> }> = [
  {
    label: 'admin.navOperations',
    items: [
      { to: '/admin', label: 'admin.navOverview', keys: ['overview'], icon: LayoutDashboard, exact: true },
      { to: '/admin/members', label: 'admin.navMembers', keys: ['members'], icon: Users },
      { to: '/admin/roles', label: 'admin.navRoles', keys: ['roles'], icon: ShieldCheck },
      { to: '/admin/partners', label: 'admin.navPartners', keys: ['partners'], icon: Scale },
      { to: '/admin/tickets', label: 'admin.navTickets', keys: ['tickets'], icon: LifeBuoy },
      { to: '/admin/access-keys', label: 'admin.navAccessKeys', keys: ['access-keys'], icon: KeyRound },
      { to: '/admin/referral-codes', label: 'admin.navReferralCodes', keys: ['referral-codes'], icon: Ticket },
      { to: '/admin/organizations', label: 'adminOps.navOrganizations', keys: ['organizations'], icon: Building2 },
      { to: '/admin/plans', label: 'admin.navPlans', keys: ['plans'], icon: Layers },
      { to: '/admin/subscriptions', label: 'admin.navSubscriptions', keys: ['subscriptions'], icon: Wallet },
      { to: '/admin/payments', label: 'admin.navPayments', keys: ['payments'], icon: Receipt },
      { to: '/admin/audit-log', label: 'admin.navAuditLog', keys: ['audit-log'], icon: ScrollText },
    ],
  },
  {
    label: 'admin.navKnowledgeAi',
    items: [
      { to: '/admin/knowledge-library', label: 'admin.navKnowledgeLibrary', keys: ['knowledge-library'], icon: Library },
      { to: '/admin/source-review', label: 'admin.navSourceReview', keys: ['source-review'], icon: FileSearch },
      { to: '/admin/knowledge-search', label: 'admin.navKnowledgeSearch', keys: ['knowledge-search'], icon: Search },
      { to: '/admin/service-instructions', label: 'admin.navServiceInstructions', keys: ['service-instructions'], icon: MessageSquareText },
      { to: '/admin/ai-review', label: 'admin.navAiReview', keys: ['ai-review'], icon: Sparkles },
      { to: '/admin/ai/feedback', label: 'adminOps.navFeedback', keys: ['feedback', 'ai-review'], icon: ThumbsUp },
      { to: '/admin/ai/analytics', label: 'adminOps.navAnalytics', keys: ['analytics', 'ai-review'], icon: BarChart3 },
    ],
  },
  {
    label: 'adminOps.navAccount',
    items: [{ to: '/admin/security', label: 'adminOps.navSecurity', keys: [], icon: Lock }],
  },
]

export const adminModules = adminSections.flatMap((section) => section.items)

export function AdminNav({
  current,
  onNavigate,
  permissions,
}: {
  current: string
  onNavigate?: () => void
  permissions?: Array<string>
}) {
  const { t } = useI18n()
  const sections = adminSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canOpen(item, permissions)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <nav aria-label={t('admin.navLabel')} className="flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-2.5 text-[10px] font-semibold tracking-[0.16em] text-sand-424 uppercase">
            {t(section.label)}
          </p>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = item.exact
                ? current === item.to
                : current === item.to || current.startsWith(`${item.to}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={item.exact ? { exact: true } : undefined}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1 text-[13.5px] transition ${
                    active
                      ? 'bg-ash-910 font-medium text-white'
                      : 'text-ash-627 hover:bg-black/[0.04] hover:text-ash-835'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
