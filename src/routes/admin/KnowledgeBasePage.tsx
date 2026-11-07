import { useState } from 'react'
import { BookOpen, FileText, Plus, Search, Upload } from 'lucide-react'

import { LegalBadge, LifecycleBadge, RegionPills } from './knowledge/KnowledgeUi'
import { DocumentDetail } from './knowledge/DocumentDetail'
import { UploadDialog } from './knowledge/UploadDialog'
import { useKnowledgeLabels } from './knowledge/labels'
import type { DocumentFilters } from '@/services/ai'
import { Banner, Drawer, EmptyState, ErrorState, LoadingState, PageHeader, ProgressBar, Select, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocuments, useRegions } from '@/queries/adminKnowledge'
import { BUSY_STATUSES, formatDate, lifecycleLabels } from '@/services/ai'

const listGrid = 'md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_10rem_7rem]'

export function KnowledgeBasePage() {
  const { t, tn } = useI18n()
  const labels = useKnowledgeLabels()
  const [filters, setFilters] = useState<DocumentFilters>({ sort: 'uploaded_desc', page: 1, per_page: 20 })
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const query = useDocuments(filters)
  const regions = useRegions().data ?? []

  const rows = query.data?.data
  const meta = {
    last_page: query.data?.meta.last_page ?? 1,
    total: query.data?.meta.total ?? 0,
    status_counts: query.data?.meta.status_counts ?? {},
  }

  function setFilter(patch: DocumentFilters) {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }

  return (
    <div className="w-full">
      <PageHeader
        title={t('adminKnowledge.libraryTitle')}
        description={t('adminKnowledge.libraryDescription')}
        action={
          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              setNotice('')
              setUploading(true)
            }}
          >
            <Plus size={16} aria-hidden />
            {t('adminKnowledge.uploadDocument')}
          </button>
        }
      />

      <Banner className="mt-6">{t('adminKnowledge.lifecycleBanner')}</Banner>

      {notice ? (
        <p role="status" className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-brand-strong ring-1 ring-moss-128">
          {notice}
        </p>
      ) : null}

      <section className="mt-4 rounded-3xl border border-sand-86 bg-surface p-4">
        <form
          className="grid gap-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]"
          onSubmit={(e) => {
            e.preventDefault()
            setFilter({ q: search.trim() })
          }}
        >
          <label className="relative">
            <span className="sr-only">{t('common.search')}</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ash-447" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminKnowledge.librarySearchPlaceholder')} className={`${inputClass} pl-10`} />
          </label>
          <Select aria-label={t('adminKnowledge.status')} value={filters.status ?? ''} onChange={(e) => setFilter({ status: e.target.value })}>
            <option value="">{t('adminKnowledge.allStatuses')}</option>
            {Object.keys(lifecycleLabels).map((value) => (
              <option key={value} value={value}>
                {labels.lifecycle(value)}
                {meta.status_counts[value] ? ` (${meta.status_counts[value]})` : ''}
              </option>
            ))}
          </Select>
          <Select aria-label={t('adminKnowledge.region')} value={filters.region ?? ''} onChange={(e) => setFilter({ region: e.target.value })}>
            <option value="">{t('adminKnowledge.allRegions')}</option>
            <option value="national">{t('adminKnowledge.national')}</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name} ({r.code})
              </option>
            ))}
          </Select>
          <Select aria-label={t('adminKnowledge.type')} value={filters.document_type ?? ''} onChange={(e) => setFilter({ document_type: e.target.value })}>
            <option value="">{t('adminKnowledge.allTypes')}</option>
            {labels.documentTypes.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <Select aria-label={t('adminKnowledge.sort')} value={filters.sort ?? 'uploaded_desc'} onChange={(e) => setFilter({ sort: e.target.value })}>
            <option value="uploaded_desc">{t('adminKnowledge.sortNewest')}</option>
            <option value="uploaded_asc">{t('adminKnowledge.sortOldest')}</option>
            <option value="updated_desc">{t('adminKnowledge.sortChanged')}</option>
            <option value="title">{t('adminKnowledge.sortTitle')}</option>
          </Select>
          <div className="flex flex-wrap items-center gap-2 md:col-span-5">
            <span className="text-xs text-ash-573">{t('adminKnowledge.uploaded')}</span>
            <input type="date" aria-label={t('adminKnowledge.dateFrom')} className={`${inputClass} h-9 w-40`} value={filters.date_from ?? ''} onChange={(e) => setFilter({ date_from: e.target.value })} />
            <span className="text-xs text-ash-573">{t('adminKnowledge.dateTo')}</span>
            <input type="date" aria-label={t('adminKnowledge.dateToLabel')} className={`${inputClass} h-9 w-40`} value={filters.date_to ?? ''} onChange={(e) => setFilter({ date_to: e.target.value })} />
            <input
              aria-label={t('adminKnowledge.partnerId')}
              inputMode="numeric"
              placeholder={t('adminKnowledge.partnerIdPlaceholder')}
              className={`${inputClass} h-9 w-28`}
              value={filters.partner_id ?? ''}
              onChange={(e) => setFilter({ partner_id: e.target.value.replace(/\D/g, '') })}
            />
            <button type="submit" className={`${secondaryButton} h-9`}>
              {t('adminKnowledge.apply')}
            </button>
            <span className="ml-auto text-xs text-ash-573">{tn('adminKnowledge.documentCount', meta.total)}</span>
          </div>
        </form>
      </section>

      {query.isError && rows ? (
        <ErrorState compact className="mt-4" error={query.error} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
      ) : null}

      <section className="mt-4 overflow-hidden rounded-3xl border border-sand-86 bg-surface">
        {query.isPending ? (
          <LoadingState className="p-4" rows={5} label={t('adminKnowledge.documentsLoading')} />
        ) : !rows ? (
          <ErrorState error={query.error} title={t('adminKnowledge.libraryLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('adminKnowledge.noDocumentsMatch')}
            action={
              <button type="button" className={primaryButton} onClick={() => setUploading(true)}>
                <Upload size={16} aria-hidden /> {t('adminKnowledge.uploadADocument')}
              </button>
            }
          >
            {t('adminKnowledge.noDocumentsHelp')}
          </EmptyState>
        ) : (
          <>
            <div className={`hidden gap-4 border-b border-sand-73 px-6 py-3 text-[11px] font-medium tracking-wide text-ash-447 uppercase md:grid ${listGrid}`} aria-hidden>
              <span>{t('adminKnowledge.colDocument')}</span>
              <span>{t('adminKnowledge.colAppliesTo')}</span>
              <span>{t('adminKnowledge.colStatus')}</span>
              <span className="text-right">{t('adminKnowledge.colUploaded')}</span>
            </div>
            <ul>
              {rows.map((doc) => {
                const v = doc.current_version
                const isBusy = BUSY_STATUSES.includes(doc.lifecycle_status)
                return (
                  <li key={doc.id} className="border-b border-sand-59 last:border-0">
                    <button
                      type="button"
                      className={`grid w-full gap-2 px-4 py-4 text-left transition hover:bg-ash-24 sm:px-6 md:items-center md:gap-4 ${listGrid}`}
                      onClick={() => setOpenId(doc.id)}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-53 text-muted">
                          <FileText size={16} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{doc.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-ash-573">
                            {labels.documentType(doc.document_type, doc.document_type_label)}
                            {doc.document_number ? ` · ${doc.document_number}` : ''}
                            {v ? ` · v${v.version_number} · ${v.extension.toUpperCase()}${v.page_count ? ` · ${tn('adminKnowledge.pageCount', v.page_count)}` : ''}` : ''}
                            {v && v.warnings_count > 0 ? ` · ⚠ ${v.warnings_count}` : ''}
                          </span>
                        </span>
                      </span>
                      <span className="pl-12 md:pl-0">
                        <RegionPills document={doc} />
                      </span>
                      <span className="space-y-1 pl-12 md:pl-0">
                        <span className="flex flex-wrap gap-1">
                          <LifecycleBadge status={doc.lifecycle_status} />
                          <LegalBadge status={doc.legal_status} />
                        </span>
                        {isBusy && v ? <ProgressBar value={v.processing_progress} /> : null}
                      </span>
                      <span className="hidden text-right text-xs text-ash-447 md:block">{formatDate(doc.created_at)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {meta.last_page > 1 ? (
              <nav aria-label={t('adminKnowledge.pagination')} className="flex items-center justify-between gap-2 border-t border-sand-73 px-4 py-3 text-sm sm:px-6">
                <button
                  type="button"
                  className={`${secondaryButton} h-9`}
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
                >
                  {t('adminKnowledge.previous')}
                </button>
                <span className="text-xs text-ash-573">{t('adminKnowledge.pageOf', { page: filters.page ?? 1, total: meta.last_page })}</span>
                <button
                  type="button"
                  className={`${secondaryButton} h-9`}
                  disabled={(filters.page ?? 1) >= meta.last_page}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                >
                  {t('adminKnowledge.next')}
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>

      {uploading ? (
        <UploadDialog
          regions={regions}
          onClose={() => setUploading(false)}
          onUploaded={(doc) => {
            setUploading(false)
            setNotice(t('adminKnowledge.uploadedNotice', { title: doc.title }))
            setOpenId(doc.id)
          }}
        />
      ) : null}

      {openId ? (
        <Drawer title={t('adminKnowledge.documentDrawerTitle')} onClose={() => setOpenId(null)} wide>
          <DocumentDetail documentId={openId} mode="library" />
        </Drawer>
      ) : null}
    </div>
  )
}
