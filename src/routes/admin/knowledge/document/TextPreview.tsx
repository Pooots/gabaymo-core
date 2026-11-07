import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react'

import type { PageRow, VersionDetail } from '@/services/ai'
import { Banner, ErrorNote, ErrorState, Highlighted, IconButton, LoadingState, Select, StatusPill, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useCorrectPage, useDocumentPages } from '@/queries/adminKnowledge'
import { aiError, originalFileUrl } from '@/services/ai'

const pagerButton = 'grid h-9 w-9 place-items-center rounded-full ring-1 ring-sand-124 disabled:opacity-40'

/** Page-by-page extracted text with search, highlights, compare-with-original and corrections. */
export function TextPreview({ documentId, version, onChanged }: { documentId: string; version: VersionDetail; onChanged: () => Promise<void> }) {
  const { t } = useI18n()
  const query = useDocumentPages(documentId, version.id)

  if (query.isPending) return <LoadingState className="py-6" label={t('adminKnowledge.pagesLoading')} />
  if (query.isError) {
    return <ErrorState compact error={query.error} title={t('adminKnowledge.pagesLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
  }
  if (query.data.length === 0) return <p className="py-10 text-center text-sm text-ash-573">{t('adminKnowledge.noTextYet')}</p>
  return <PageViewer documentId={documentId} version={version} pages={query.data} onChanged={onChanged} />
}

function PageViewer({ documentId, version, pages, onChanged }: { documentId: string; version: VersionDetail; pages: Array<PageRow>; onChanged: () => Promise<void> }) {
  const { t } = useI18n()
  const correct = useCorrectPage()
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [showOriginal, setShowOriginal] = useState(false)
  const [compare, setCompare] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(
    () => () => {
      if (compare) URL.revokeObjectURL(compare)
    },
    [compare],
  )

  const matches = useMemo(() => {
    if (!search.trim()) return []
    const q = search.trim().toLowerCase()
    return pages.filter((p) => p.text.toLowerCase().includes(q)).map((p) => p.page_number)
  }, [pages, search])

  const page = pages[Math.min(index, pages.length - 1)]
  if (!page) return null
  const pageNumber = page.page_number
  const shown = showOriginal && page.extracted_text !== null ? page.extracted_text : page.text
  const terms = [
    ...page.highlights.regions.map((v) => ({ value: v, className: 'bg-sea-73 text-sea-671' })),
    ...page.highlights.document_numbers.map((v) => ({ value: v, className: 'bg-honey-233 text-honey-735' })),
    ...page.highlights.dates.map((v) => ({ value: v, className: 'bg-iris-82 text-iris-651' })),
    ...(search.trim() ? [{ value: search.trim(), className: 'bg-moss-100 text-moss-849 ring-1 ring-brand' }] : []),
  ]

  async function openCompare() {
    if (compare) {
      setCompare(null)
      return
    }
    try {
      setCompare(await originalFileUrl(documentId, version.id))
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.openOriginalFailed')))
    }
  }

  async function saveCorrection() {
    setError('')
    try {
      await correct.mutateAsync({ id: documentId, page: pageNumber, text, note })
      setEditing(false)
      setNote('')
      await onChanged()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.correctionFailed')))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label={t('adminKnowledge.previousPage')} className={pagerButton} disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ChevronLeft size={16} aria-hidden />
        </IconButton>
        <Select aria-label={t('adminKnowledge.pageSelect')} value={String(index)} onChange={(e) => setIndex(Number(e.target.value))} className="h-9 w-32">
          {pages.map((p, i) => (
            <option key={p.page_number} value={i}>
              {t('adminKnowledge.pageNumber', { page: p.page_number })}
              {p.needs_ocr ? ' ⚠' : ''}
            </option>
          ))}
        </Select>
        <IconButton label={t('adminKnowledge.nextPage')} className={pagerButton} disabled={index >= pages.length - 1} onClick={() => setIndex(index + 1)}>
          <ChevronRight size={16} aria-hidden />
        </IconButton>
        <label className="relative sm:ml-auto">
          <span className="sr-only">{t('adminKnowledge.searchInDocument')}</span>
          <Search size={14} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ash-447" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminKnowledge.searchInDocument')}
            className="h-9 rounded-full border border-sand-124 bg-surface pr-3 pl-8 text-sm outline-none focus:border-brand"
          />
        </label>
        {search.trim() ? (
          <span className="text-xs text-ash-573" aria-live="polite">
            {matches.length === 0 ? t('adminKnowledge.noMatches') : t('adminKnowledge.matchPages', { pages: matches.join(', ') })}
            {matches.length > 0 ? (
              <button type="button" className="ml-2 text-brand underline" onClick={() => setIndex(pages.findIndex((p) => p.page_number === matches[0]))}>
                {t('adminKnowledge.go')}
              </button>
            ) : null}
          </span>
        ) : null}
        <button type="button" className={`${secondaryButton} h-9`} onClick={() => void openCompare()}>
          <FileText size={14} aria-hidden /> {compare ? t('adminKnowledge.hideOriginal') : t('adminKnowledge.compareOriginal')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <StatusPill tone={page.needs_ocr ? 'red' : page.quality === 'good' || page.quality === 'corrected' ? 'green' : 'amber'}>
          {page.quality.replace(/_/g, ' ')} · {page.extraction_method.replace(/_/g, ' ')}
        </StatusPill>
        {page.ocr_confidence !== null ? <span className="text-ash-573">{t('adminKnowledge.ocrConfidence', { percent: page.ocr_confidence.toFixed(0) })}</span> : null}
        {page.is_corrected ? (
          <label className="flex items-center gap-1.5 text-ash-573">
            <input type="checkbox" checked={showOriginal} onChange={(e) => setShowOriginal(e.target.checked)} />
            {t('adminKnowledge.showMachineExtraction', { name: page.corrected_by_name ?? t('adminKnowledge.reviewer'), revision: page.correction_revision })}
          </label>
        ) : null}
        {page.warnings.map((w) => (
          <span key={w} className="text-honey-694">
            ⚠ {w.replace(/_/g, ' ')}
          </span>
        ))}
        <span className="flex gap-2 text-[11px] text-ash-447">
          <mark className="rounded bg-sea-73 px-1">{t('adminKnowledge.legendRegion')}</mark>
          <mark className="rounded bg-honey-233 px-1">{t('adminKnowledge.legendIssuance')}</mark>
          <mark className="rounded bg-iris-82 px-1">{t('adminKnowledge.legendDate')}</mark>
        </span>
      </div>

      {page.needs_ocr ? <Banner tone="warning">{t('adminKnowledge.needsOcrBanner')}</Banner> : null}

      <div className={`grid gap-3 ${compare ? 'lg:grid-cols-2' : ''}`}>
        {editing ? (
          <div className="space-y-2">
            <textarea
              rows={22}
              value={text}
              aria-label={t('adminKnowledge.correctedText')}
              onChange={(e) => setText(e.target.value)}
              className={`${inputClass} h-auto py-3 font-mono text-[12.5px] leading-relaxed`}
            />
            <input
              className={inputClass}
              value={note}
              aria-label={t('adminKnowledge.correctionReason')}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('adminKnowledge.correctionReason')}
            />
            <ErrorNote>{error}</ErrorNote>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButton} onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className={primaryButton} disabled={note.trim().length < 3 || correct.isPending} onClick={() => void saveCorrection()}>
                {t('adminKnowledge.saveCorrection')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <pre className="max-h-[36rem] overflow-auto rounded-2xl border border-sand-73 bg-surface p-5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-ash-890 select-text">
              <span className="mb-3 block border-b border-dashed border-sand-124 pb-2 text-[11px] text-ash-447">{t('adminKnowledge.pageNumber', { page: page.page_number })}</span>
              {shown ? <Highlighted text={shown} terms={terms} /> : <span className="text-ash-447">{t('adminKnowledge.noText')}</span>}
            </pre>
            <div className="mt-2 flex justify-between gap-2">
              <ErrorNote>{error}</ErrorNote>
              <button
                type="button"
                className="ml-auto text-sm font-medium text-brand hover:underline"
                onClick={() => {
                  setText(page.text)
                  setEditing(true)
                }}
              >
                {t('adminKnowledge.correctPage')}
              </button>
            </div>
          </div>
        )}
        {compare ? (
          version.extension === 'pdf' ? (
            <iframe title={t('adminKnowledge.originalFile')} src={`${compare}#page=${page.page_number}`} className="h-[38rem] w-full rounded-2xl border border-sand-73 bg-surface" />
          ) : (
            <div className="rounded-2xl border border-sand-73 bg-surface p-5 text-sm">
              <p>{t('adminKnowledge.cannotShowInline', { ext: version.extension.toUpperCase() })}</p>
              <a href={compare} download={version.original_filename} className="mt-2 inline-block text-brand underline">
                {t('adminKnowledge.downloadOriginal')}
              </a>
            </div>
          )
        ) : null}
      </div>
      <p className="text-xs text-ash-447">{t('adminKnowledge.textFootnote')}</p>
    </div>
  )
}
