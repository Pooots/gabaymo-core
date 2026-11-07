import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { NotebookPen, Search } from 'lucide-react'

import { AnswerCard } from './AnswerCard'
import { EmptyState, ErrorState, LoadingState, PageHeader, primaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useTrainingActions, useTrainingAnswers } from '@/queries/partner'

export function PartnerAnswers() {
  const { t } = useI18n()
  // Re-reads the list while any answer is still being embedded.
  const answers = useTrainingAnswers()
  const { update, remove } = useTrainingActions()
  const [query, setQuery] = useState('')

  const rows = answers.data ?? []
  const needle = query.trim().toLowerCase()
  const visible = rows.filter(
    (item) => !needle || [item.question, item.answer, item.source.title].some((value) => value.toLowerCase().includes(needle)),
  )

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <PageHeader eyebrow={t('partner.trainingEyebrow')} title={t('partner.navAnswers')} description={t('partner.answersDescription')} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex h-11 w-full max-w-sm items-center gap-2 rounded-full border border-sand-86 bg-surface px-4 text-sm">
          <Search size={16} className="text-ash-459" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('partner.answersSearch')}
            aria-label={t('partner.answersSearch')}
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ash-459"
          />
        </label>
        <span className="text-xs text-ash-573">{answers.data ? t('partner.answersCount', { count: rows.length }) : ''}</span>
      </div>

      <div className="mt-4">
        {answers.isPending ? (
          <LoadingState rows={4} />
        ) : answers.isError ? (
          <ErrorState
            compact
            title={t('partner.answersLoadError')}
            error={answers.error}
            retrying={answers.isRefetching}
            onRetry={() => void answers.refetch()}
          />
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-sand-86 bg-surface">
            <EmptyState
              icon={NotebookPen}
              title={t('partner.answersEmptyTitle')}
              action={
                <Link to="/partner/train" className={primaryButton}>
                  {t('partner.openTrain')}
                </Link>
              }
            >
              {t('partner.answersEmptyBody')}
            </EmptyState>
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-3xl border border-sand-86 bg-surface px-6 py-14 text-center text-sm text-ash-573">
            {t('partner.answersNoMatch')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {visible.map((answer) => (
              <AnswerCard
                key={`${answer.id}-${answer.updatedAt ?? ''}`}
                answer={answer}
                onSave={(text) => update.mutateAsync({ id: answer.id, text })}
                onDelete={() => remove.mutateAsync(answer.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
