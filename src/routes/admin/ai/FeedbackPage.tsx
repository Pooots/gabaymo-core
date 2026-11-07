import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { useAdminFormat } from '../modules/shared'
import type { Column } from '@/components/ui'
import type { FeedbackRow } from '@/services/adminOps'
import { DataTable, Frame, Pagination, StatusPill, Tabs } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useAiFeedback } from '@/queries/admin'

type Rating = '' | 'up' | 'down'

/** Answer excerpt for the table: drop the trailing "Sources:" list and show markers as [1]. */
export function cleanExcerpt(text: string): string {
  return (text.split(/\n\nSources:\n/)[0] ?? '')
    .replace(/\[S(\d+)(?:,[^\]]*)?\]?/g, '[$1]')
    .trim()
}

/** /admin/ai/feedback — every 👍/👎 members gave on sent answers, newest first. */
export function FeedbackPage() {
  const { t } = useI18n()
  const f = useAdminFormat()
  const [rating, setRating] = useState<Rating>('')
  const [page, setPage] = useState(1)
  const list = useAiFeedback({ page, rating })

  const columns: Array<Column<FeedbackRow>> = [
    {
      key: 'rating',
      header: t('adminOps.colRating'),
      className: 'whitespace-nowrap',
      cell: (row) =>
        row.rating === 'up' ? (
          <StatusPill tone="green">
            <ThumbsUp size={12} aria-hidden />
            {t('adminOps.thumbsUp')}
          </StatusPill>
        ) : (
          <StatusPill tone="red">
            <ThumbsDown size={12} aria-hidden />
            {t('adminOps.thumbsDown')}
          </StatusPill>
        ),
    },
    {
      key: 'question',
      header: t('adminOps.colQuestion'),
      cell: (row) => (
        <>
          <span className="line-clamp-2 block font-medium">{row.question ?? t('adminOps.questionRemoved')}</span>
          <span className="mt-1 line-clamp-2 block text-xs text-ash-573">{cleanExcerpt(row.message_excerpt)}</span>
        </>
      ),
    },
    { key: 'reason', header: t('adminOps.colReason'), cell: (row) => row.reason ?? <span className="text-ash-459">—</span> },
    { key: 'who', header: t('adminOps.colFrom'), className: 'whitespace-nowrap text-ash-573', cell: (row) => row.actor_type },
    { key: 'when', header: t('adminOps.colDate'), className: 'whitespace-nowrap text-ash-573', cell: (row) => f.dateTime(row.updated_at ?? row.created_at) },
  ]

  return (
    <Frame title={t('adminOps.feedbackPageTitle')} text={t('adminOps.feedbackPageText')}>
      <div className="mb-4">
        <Tabs<Rating>
          label={t('adminOps.colRating')}
          value={rating}
          onChange={(next) => {
            setRating(next)
            setPage(1)
          }}
          tabs={[
            { id: '', label: t('common.all') },
            { id: 'down', label: t('adminOps.thumbsDown') },
            { id: 'up', label: t('adminOps.thumbsUp') },
          ]}
        />
      </div>
      <DataTable
        columns={columns}
        rows={list.data?.data}
        rowKey={(row) => row.id}
        minWidth="min-w-[860px]"
        loading={list.isPending}
        error={list.data ? undefined : list.error}
        onRetry={() => void list.refetch()}
        empty={t('adminOps.feedbackEmpty')}
      />
      <Pagination meta={list.data?.meta} onPage={setPage} disabled={list.isFetching} />
    </Frame>
  )
}
