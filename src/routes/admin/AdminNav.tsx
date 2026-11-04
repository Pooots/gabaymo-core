import { Link } from '@tanstack/react-router'
import {
  FileSearch,
  KeyRound,
  Layers,
  ShieldCheck,
  LayoutDashboard,
  Library,
  LifeBuoy,
  MessageSquareText,
  Receipt,
  Scale,
  ScrollText,
  Search,
  Sparkles,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

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

type NavItem = {
  to: AdminPath
  label: string
  key: string
  icon: LucideIcon
  exact?: boolean
  planned?: boolean
}

export const adminSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operations',
    items: [
      { to: '/admin', label: 'Overview', key: 'overview', icon: LayoutDashboard, exact: true },
      { to: '/admin/members', label: 'Members', key: 'members', icon: Users },
      { to: '/admin/roles', label: 'Roles & permissions', key: 'roles', icon: ShieldCheck },
      { to: '/admin/partners', label: 'Partners', key: 'partners', icon: Scale },
      { to: '/admin/tickets', label: 'Tickets', key: 'tickets', icon: LifeBuoy },
      { to: '/admin/access-keys', label: 'Access keys', key: 'access-keys', icon: KeyRound },
      { to: '/admin/referral-codes', label: 'Referral codes', key: 'referral-codes', icon: Ticket },
      { to: '/admin/plans', label: 'Plans & tokens', key: 'plans', icon: Layers },
      { to: '/admin/subscriptions', label: 'Subscriptions', key: 'subscriptions', icon: Wallet },
      { to: '/admin/payments', label: 'Payments', key: 'payments', icon: Receipt },
      { to: '/admin/audit-log', label: 'Audit log', key: 'audit-log', icon: ScrollText },
    ],
  },
  {
    label: 'Knowledge & AI',
    items: [
      { to: '/admin/knowledge-library', label: 'Knowledge Library', key: 'knowledge-library', icon: Library },
      { to: '/admin/source-review', label: 'Source Review', key: 'source-review', icon: FileSearch },
      { to: '/admin/knowledge-search', label: 'Knowledge Search', key: 'knowledge-search', icon: Search },
      { to: '/admin/service-instructions', label: 'Service Instructions', key: 'service-instructions', icon: MessageSquareText },
      { to: '/admin/ai-review', label: 'AI Review Queue', key: 'ai-review', icon: Sparkles, planned: true },
    ],
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
  permissions?: string[]
}) {
  const sections = adminSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !permissions || permissions.includes(item.key)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <nav className="flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-2.5 text-[10px] font-semibold tracking-[0.16em] text-[#9a948c] uppercase">
            {section.label}
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
                      ? 'bg-[#171717] font-medium text-white'
                      : 'text-[#5f5f5f] hover:bg-black/[0.04] hover:text-[#2a2a2a]'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.planned ? (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] ${
                        active ? 'bg-white/15 text-white' : 'bg-[#efe8d8] text-[#7a6840]'
                      }`}
                    >
                      PLANNED
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
