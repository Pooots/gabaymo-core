import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactNode } from 'react'

import type { AllowancePeriod, SubscriptionCadence, SubscriptionPlan } from '@/services/subscriptions'
import { ErrorState, LoadingState } from '@/components/ui'
import { useI18n } from '@/i18n'
import { adminKeys, useSaveSubscription, useSubscriptions } from '@/queries/admin'
import { subscriptionError } from '@/services/subscriptions'
import { TYPICAL_QUESTION_TOKENS, formatTokens } from '@/services/usage'

type Draft = {
  name: string
  price: string
  cadence: SubscriptionCadence
  token_allowance: string
  allowance_period: AllowancePeriod
  summary: string
  specs: string
  featured: boolean
  active: boolean
  sort_order: string
}

const blank: Draft = {
  name: '',
  price: '',
  cadence: 'month',
  token_allowance: '',
  allowance_period: 'month',
  summary: '',
  specs: '',
  featured: false,
  active: true,
  sort_order: '1',
}

export function SubscriptionsPage() {
  const { t, intl } = useI18n()
  const client = useQueryClient()
  const plansQuery = useSubscriptions()
  const save = useSaveSubscription()
  const plans = plansQuery.data ?? []
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Open the first plan once the list first arrives.
  if (!seeded && plansQuery.data) {
    setSeeded(true)
    const first = plansQuery.data[0]
    if (first) {
      setSelectedId(first.id)
      setDraft(toDraft(first))
    }
  }

  function selectPlan(plan: SubscriptionPlan) {
    setSelectedId(plan.id)
    setDraft(toDraft(plan))
    setError('')
    setNotice('')
  }

  function startNew() {
    const nextOrder = plans.reduce((max, plan) => Math.max(max, plan.sort_order), 0) + 1
    setSelectedId(null)
    setDraft({ ...blank, sort_order: String(nextOrder) })
    setError('')
    setNotice('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const specs = draft.specs
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    setError('')
    setNotice('')
    try {
      const saved = await save.mutateAsync({
        id: selectedId,
        plan: {
          name: draft.name.trim(),
          price: Number(draft.price),
          cadence: draft.cadence,
          token_allowance: Number(draft.token_allowance),
          allowance_period: draft.allowance_period,
          summary: draft.summary.trim(),
          specs,
          featured: draft.featured,
          active: draft.active,
          sort_order: Number(draft.sort_order),
        },
      })
      const rows = client.getQueryData<Array<SubscriptionPlan>>(adminKeys.subscriptions()) ?? []
      setSelectedId(saved.id)
      setDraft(toDraft(rows.find((plan) => plan.id === saved.id) ?? saved))
      setNotice(selectedId ? t('admin.subsUpdated') : t('admin.subsAdded'))
    } catch (caught) {
      setError(subscriptionError(caught))
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">{t('admin.subsTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-573">{t('admin.subsText')}</p>
        </div>
        <button type="button" className="rounded-full bg-ash-910 px-4 py-2 text-sm font-medium text-white" onClick={startNew}>
          {t('admin.subsAdd')}
        </button>
      </div>

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <section className="rounded-3xl border border-sand-86 bg-surface" aria-label={t('admin.subsListLabel')}>
          {plansQuery.isPending ? (
            <LoadingState rows={3} label={t('admin.subsLoading')} className="p-4" />
          ) : plansQuery.isError && !plansQuery.data ? (
            <div className="p-4">
              <ErrorState
                compact
                error={plansQuery.error}
                retrying={plansQuery.isFetching}
                onRetry={() => void plansQuery.refetch()}
              />
            </div>
          ) : plans.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ash-573">{t('admin.subsEmpty')}</p>
          ) : (
            <ul>
              {plans.map((plan) => {
                const selected = plan.id === selectedId
                return (
                  <li key={plan.id} className="border-b border-sand-59 last:border-0">
                    <button
                      type="button"
                      aria-current={selected ? 'true' : undefined}
                      className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left ${selected ? 'bg-ash-40' : 'hover:bg-ash-24'}`}
                      onClick={() => selectPlan(plan)}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{plan.name}</span>
                        <span className="peso mt-1 block text-xs text-ash-573">
                          {plan.price_label} {plan.cadence_label} ·{' '}
                          {t(plan.allowance_period === 'month' ? 'admin.subsTokensMonthly' : 'admin.subsTokensOnce', {
                            tokens: formatTokens(plan.token_allowance),
                          })}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {plan.featured ? (
                          <span className="rounded-full bg-brand-strong px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                            {t('admin.subsBestValueBadge')}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-ash-447">{plan.active ? t('admin.published') : t('admin.hidden')}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <form className="rounded-3xl border border-sand-86 bg-surface p-5 sm:p-6" onSubmit={(event) => void onSubmit(event)}>
          <h2 className="text-lg font-semibold">{selectedId ? t('admin.subsEdit') : t('admin.subsNew')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.subsName')} className="sm:col-span-2">
              <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={inputClass} />
            </Field>
            <Field label={t('admin.subsPrice')}>
              <input
                required
                inputMode="numeric"
                min={0}
                type="number"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.subsBilling')}>
              <select
                value={draft.cadence}
                onChange={(event) => {
                  const cadence = event.target.value as SubscriptionCadence
                  // Trials get a one-time allowance; paid plans (yearly too) refresh monthly.
                  setDraft({ ...draft, cadence, allowance_period: cadence === 'forever' ? 'once' : 'month' })
                }}
                className={inputClass}
              >
                <option value="forever">{t('admin.subsForever')}</option>
                <option value="month">{t('admin.subsPerMonth')}</option>
                <option value="year">{t('admin.subsPerYear')}</option>
              </select>
            </Field>
            <Field label={t('admin.subsAllowance')}>
              <input
                required
                inputMode="numeric"
                min={0}
                step={10000}
                type="number"
                value={draft.token_allowance}
                onChange={(event) => setDraft({ ...draft, token_allowance: event.target.value })}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-ash-447">
                {t('admin.subsAllowanceHint', {
                  count: Math.floor(Number(draft.token_allowance || 0) / TYPICAL_QUESTION_TOKENS).toLocaleString(intl),
                })}
              </span>
            </Field>
            <Field label={t('admin.subsRefresh')}>
              <select
                value={draft.allowance_period}
                onChange={(event) => setDraft({ ...draft, allowance_period: event.target.value as AllowancePeriod })}
                className={inputClass}
              >
                <option value="month">{t('admin.subsEveryMonth')}</option>
                <option value="once">{t('admin.subsOnce')}</option>
              </select>
            </Field>
            <Field label={t('admin.subsOrder')}>
              <input
                required
                inputMode="numeric"
                min={0}
                type="number"
                value={draft.sort_order}
                onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.subsSummary')} className="sm:col-span-2">
              <textarea
                required
                rows={2}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
            <Field label={t('admin.subsSpecs')} className="sm:col-span-2">
              <textarea
                required
                rows={5}
                value={draft.specs}
                onChange={(event) => setDraft({ ...draft, specs: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />
              {t('admin.subsBestValue')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
              {t('admin.subsPublished')}
            </label>
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-4 rounded-xl bg-moss-49 px-3 py-2 text-sm text-brand-strong">
              {notice}
            </p>
          ) : null}

          <button type="submit" className="btn-primary mt-5 h-11 justify-center px-5" disabled={save.isPending}>
            {save.isPending ? t('common.saving') : selectedId ? t('admin.subsSave') : t('admin.subsAdd')}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-2xl border border-sand-124 bg-ash-14 px-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-ash-573 uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function toDraft(plan: SubscriptionPlan): Draft {
  return {
    name: plan.name,
    price: String(plan.price),
    cadence: plan.cadence,
    token_allowance: String(plan.token_allowance),
    allowance_period: plan.allowance_period,
    summary: plan.summary,
    specs: plan.specs.join('\n'),
    featured: plan.featured,
    active: plan.active,
    sort_order: String(plan.sort_order),
  }
}
