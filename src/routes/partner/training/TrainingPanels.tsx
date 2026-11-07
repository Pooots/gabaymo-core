import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'

import { AnswerCard } from '../AnswerCard'
import type { useTrainingAnswers } from '@/queries/partner'
import { EvidenceSearch } from '@/components/portal/EvidenceSearch'
import { Banner, ErrorState, LoadingState } from '@/components/ui'
import { useI18n } from '@/i18n'
import { usePartnerKnowledge, useTrainingActions } from '@/queries/partner'

/** The latest four saved answers, editable in place. */
export function RecentAnswers({ answers }: { answers: ReturnType<typeof useTrainingAnswers> }) {
  const { t } = useI18n()
  const { update } = useTrainingActions()
  const rows = answers.data ?? []

  return (
    <section className="pt-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold">{t('partner.recentTitle')}</h2>
          <p className="mt-0.5 text-xs text-ash-573">{t('partner.recentDescription')}</p>
        </div>
        {rows.length > 0 ? (
          <Link to="/partner/answers" className="text-sm font-medium text-brand">
            {t('partner.viewAll')}
          </Link>
        ) : null}
      </div>
      {answers.isPending ? (
        <LoadingState rows={2} className="mt-3" />
      ) : answers.isError ? (
        <ErrorState
          className="mt-3"
          compact
          title={t('partner.answersLoadError')}
          error={answers.error}
          retrying={answers.isRefetching}
          onRetry={() => void answers.refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="mt-3 rounded-3xl border border-dashed border-sand-124 px-5 py-8 text-center text-sm text-ash-573">
          {t('partner.recentEmpty')}
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {rows.slice(0, 4).map((answer) => (
            <AnswerCard
              key={`${answer.id}-${answer.updatedAt ?? ''}`}
              answer={answer}
              onSave={(text) => update.mutateAsync({ id: answer.id, text })}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/** "Test as a member": search the approved documents the way a member would ask. */
export function TestTab() {
  const { t, tn } = useI18n()
  const knowledge = usePartnerKnowledge()
  const documents = useMemo(() => knowledge.data ?? [], [knowledge.data])
  const shelves = useMemo(() => [...new Set(documents.map((document) => document.category))].sort(), [documents])

  return (
    <>
      <Banner className="mb-4">
        {knowledge.data ? tn('partner.testBanner', documents.length) : t('partner.testBannerLoading')}
      </Banner>
      {knowledge.isError ? (
        <ErrorState
          className="mb-4"
          compact
          title={t('partner.knowledgeLoadError')}
          error={knowledge.error}
          retrying={knowledge.isRefetching}
          onRetry={() => void knowledge.refetch()}
        />
      ) : null}
      <EvidenceSearch
        documents={documents}
        shelves={shelves}
        loading={knowledge.isPending}
        emptyTitle={t('partner.testEmptyTitle')}
        emptyText={t('partner.testEmptyText')}
      />
    </>
  )
}
