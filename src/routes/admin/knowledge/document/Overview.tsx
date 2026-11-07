import { useState } from 'react'
import { Download, Pencil, RefreshCw } from 'lucide-react'

import { useKnowledgeLabels } from '../labels'
import { ArchiveDialog } from './ArchiveDialog'
import { MetadataDialog } from './MetadataDialog'
import { RevisionDialog } from './RevisionDialog'
import type { ReactNode } from 'react'
import type { DocumentDetail as Detail, VersionDetail } from '@/services/ai'
import { Banner, ErrorNote, ProgressBar, SectionLabel, StatusPill, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocumentAction } from '@/queries/adminKnowledge'
import { aiError, formatDate, originalFileUrl } from '@/services/ai'

type ActionName = 'reprocess' | 'submit' | 'archive' | 'retry-publish'

export function Overview({
  detail,
  version,
  mode,
  onChanged,
}: {
  detail: Detail
  version: VersionDetail
  mode: 'library' | 'review'
  onChanged: () => Promise<void>
}) {
  const { t } = useI18n()
  const labels = useKnowledgeLabels()
  const doc = detail.document
  const summary = version.processing.summary
  const action = useDocumentAction()
  const [editing, setEditing] = useState(false)
  const [revision, setRevision] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState('')
  const pending = action.isPending

  async function act(name: ActionName, body: Record<string, unknown> = {}) {
    setError('')
    try {
      await action.mutateAsync({ id: doc.id, action: name, body })
      await onChanged()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.actionFailed')))
    }
  }

  async function download() {
    try {
      const url = await originalFileUrl(doc.id, version.id)
      const link = document.createElement('a')
      link.href = url
      link.download = version.original_filename
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.downloadFailed')))
    }
  }

  const blocking = detail.readiness.filter((r) => r.blocking)
  const advisories = detail.readiness.filter((r) => !r.blocking)
  const m = version.metadata
  const completeness = Math.round((summary?.completeness ?? 0) * 100)

  return (
    <div className="space-y-5">
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} onClick={() => void download()}>
          <Download size={16} aria-hidden /> {t('adminKnowledge.originalFile')}
        </button>
        {mode === 'library' ? (
          <>
            <button type="button" className={secondaryButton} onClick={() => setEditing(true)}>
              <Pencil size={16} aria-hidden /> {t('adminKnowledge.editMetadata')}
            </button>
            <button type="button" className={secondaryButton} disabled={pending} onClick={() => setRevision(true)}>
              {t('adminKnowledge.uploadNewVersion')}
            </button>
            {version.processing.status === 'failed' || version.processing.status === 'ready' ? (
              <button type="button" className={secondaryButton} disabled={pending} onClick={() => void act('reprocess', { note: 'Retry from Knowledge Library' })}>
                <RefreshCw size={16} aria-hidden /> {version.processing.status === 'failed' ? t('adminKnowledge.retryProcessing') : t('adminKnowledge.reExtract')}
              </button>
            ) : null}
            {['returned', 'draft'].includes(version.review.status) && version.processing.status === 'ready' ? (
              <button type="button" className={primaryButton} disabled={pending} onClick={() => void act('submit')}>
                {t('adminKnowledge.resubmit')}
              </button>
            ) : null}
            {!doc.lifecycle_status.startsWith('archived') ? (
              <button type="button" className={secondaryButton} disabled={pending} onClick={() => setArchiving(true)}>
                {t('adminKnowledge.archive')}
              </button>
            ) : null}
          </>
        ) : (
          <button type="button" className={secondaryButton} disabled={pending} onClick={() => void act('reprocess', { note: 'Re-extraction requested in Source Review', ocr: true })}>
            <RefreshCw size={16} aria-hidden /> {t('adminKnowledge.requestReExtraction')}
          </button>
        )}
        {doc.lifecycle_status === 'index_failed' ? (
          <button type="button" className={primaryButton} disabled={pending} onClick={() => void act('retry-publish')}>
            {t('adminKnowledge.retryPublishing')}
          </button>
        ) : null}
      </div>

      {version.review.note ? (
        <Banner tone={version.review.status === 'returned' ? 'warning' : 'muted'}>{t('adminKnowledge.reviewerNote', { note: version.review.note })}</Banner>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-sand-73 bg-surface p-4 text-sm">
          <SectionLabel>{t('adminKnowledge.metadataVersion', { version: version.version_number })}</SectionLabel>
          <Meta label={t('adminKnowledge.metaTitle')} value={m.title} />
          <Meta label={t('adminKnowledge.metaType')} value={labels.documentType(m.document_type)} />
          <Meta label={t('adminKnowledge.metaNumber')} value={m.document_number} />
          <Meta label={t('adminKnowledge.metaIssuingAuthority')} value={m.issuing_authority} />
          <Meta label={t('adminKnowledge.metaIssuingOffice')} value={m.issuing_office as string | null} />
          <Meta label={t('adminKnowledge.metaShelf')} value={m.category as string | null} />
          <Meta label={t('adminKnowledge.metaPublished')} value={formatDate(m.publication_date as string | null)} />
          <Meta label={t('adminKnowledge.metaEffective')} value={formatDate(m.effectivity_date as string | null)} />
          <Meta label={t('adminKnowledge.metaExpires')} value={formatDate(m.expiration_date as string | null)} />
          <Meta
            label={t('adminKnowledge.metaVisibility')}
            value={`${String(m.visibility).replace(/_/g, ' ')}${m.owner_partner_id ? ` · ${t('adminKnowledge.partnerNumber', { id: String(m.owner_partner_id) })}` : ''}`}
          />
          <Meta
            label={t('adminKnowledge.metaSourceUrl')}
            value={
              m.source_url ? (
                <a className="text-brand underline" href={m.source_url} target="_blank" rel="noreferrer noopener">
                  {m.source_url}
                </a>
              ) : null
            }
          />
          <Meta label={t('adminKnowledge.metaFile')} value={t('adminKnowledge.fileSizeKb', { name: version.original_filename, size: (version.file_size / 1024).toFixed(0) })} />
          <Meta label={t('adminKnowledge.metaUploadedBy')} value={`${version.uploaded_by_name ?? '—'} · ${formatDate(version.created_at, true)}`} />
        </div>
        <div className="space-y-3 rounded-2xl border border-sand-73 bg-surface p-4 text-sm">
          <SectionLabel>{t('adminKnowledge.extraction')}</SectionLabel>
          {summary ? (
            <>
              <ProgressBar
                value={completeness}
                label={`${t('adminKnowledge.pagesReadable', { readable: summary.readable_pages ?? 0, total: summary.page_count ?? 0, percent: completeness })}${summary.ocr_pages ? ` · ${t('adminKnowledge.ocrPages', { count: summary.ocr_pages })}` : ''}`}
              />
              {summary.pages_needing_ocr ? <p className="text-xs text-honey-694">{t('adminKnowledge.pagesNeedingOcr', { count: summary.pages_needing_ocr })}</p> : null}
              {(summary.warnings ?? []).map((w) => (
                <p key={w} className="text-xs text-honey-694">
                  ⚠ {w.replace(/_/g, ' ')}
                </p>
              ))}
            </>
          ) : (
            <p className="text-xs text-ash-573">{t('adminKnowledge.notExtracted')}</p>
          )}
          <SectionLabel>{t('adminKnowledge.processingSteps')}</SectionLabel>
          <ul className="space-y-1">
            {(version.processing.jobs ?? []).map((job, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="capitalize">{job.stage}</span>
                <StatusPill tone={job.status === 'succeeded' ? 'green' : job.status === 'failed' ? 'red' : 'amber'}>{job.status}</StatusPill>
              </li>
            ))}
          </ul>
          <SectionLabel>{t('adminKnowledge.approvalReadiness')}</SectionLabel>
          {blocking.length === 0 ? (
            <p className="text-xs text-brand-strong">{t('adminKnowledge.noBlockingIssues')}</p>
          ) : (
            <ul className="space-y-1">
              {blocking.map((r) => (
                <li key={r.code} className="text-xs text-rust-620">
                  • {r.message}
                </li>
              ))}
            </ul>
          )}
          {advisories.map((r) => (
            <p key={r.code} className="text-xs text-honey-694">
              • {r.message}
            </p>
          ))}
        </div>
      </div>

      {editing ? (
        <MetadataDialog
          documentId={doc.id}
          version={version}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false)
            await onChanged()
          }}
        />
      ) : null}
      {revision ? (
        <RevisionDialog
          document={doc}
          onClose={() => setRevision(false)}
          onSaved={async () => {
            setRevision(false)
            await onChanged()
          }}
        />
      ) : null}
      {archiving ? (
        <ArchiveDialog
          pending={pending}
          onClose={() => setArchiving(false)}
          onConfirm={async (reason) => {
            setArchiving(false)
            await act('archive', { reason })
          }}
        />
      ) : null}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
      <span className="text-xs text-ash-447">{label}</span>
      <span className="min-w-0 break-words text-[13px] text-ash-890">{value || '—'}</span>
    </div>
  )
}
