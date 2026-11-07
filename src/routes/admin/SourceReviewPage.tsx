import { useState } from 'react'
import { FileCheck2 } from 'lucide-react'

import { LifecycleBadge, RegionPills } from './knowledge/KnowledgeUi'
import { DocumentDetail } from './knowledge/DocumentDetail'
import { ReviewPanel } from './knowledge/ReviewPanel'
import { useKnowledgeLabels } from './knowledge/labels'
import { Banner, Card, EmptyState, ErrorState, LoadingState, PageHeader, SectionLabel, Tabs } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useReviewQueue } from '@/queries/adminKnowledge'
import { formatDate } from '@/services/ai'

type Queue = 'waiting' | 'returned' | 'approved'

export function SourceReviewPage() {
  const { t } = useI18n()
  const labels = useKnowledgeLabels()
  const [queue, setQueue] = useState<Queue>('waiting')
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const query = useReviewQueue(queue)
  const counts = query.data?.meta.counts ?? {}
  const rows = query.data?.data

  const queues: Array<{ id: Queue; label: string; count: number }> = [
    { id: 'waiting', label: t('adminKnowledge.queueWaiting'), count: counts.waiting ?? 0 },
    { id: 'returned', label: t('adminKnowledge.queueReturned'), count: counts.returned ?? 0 },
    { id: 'approved', label: t('adminKnowledge.queueApproved'), count: counts.approved ?? 0 },
  ]

  return (
    <div className="w-full">
      <PageHeader title={t('adminKnowledge.sourceReviewTitle')} description={t('adminKnowledge.sourceReviewDescription')} />

      {notice ? (
        <div role="status">
          <Banner className="mt-6">{notice}</Banner>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-sand-73 px-4 pt-4 pb-3">
            <SectionLabel>{t('adminKnowledge.documents')}</SectionLabel>
            <div className="mt-3">
              <Tabs<Queue>
                value={queue}
                label={t('adminKnowledge.reviewQueues')}
                onChange={(next) => {
                  setQueue(next)
                  setSelected(null)
                }}
                tabs={queues}
              />
            </div>
          </div>
          {query.isPending ? (
            <LoadingState className="p-4" />
          ) : query.isError || !rows ? (
            <ErrorState compact className="m-4" error={query.error} title={t('adminKnowledge.reviewQueueLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
          ) : rows.length === 0 ? (
            <p className="px-6 py-10 text-center text-xs leading-relaxed text-ash-573">
              {queue === 'waiting' ? t('adminKnowledge.nothingWaiting') : t('adminKnowledge.noQueueDocuments', { queue: queues.find((q) => q.id === queue)?.label.toLowerCase() ?? queue })}
            </p>
          ) : (
            <ul className="max-h-[40rem] overflow-y-auto">
              {rows.map((doc) => (
                <li key={doc.id} className="border-b border-sand-59 last:border-0">
                  <button
                    type="button"
                    aria-current={selected === doc.id ? 'true' : undefined}
                    className={`w-full space-y-1 px-4 py-3 text-left transition ${selected === doc.id ? 'bg-moss-53 shadow-[inset_3px_0_0_var(--c-brand)]' : 'hover:bg-ash-24'}`}
                    onClick={() => {
                      setSelected(doc.id)
                      setNotice('')
                    }}
                  >
                    <span className="block truncate text-sm font-medium">{doc.title}</span>
                    <span className="block truncate text-xs text-ash-573">
                      {doc.document_number ?? labels.documentType(doc.document_type, doc.document_type_label)} · {t('adminKnowledge.uploadedOn', { date: formatDate(doc.created_at) })}
                    </span>
                    <span className="flex flex-wrap items-center gap-1">
                      <RegionPills document={doc} />
                      <LifecycleBadge status={doc.lifecycle_status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {selected ? (
            <DocumentDetail
              key={selected}
              documentId={selected}
              mode="review"
              renderActions={(detail, reload) => (
                <ReviewPanel
                  detail={detail}
                  onDone={async (message) => {
                    setNotice(message)
                    await reload()
                  }}
                />
              )}
            />
          ) : (
            <EmptyState icon={FileCheck2} title={t('adminKnowledge.selectDocument')} className="py-16">
              {t('adminKnowledge.selectDocumentHelp')}
            </EmptyState>
          )}
        </Card>
      </div>
    </div>
  )
}
