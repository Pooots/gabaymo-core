import { useState } from 'react'
import { Search, Sparkles, ThumbsDown } from 'lucide-react'

import { DraftPanel } from './ai-review/DraftPanel'
import { statusTabs } from './ai-review/reasons'
import { useKnowledgeLabels } from './knowledge/labels'
import type { StatusTab } from './ai-review/reasons'
import { Banner, Card, EmptyState, ErrorState, LoadingState, PageHeader, Select, StatusPill, Tabs, inputClass } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDrafts } from '@/queries/adminKnowledge'
import { answerTone, formatDate } from '@/services/ai'

export function AiReviewPage() {
  const { t, intl } = useI18n()
  const labels = useKnowledgeLabels()
  const [tab, setTab] = useState<StatusTab>('open')
  const [assigned, setAssigned] = useState<'any' | 'me' | 'unassigned'>('any')
  const [priority, setPriority] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const query = useDrafts({ status: tab, assigned, priority, q: search })
  const counts = query.data?.meta.counts ?? {}
  const rows = query.data?.data

  const count = (keys: Array<string>) => keys.reduce((sum, k) => sum + (counts[k] ?? 0), 0)

  return (
    <div className="w-full">
      <PageHeader title={t('adminKnowledge.aiReviewTitle')} description={t('adminKnowledge.aiReviewDescription')} />

      {notice ? (
        <div role="status">
          <Banner className="mt-6">{notice}</Banner>
        </div>
      ) : null}

      <div className="relative mt-6 max-w-full overflow-x-auto">
        <Tabs<StatusTab>
          value={tab}
          label={t('adminKnowledge.reviewStatus')}
          onChange={(next) => {
            setTab(next)
            setSelected(null)
          }}
          tabs={statusTabs.map((s) => ({ id: s.id, label: t(s.label), count: count(s.keys) }))}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="relative w-full sm:w-72"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(q.trim())
          }}
        >
          <Search size={14} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ash-447" />
          <input
            value={q}
            aria-label={t('adminKnowledge.searchQuestions')}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('adminKnowledge.searchQuestions')}
            className={`${inputClass} h-10 pl-9`}
          />
        </form>
        <div className="w-40">
          <Select aria-label={t('adminKnowledge.assigned')} value={assigned} onChange={(e) => setAssigned(e.target.value as typeof assigned)} className="h-10">
            <option value="any">{t('adminKnowledge.assignedAnyone')}</option>
            <option value="me">{t('adminKnowledge.assignedMe')}</option>
            <option value="unassigned">{t('adminKnowledge.unassigned')}</option>
          </Select>
        </div>
        <div className="w-36">
          <Select aria-label={t('adminKnowledge.priority')} value={priority} onChange={(e) => setPriority(e.target.value)} className="h-10">
            <option value="">{t('adminKnowledge.anyPriority')}</option>
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                {t('adminKnowledge.priorityN', { priority: p })}
              </option>
            ))}
          </Select>
        </div>
        <span className="ml-auto text-[11px] text-ash-447">
          {query.dataUpdatedAt ? t('adminKnowledge.updatedAt', { time: new Date(query.dataUpdatedAt).toLocaleTimeString(intl) }) : ''} · {t('adminKnowledge.refreshesEvery')}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          {query.isError ? (
            <ErrorState compact className="m-3" error={query.error} title={t('adminKnowledge.queueLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
          ) : null}
          {query.isPending ? (
            <LoadingState className="p-3" />
          ) : !rows ? null : rows.length === 0 ? (
            <p className="px-6 py-10 text-center text-xs text-ash-573">{t('adminKnowledge.noAnswersInList')}</p>
          ) : (
            <ul className="max-h-[44rem] overflow-y-auto">
              {rows.map((row) => (
                <li key={row.id} className="border-b border-sand-59 last:border-0">
                  <button
                    type="button"
                    aria-current={selected === row.id ? 'true' : undefined}
                    onClick={() => {
                      setSelected(row.id)
                      setNotice('')
                    }}
                    className={`w-full space-y-1.5 px-4 py-3 text-left transition ${selected === row.id ? 'bg-moss-53 shadow-[inset_3px_0_0_var(--c-brand)]' : 'hover:bg-ash-24'}`}
                  >
                    <span className="line-clamp-2 block text-sm font-medium">{row.question?.text ?? t('adminKnowledge.questionRemoved')}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={answerTone(row.answer_status)} dot>
                        {labels.answerStatus(row.answer_status)}
                      </StatusPill>
                      {row.risk_level === 'high' ? <StatusPill tone="red">{t('adminKnowledge.highRisk')}</StatusPill> : null}
                      {row.feedback?.has_down ? (
                        <span title={t('adminOps.feedbackCounts', { up: row.feedback.up, down: row.feedback.down })}>
                          <StatusPill tone="red">
                            <ThumbsDown size={11} aria-hidden />
                            {t('adminOps.feedbackBadge', { up: row.feedback.up, down: row.feedback.down })}
                          </StatusPill>
                        </span>
                      ) : null}
                      <span className="text-[11px] text-ash-447">
                        P{row.priority} · {row.question?.region_code ?? t('adminKnowledge.noRegion')} · {formatDate(row.created_at, true)}
                      </span>
                    </span>
                    <span className="block text-[11px] text-ash-447">
                      {row.assigned_reviewer_name ? t('adminKnowledge.assignedTo', { name: row.assigned_reviewer_name }) : t('adminKnowledge.unassigned')}
                      {row.revision > 1 ? ` · ${t('adminKnowledge.revisionN', { revision: row.revision })}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {selected ? (
            <DraftPanel
              key={selected}
              id={selected}
              onChanged={(message, nextId) => {
                setNotice(message)
                if (nextId) setSelected(nextId)
              }}
            />
          ) : (
            <EmptyState icon={Sparkles} title={t('adminKnowledge.selectAnswer')} className="py-16">
              {t('adminKnowledge.selectAnswerHelp')}
            </EmptyState>
          )}
        </Card>
      </div>
    </div>
  )
}
