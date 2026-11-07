import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { PartnerDashboardData } from '@/services/partners'
import type { MessageKey } from '@/i18n'
import { Skeleton } from '@/components/ui'
import { useI18n } from '@/i18n'

/** The three duties shown on the dashboard and the instructions page. */
export const DUTIES: ReadonlyArray<MessageKey> = ['partner.duty1', 'partner.duty2', 'partner.duty3']

export function DashboardView({ data }: { data: PartnerDashboardData }) {
  const { t, tn } = useI18n()
  const { partner } = data
  const rules = data.instructions
  const sources = data.sources
  const hours = partner.response_hours
  const sep = t('partner.separator')

  return (
    <div className="flex min-h-full flex-1 flex-col px-4 py-5 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('partner.dashEyebrow')}</p>
          <h1 className="serif mt-2 text-3xl font-medium tracking-[-0.03em] break-words sm:text-4xl">
            {t('partner.dashGreeting', { name: partner.first_name || partner.name })}
          </h1>
        </div>
        <p className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-moss-731">
          <span className="capitalize">{partner.partner_status || t('partner.statusActive')}</span>
          {partner.specialty ? `${sep}${partner.specialty}` : ''}
          {`${sep}${t('partner.replyWindow', { hours })}`}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('partner.statOpenTickets')} value={String(data.open_tickets)} note={t('partner.statOpenTicketsNote')} />
        <Stat label={t('partner.statReplyWithin')} value={t('partner.statReplyWithinValue', { hours })} note={t('partner.statReplyWithinNote')} />
        <Stat label={t('partner.statRules')} value={String(rules.length)} note={t('partner.statRulesNote')} />
        <Stat label={t('partner.statSources')} value={String(data.documents)} note={t('partner.statSourcesNote')} />
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <section className="flex flex-col rounded-3xl border border-line bg-surface p-5">
          <CardHead title={t('partner.navTickets')}>
            <Link to="/partner/tickets" className="text-sm font-medium text-brand">
              {t('partner.openInbox')}
            </Link>
          </CardHead>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {data.open_tickets ? tn('partner.waiting', data.open_tickets) : t('partner.nothingWaiting')}
          </p>
          {data.overdue_tickets ? (
            <Link to="/partner/accepted" className="mt-2 inline-flex w-fit rounded-full bg-rust-33 px-3 py-1 text-xs font-semibold text-rust-620">
              {tn('partner.overdueCount', data.overdue_tickets)}
            </Link>
          ) : null}
          <ol className="mt-5 flex flex-1 flex-col justify-center gap-5">
            {DUTIES.map((duty, index) => (
              <li key={duty} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-moss-71 text-xs font-semibold text-brand">
                  {index + 1}
                </span>
                <span className="pt-1 text-moss-833">{t(duty)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-ash-59 pt-4 text-sm leading-relaxed text-moss-731">
            {partner.specialty
              ? t('partner.commitmentSpecialty', { hours, specialty: partner.specialty })
              : t('partner.commitment', { hours })}
          </p>
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-3xl border border-line bg-surface p-5">
            <CardHead title={t('partner.practiceTitle')}>
              <Link to="/partner/profile" className="text-sm font-medium text-brand">
                {t('partner.profileLink')}
              </Link>
            </CardHead>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label={t('partner.rowSpecialty')} value={partner.specialty} />
              <Row label={t('partner.rowEmail')} value={partner.email} />
              <Row label={t('partner.rowMobile')} value={partner.mobile} />
              <Row label={t('partner.rowWindow')} value={t('partner.rowWindowValue', { hours })} />
            </dl>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-line bg-surface p-5">
            <CardHead title={t('partner.beforeReplyTitle')}>
              <Link to="/partner/instructions" className="text-sm font-medium text-brand">
                {t('partner.rulesLink')}
              </Link>
            </CardHead>
            {rules.length === 0 ? (
              <p className="mt-3 text-sm text-ash-573">{t('partner.noRules')}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rules.map((rule) => (
                  <li key={rule.id} className="text-sm text-moss-833">
                    {rule.title}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-ash-59 pt-3">
              <CardHead title={t('partner.libraryCardTitle')}>
                <Link to="/partner/library" className="text-sm font-medium text-brand">
                  {t('partner.sourcesLink')}
                </Link>
              </CardHead>
              {sources.length === 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-ash-573">{t('partner.noSources')}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {sources.map((source) => (
                    <li key={source.id} className="truncate text-sm text-moss-833">
                      {source.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/** Placeholder with the dashboard's shape while it loads. */
export function DashboardSkeleton() {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" className="flex flex-col px-4 py-5 sm:px-8">
      <span className="sr-only">{t('partner.dashLoading')}</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-2/3 max-w-md" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[104px] w-full rounded-3xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    </div>
  )
}

function CardHead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-3xl border border-line bg-surface px-4 py-4">
      <p className="text-xs text-moss-555">{label}</p>
      <p className="serif mt-1 text-3xl">{value}</p>
      <p className="mt-1 text-xs text-moss-433">{note}</p>
    </article>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  const { t } = useI18n()
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-moss-555">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value || t('partner.notSet')}</dd>
    </div>
  )
}
