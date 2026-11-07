import { useState } from 'react'
import axios from 'axios'
import { Link, useParams } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { MemberActions } from './members/MemberActions'
import type { FormEvent } from 'react'

import type { MessageKey } from '@/i18n'
import { ErrorState, Skeleton, SkeletonRows } from '@/components/ui'
import { UsageMeter } from '@/components/usage/UsageMeter'
import { useI18n } from '@/i18n'
import { useGrantExtraUsage, useMember, useMemberUsage } from '@/queries/admin'
import { memberError } from '@/services/memberAuth'
import { formatPercent, formatTokens } from '@/services/usage'

const QUICK_GRANTS = [10, 25, 50, 100]

const EVENT_LABEL: Record<string, MessageKey> = {
  usage: 'admin.memberEventUsage',
  period_start: 'admin.memberEventPeriod',
  extra_grant: 'admin.memberEventGrant',
  adjustment: 'admin.memberEventAdjustment',
}

const HISTORY_COLUMNS: Array<MessageKey> = [
  'admin.memberColWhen',
  'admin.memberColEvent',
  'admin.memberColInput',
  'admin.memberColCached',
  'admin.memberColOutput',
  'admin.memberColWeighted',
  'admin.memberColShare',
]

function isNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export function MemberDetailPage() {
  const { t, intl } = useI18n()
  const { memberId } = useParams({ strict: false })
  const id = Number(memberId)
  const memberQuery = useMember(id)
  const usageQuery = useMemberUsage(id)
  const grant = useGrantExtraUsage(id)
  const member = memberQuery.data ?? null
  const events = usageQuery.data?.events ?? []
  const [percent, setPercent] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const when = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(intl, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : ''
  const num = (value: number | null | undefined) => (value ?? 0).toLocaleString(intl)
  const tokens = (value: number) => t('admin.tokensCount', { count: formatTokens(value) })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(percent)
    if (!Number.isFinite(value) || value < 1 || value > 500) {
      setError(t('admin.memberGrantRange'))
      return
    }
    setError('')
    setNotice('')
    try {
      await grant.mutateAsync({ percent: value, note: note.trim() })
      setPercent('')
      setNote('')
      setNotice(t('admin.memberGranted', { percent: formatPercent(value) }))
    } catch (reason) {
      setError(memberError(reason))
    }
  }

  const backLink = (
    <Link to="/admin/members" className="text-sm font-medium text-brand-strong">
      {t('admin.membersTitle')}
    </Link>
  )

  if (!Number.isFinite(id) || isNotFound(memberQuery.error)) {
    return (
      <div className="w-full">
        {backLink}
        <p className="mt-6 text-sm text-ash-573">{t('admin.memberNotFound')}</p>
      </div>
    )
  }

  if (memberQuery.isError && !member) {
    return (
      <div className="w-full">
        {backLink}
        <ErrorState
          className="mt-6"
          error={memberQuery.error}
          retrying={memberQuery.isFetching}
          onRetry={() => void memberQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {backLink}
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em] break-words">
        {member?.name ?? t('admin.memberFallbackTitle')}
      </h1>
      <p className="mt-2 text-sm text-ash-573">
        {member ? t('admin.memberSubtitle', { plan: member.plan, joined: when(member.joined_at) }) : t('admin.memberLoading')}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="min-w-0 rounded-3xl border border-sand-86 bg-surface p-6">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-ash-459 uppercase">{t('admin.memberProfile')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label={t('admin.colName')} value={member?.name} loading={!member} />
            <Row label={t('admin.email')} value={member?.email} loading={!member} />
            <Row label={t('admin.memberMobile')} value={member?.mobile} loading={!member} />
            <Row label={t('admin.colRegion')} value={member?.region} loading={!member} />
            <Row label={t('admin.memberSchool')} value={member?.school_name} loading={!member} />
            <Row label={t('admin.colPlan')} value={member?.plan} loading={!member} />
          </dl>
        </section>
        <section className="min-w-0 rounded-3xl border border-sand-86 bg-surface p-6">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-ash-459 uppercase">{t('admin.memberUsage')}</h2>
          {member ? (
            <div className="mt-3">
              <UsageMeter usage={member.usage} label={member.usage.refreshes ? t('admin.memberThisMonth') : t('admin.memberTrial')} />
              {member.usage.raw ? (
                <dl className="mt-4 space-y-2 text-xs">
                  <Row label={t('admin.memberAllowance')} value={tokens(member.usage.raw.allowance)} />
                  <Row label={t('admin.memberUsed')} value={tokens(member.usage.raw.used)} />
                  <Row label={t('admin.memberInProgress')} value={tokens(member.usage.raw.reserved)} />
                  <Row label={t('admin.memberExtra')} value={tokens(member.usage.raw.extra)} />
                  <Row label={t('admin.memberAvailable')} value={tokens(member.usage.raw.available)} />
                </dl>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-2" aria-hidden>
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2 w-full" />
            </div>
          )}
          <form onSubmit={(event) => void onSubmit(event)} className="mt-6">
            <label className="text-sm font-medium" htmlFor="extra-percent">
              {t('admin.memberGrant')}
            </label>
            <p id="extra-percent-hint" className="mt-1 text-xs text-ash-573">
              {t('admin.memberGrantHint')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_GRANTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={percent === String(value)}
                  onClick={() => setPercent(String(value))}
                  className={`h-8 rounded-full border px-3 text-xs font-medium ${
                    percent === String(value) ? 'border-brand-strong bg-brand-strong text-white' : 'border-sand-122 text-ash-890'
                  }`}
                >
                  +{value}%
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="extra-percent"
                aria-describedby="extra-percent-hint"
                value={percent}
                onChange={(event) => setPercent(event.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
                required
                placeholder="25"
                className="h-11 w-full rounded-2xl border border-sand-122 bg-ash-14 px-4 text-sm outline-none focus:border-brand-strong"
              />
              <span className="text-sm text-ash-573" aria-hidden>
                %
              </span>
            </div>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={160}
              aria-label={t('admin.memberReason')}
              placeholder={t('admin.memberReason')}
              className="mt-2 h-11 w-full rounded-2xl border border-sand-122 bg-ash-14 px-4 text-sm outline-none focus:border-brand-strong"
            />
            {error ? (
              <p role="alert" className="mt-2 text-sm text-rust-580">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="mt-2 text-sm text-brand-strong">
                {notice}
              </p>
            ) : null}
            <button type="submit" disabled={grant.isPending || !percent} className="btn-primary mt-4 h-11">
              {grant.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
              {t('admin.memberGrant')}
            </button>
          </form>
        </section>
      </div>

      {member ? <MemberActions member={member} /> : null}

      <section className="mt-4 min-w-0 rounded-3xl border border-sand-86 bg-surface p-6">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] text-ash-459 uppercase">{t('admin.memberHistory')}</h2>
        {usageQuery.isError && !usageQuery.data ? (
          <ErrorState
            compact
            className="mt-3"
            error={usageQuery.error}
            retrying={usageQuery.isFetching}
            onRetry={() => void usageQuery.refetch()}
          />
        ) : usageQuery.data && events.length === 0 ? (
          <p className="mt-3 text-sm text-ash-573">{t('admin.memberNoUsage')}</p>
        ) : (
          <div className="relative mt-3 max-w-full overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label={t('admin.memberHistory')}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-ash-459">
                <tr>
                  {HISTORY_COLUMNS.map((column) => (
                    <th key={column} scope="col" className="py-2 pr-4 font-medium">
                      {t(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-67">
                {!usageQuery.data ? (
                  <SkeletonRows rows={3} columns={HISTORY_COLUMNS.length} />
                ) : (
                  events.map((event) => {
                    const label = EVENT_LABEL[event.type]
                    const isUsage = event.type === 'usage'
                    return (
                      <tr key={event.id}>
                        <td className="py-2 pr-4 whitespace-nowrap text-ash-573">{when(event.created_at)}</td>
                        <td className="py-2 pr-4">
                          {label ? t(label) : event.type}
                          {event.note ? ` · ${event.note}` : ''}
                        </td>
                        <td className="py-2 pr-4 tabular-nums">{isUsage ? num(event.input_tokens) : '—'}</td>
                        <td className="py-2 pr-4 tabular-nums">{isUsage ? num(event.cached_input_tokens) : '—'}</td>
                        <td className="py-2 pr-4 tabular-nums">{isUsage ? num(event.output_tokens) : '—'}</td>
                        <td className="py-2 pr-4 tabular-nums">{num(event.tokens)}</td>
                        <td className="py-2 pr-4 tabular-nums">{formatPercent(event.percent)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, loading = false }: { label: string; value?: string | null; loading?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ash-459">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-ash-890">
        {loading ? <Skeleton className="h-3.5 w-24" /> : value || '—'}
      </dd>
    </div>
  )
}
