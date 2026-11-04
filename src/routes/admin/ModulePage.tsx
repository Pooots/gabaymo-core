import { useEffect, useState, type ReactNode } from 'react'

import { fetchAudit, type ActivityItem } from '@/services/adminAuth'
import { fetchMembers, type MemberRow } from '@/services/memberAuth'
import { fetchSubscriptions, type SubscriptionPlan } from '@/services/subscriptions'

export type ModuleKind =
  | 'members'
  | 'tickets'
  | 'access-keys'
  | 'referral-codes'
  | 'plans'
  | 'payments'
  | 'audit-log'

export function ModulePage({ kind }: { kind: ModuleKind }) {
  if (kind === 'members') return <MembersModule />
  if (kind === 'plans') return <PlansModule />
  if (kind === 'audit-log') return <AuditModule />
  if (kind === 'payments') return <PaymentsModule />

  const tables: Record<
    Exclude<ModuleKind, 'members' | 'plans' | 'audit-log' | 'payments'>,
    { title: string; text: string; columns: string[]; empty: string }
  > = {
    tickets: {
      title: 'Tickets',
      text: 'Support tickets opened when a member types /help.',
      columns: ['Ticket', 'Member', 'Subject', 'Partner', 'Status'],
      empty: 'No support tickets are open.',
    },
    'access-keys': {
      title: 'Access keys',
      text: 'Keys that grant a school entry to a library or plan.',
      columns: ['Key', 'Assigned to', 'Plan', 'Uses', 'Status'],
      empty: 'No access keys have been issued.',
    },
    'referral-codes': {
      title: 'Referral codes',
      text: 'Codes a school can use when it joins GabayMo.',
      columns: ['Code', 'Owner', 'Signups', 'Tokens granted', 'Status'],
      empty: 'No referral codes have been created.',
    },
  }

  const page = tables[kind]
  return (
    <Frame title={page.title} text={page.text}>
      <DataTable columns={page.columns} empty={page.empty} />
    </Frame>
  )
}

function MembersModule() {
  const [members, setMembers] = useState<MemberRow[] | null>(null)

  useEffect(() => {
    void fetchMembers()
      .then(setMembers)
      .catch(() => setMembers([]))
  }, [])

  return (
    <Frame title="Members" text="School accounts that registered to use GabayMo.">
      <div className="overflow-hidden rounded-3xl border border-[#eceae6] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#fafaf8] text-[11px] tracking-[0.14em] text-[#8a8a8a] uppercase">
              <tr>
                {['Name', 'Region', 'Email', 'Plan', 'Tokens left', 'Joined'].map((column) => (
                  <th key={column} className="px-5 py-3 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members === null ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-[#6d6d6d]">
                    Loading members…
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-[#6d6d6d]">
                    No members have joined yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-t border-[#f3f1ed]">
                    <td className="px-5 py-4 font-medium">{member.name}</td>
                    <td className="px-5 py-4">{member.region}</td>
                    <td className="px-5 py-4 text-[#5c6b63]">{member.email}</td>
                    <td className="px-5 py-4">{member.plan}</td>
                    <td className="px-5 py-4">{member.tokens_remaining.toLocaleString('en-PH')}</td>
                    <td className="px-5 py-4 text-[#5c6b63]">
                      {member.joined_at
                        ? new Intl.DateTimeFormat('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(member.joined_at))
                        : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Frame>
  )
}

function PlansModule() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null)

  useEffect(() => {
    void fetchSubscriptions()
      .then(setPlans)
      .catch(() => setPlans([]))
  }, [])

  return (
    <Frame
      title="Plans & tokens"
      text="One question uses one token. Unused subscription tokens refresh at the start of the billing cycle."
    >
      {plans === null ? (
        <p className="text-sm text-[#6d6d6d]">Loading plans…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-3xl border p-6 ${
                plan.featured
                  ? 'border-[#0e5c3c] bg-[#0e5c3c] text-white'
                  : 'border-[#eceae6] bg-white'
              }`}
            >
              <p className="text-sm font-medium">{plan.name}</p>
              <p className="peso mt-4 text-4xl tracking-[-0.04em]">{plan.price_label}</p>
              <p className={`mt-1 text-sm ${plan.featured ? 'text-[#d7eee3]' : 'text-[#6d6d6d]'}`}>
                {plan.cadence_label}
              </p>
              <p
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                  plan.featured ? 'bg-white/10' : 'bg-[#f7f6f3]'
                }`}
              >
                {plan.tokens.toLocaleString('en-PH')} questions
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {plan.specs.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className={`mt-6 text-xs ${plan.featured ? 'text-[#d7eee3]' : 'text-[#8d8d8d]'}`}>
                {plan.active ? 'Published' : 'Hidden'} · 0 subscribers
              </p>
            </article>
          ))}
        </div>
      )}
    </Frame>
  )
}

function PaymentsModule() {
  return (
    <Frame
      title="Payments"
      text="Membership charges and token purchases."
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {[
          ['This month', '₱0'],
          ['Successful', '0'],
          ['Failed', '0'],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-3xl border border-[#eceae6] bg-white px-5 py-5"
          >
            <p className="text-sm text-[#6d6d6d]">{label}</p>
            <p className="serif mt-2 text-3xl">{value}</p>
          </article>
        ))}
      </div>
      <DataTable
        columns={['Reference', 'Member', 'Plan', 'Amount', 'Status']}
        empty="No payments have been recorded."
      />
    </Frame>
  )
}

function AuditModule() {
  const [logs, setLogs] = useState<ActivityItem[] | null>(null)

  useEffect(() => {
    void fetchAudit()
      .then(setLogs)
      .catch(() => setLogs([]))
  }, [])

  return (
    <Frame title="Audit log" text="Sign-ins and later changes to records.">
      <div className="rounded-3xl border border-[#eceae6] bg-white">
        {logs === null ? (
          <p className="px-6 py-10 text-sm text-[#6d6d6d]">Loading the log…</p>
        ) : logs.length === 0 ? (
          <p className="px-6 py-10 text-sm text-[#6d6d6d]">No actions recorded yet.</p>
        ) : (
          <ul>
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f1ed] px-6 py-4 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{log.summary}</p>
                  <p className="mt-1 text-xs tracking-wide text-[#8d8d8d] uppercase">
                    {log.action}
                  </p>
                </div>
                <p className="text-xs text-[#6d6d6d]">
                  {log.at
                    ? new Intl.DateTimeFormat('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(log.at))
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Frame>
  )
}

function Frame({
  title,
  text,
  children,
}: {
  title: string
  text: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="serif text-4xl font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">{text}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

function DataTable({ columns, empty }: { columns: string[]; empty: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#eceae6] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#fafaf8] text-[11px] tracking-[0.14em] text-[#8a8a8a] uppercase">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-5 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center text-[#6d6d6d]">
                {empty}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
