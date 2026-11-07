import { useCallback, useEffect, useRef, useState } from 'react'

import { LegalBadge, LifecycleBadge, RegionPills } from './KnowledgeUi'
import { ApplicabilityPanel } from './document/Applicability'
import { ChunkList } from './document/ChunkList'
import { Overview } from './document/Overview'
import { PublishFailure } from './document/PublishFailure'
import { Relations } from './document/Relations'
import { TextPreview } from './document/TextPreview'
import { VersionList } from './document/VersionList'
import type { ReactNode } from 'react'
import type { DocumentDetail as Detail } from '@/services/ai'
import { Banner, ErrorState, LoadingState, ProgressBar, StatusPill, Tabs } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocument, useInvalidateDocumentLists, useInvalidateDocuments } from '@/queries/adminKnowledge'
import { BUSY_STATUSES, formatDate } from '@/services/ai'

export { MetadataFields } from './document/MetadataFields'

type TabId = 'overview' | 'text' | 'regions' | 'chunks' | 'versions' | 'relations'

/**
 * One knowledge document: status, processing progress and the tabbed
 * viewer/editors. Polls while background jobs run (see useDocument).
 */
export function DocumentDetail({
  documentId,
  mode,
  onChanged,
  renderActions,
}: {
  documentId: string
  mode: 'library' | 'review'
  onChanged?: () => void
  renderActions?: (detail: Detail, reload: () => Promise<void>) => ReactNode
}) {
  const { t } = useI18n()
  const query = useDocument(documentId)
  const invalidate = useInvalidateDocuments()
  const invalidateLists = useInvalidateDocumentLists()
  const [tab, setTab] = useState<TabId>(mode === 'review' ? 'text' : 'overview')
  const detail = query.data

  const reload = useCallback(async () => {
    await invalidate()
    onChanged?.()
  }, [invalidate, onChanged])

  // While a job runs, each poll (and the one that sees it finish) also
  // refreshes the lists that show this document.
  const busy = detail ? BUSY_STATUSES.includes(detail.document.lifecycle_status) : false
  const wasBusy = useRef(false)
  const onChangedRef = useRef(onChanged)
  useEffect(() => {
    onChangedRef.current = onChanged
  }, [onChanged])
  useEffect(() => {
    if (busy || wasBusy.current) {
      void invalidateLists()
      onChangedRef.current?.()
    }
    wasBusy.current = busy
  }, [busy, query.dataUpdatedAt, invalidateLists])

  if (query.isPending) return <LoadingState className="p-6" label={t('adminKnowledge.docLoading')} />
  if (query.isError || !detail) {
    return <ErrorState error={query.error} title={t('adminKnowledge.docLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
  }

  const doc = detail.document
  const version = detail.current_version

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <LifecycleBadge status={doc.lifecycle_status} />
        <LegalBadge status={doc.legal_status} />
        <RegionPills document={doc} />
        {detail.published_version && version && detail.published_version.id !== version.id ? (
          <StatusPill tone="gray">{t('adminKnowledge.docLiveVersion', { live: detail.published_version.version_number, editing: version.version_number })}</StatusPill>
        ) : null}
      </div>

      {busy && version ? (
        <ProgressBar value={version.processing.progress} label={t('adminKnowledge.docProcessing', { status: version.processing.status, progress: version.processing.progress })} />
      ) : null}
      {version?.processing.error ? <Banner tone="warning">{version.processing.error}</Banner> : null}
      {version?.publication.status === 'failed' ? <PublishFailure documentId={doc.id} error={version.publication.error ?? null} onRetried={reload} /> : null}
      {detail.relations.newer.length > 0 ? (
        <Banner tone="warning">
          {detail.relations.newer
            .map((n) => {
              const by = n.document_number ?? n.title
              const text =
                n.relation === 'amends'
                  ? t('adminKnowledge.docAmendedBy', { by })
                  : n.relation === 'revokes'
                    ? t('adminKnowledge.docRevokedBy', { by })
                    : t('adminKnowledge.docSupersededBy', { by })
              return n.effective_date ? `${text} ${t('adminKnowledge.docEffectiveParen', { date: formatDate(n.effective_date) })}` : text
            })
            .join(' · ')}
          {t('adminKnowledge.docOutdatedNote')}
        </Banner>
      ) : null}

      {renderActions ? renderActions(detail, reload) : null}

      <div className="relative max-w-full overflow-x-auto">
        <Tabs<TabId>
          value={tab}
          onChange={setTab}
          label={t('adminKnowledge.docTabsLabel')}
          tabs={[
            { id: 'overview', label: t('adminKnowledge.docTabOverview') },
            { id: 'text', label: t('adminKnowledge.docTabText'), count: version?.processing.summary?.page_count },
            { id: 'regions', label: t('adminKnowledge.docTabRegions') },
            { id: 'chunks', label: t('adminKnowledge.docTabChunks') },
            { id: 'versions', label: t('adminKnowledge.docTabVersions') },
            { id: 'relations', label: t('adminKnowledge.docTabRelations') },
          ]}
        />
      </div>

      <div role="tabpanel">
        {!version ? null : tab === 'overview' ? (
          <Overview detail={detail} version={version} mode={mode} onChanged={reload} />
        ) : tab === 'text' ? (
          <TextPreview documentId={doc.id} version={version} onChanged={reload} />
        ) : tab === 'regions' ? (
          <ApplicabilityPanel documentId={doc.id} version={version} onChanged={reload} />
        ) : tab === 'chunks' ? (
          <ChunkList documentId={doc.id} versionId={version.id} />
        ) : tab === 'versions' ? (
          <VersionList documentId={doc.id} />
        ) : (
          <Relations detail={detail} onChanged={reload} />
        )}
      </div>
    </div>
  )
}
