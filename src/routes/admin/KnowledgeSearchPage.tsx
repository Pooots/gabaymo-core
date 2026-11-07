import { useState } from 'react'
import { BookOpen, FileText, LoaderCircle, Search, Sparkles } from 'lucide-react'

import { DocumentDetail } from './knowledge/DocumentDetail'
import { useKnowledgeLabels } from './knowledge/labels'
import { AnswerCard } from './knowledge/search/AnswerCard'
import { Diagnostics } from './knowledge/search/Diagnostics'
import { SourceItem } from './knowledge/search/SourceItem'
import type { FormEvent } from 'react'
import type { MessageKey } from '@/i18n'
import type { SearchResult } from '@/services/ai'
import { Banner, Card, CardTitle, Drawer, EmptyState, ErrorNote, ErrorState, PageHeader, Select, Skeleton, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useRegions, useRunSearch, useSearchHistory } from '@/queries/adminKnowledge'
import { aiError, formatDate } from '@/services/ai'

const modes: Array<{ value: string; label: MessageKey }> = [
  { value: 'AUTO', label: 'adminKnowledge.modeAuto' },
  { value: 'CURRENT_REGION', label: 'adminKnowledge.modeCurrentRegion' },
  { value: 'NATIONAL_ONLY', label: 'adminKnowledge.modeNationalOnly' },
  { value: 'SPECIFIC_REGION', label: 'adminKnowledge.modeSpecificRegion' },
  { value: 'ALL_REGIONS_REFERENCE', label: 'adminKnowledge.modeAllRegions' },
]

export function KnowledgeSearchPage() {
  const { t } = useI18n()
  const labels = useKnowledgeLabels()
  const [question, setQuestion] = useState('')
  const [mode, setMode] = useState('AUTO')
  const [region, setRegion] = useState('NCR')
  const [docType, setDocType] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [pending, setPending] = useState<'' | 'search' | 'answer'>('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const regionsQuery = useRegions()
  const regions = regionsQuery.data ?? []
  const history = useSearchHistory()
  const search = useRunSearch()

  async function run(generate: boolean, event?: FormEvent) {
    event?.preventDefault()
    if (question.trim().length < 3) return
    setPending(generate ? 'answer' : 'search')
    setError('')
    try {
      const data = await search.mutateAsync({
        generate,
        search: {
          question: question.trim(),
          mode,
          region: region || undefined,
          partner_id: partnerId ? Number(partnerId) : undefined,
          document_types: docType ? [docType] : undefined,
        },
      })
      setResult(data)
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.searchFailed')))
    } finally {
      setPending('')
    }
  }

  return (
    <div className="w-full">
      <PageHeader title={t('adminKnowledge.searchTitle')} description={t('adminKnowledge.searchDescription')} />

      <Banner className="mt-6">{t('adminKnowledge.searchBanner')}</Banner>

      <Card className="mt-4 p-4">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,2.5fr)_repeat(3,minmax(0,1fr))]" onSubmit={(e) => void run(false, e)}>
          <label className="relative lg:col-span-4">
            <span className="sr-only">{t('adminKnowledge.question')}</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ash-447" />
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('adminKnowledge.questionPlaceholder')} className={`${inputClass} pl-10`} />
          </label>
          <Select aria-label={t('adminKnowledge.askAsRegion')} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t('adminKnowledge.regionUnknown')}</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {t('adminKnowledge.askAs', { name: r.name, code: r.code })}
              </option>
            ))}
          </Select>
          <Select aria-label={t('adminKnowledge.searchMode')} value={mode} onChange={(e) => setMode(e.target.value)}>
            {modes.map((m) => (
              <option key={m.value} value={m.value}>
                {t(m.label)}
              </option>
            ))}
          </Select>
          <Select aria-label={t('adminKnowledge.documentType')} value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="">{t('adminKnowledge.allDocumentTypes')}</option>
            {labels.documentTypes.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <input
            aria-label={t('adminKnowledge.partnerScope')}
            inputMode="numeric"
            placeholder={t('adminKnowledge.partnerScopePlaceholder')}
            className={inputClass}
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value.replace(/\D/g, ''))}
          />
          <div className="flex flex-wrap justify-end gap-2 lg:col-span-4">
            <button type="submit" className={secondaryButton} disabled={pending !== '' || question.trim().length < 3}>
              {pending === 'search' ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Search size={16} aria-hidden />} {t('adminKnowledge.searchSources')}
            </button>
            <button type="button" className={primaryButton} disabled={pending !== '' || question.trim().length < 3} onClick={() => void run(true)}>
              {pending === 'answer' ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />} {t('adminKnowledge.generateAnswer')}
            </button>
          </div>
        </form>
        {regionsQuery.isError ? (
          <ErrorState
            compact
            className="mt-3"
            error={regionsQuery.error}
            title={t('adminKnowledge.regionsLoadError')}
            retrying={regionsQuery.isRefetching}
            onRetry={() => void regionsQuery.refetch()}
          />
        ) : null}
        {error ? (
          <div className="mt-3">
            <ErrorNote>{error}</ErrorNote>
          </div>
        ) : null}
      </Card>

      {!result ? (
        <Card className="mt-4">
          <EmptyState icon={BookOpen} title={t('adminKnowledge.searchEmptyTitle')}>
            {t('adminKnowledge.searchEmptyText')}
          </EmptyState>
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {result.status === 'needs_region' ? <Banner tone="warning">{t('adminKnowledge.needsRegion')}</Banner> : null}
            {result.answer ? <AnswerCard result={result} answer={result.answer} /> : null}
            <Card className="p-5">
              <CardTitle icon={FileText}>{t('adminKnowledge.sourcesCount', { count: result.sources.length })}</CardTitle>
              {result.sources.length === 0 ? (
                <p className="mt-4 text-sm text-ash-573">{t('adminKnowledge.noSources')}</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {result.sources.map((s) => (
                    <SourceItem key={s.chunk_id} source={s} onPreview={() => setPreview(s.document_id)} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <Diagnostics result={result} />
        </div>
      )}

      <Card className="mt-4 p-5">
        <CardTitle>{t('adminKnowledge.searchHistory')}</CardTitle>
        {history.isPending ? (
          <div className="mt-3 space-y-3 py-1" role="status" aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : history.isError ? (
          <ErrorState compact className="mt-3" error={history.error} retrying={history.isRefetching} onRetry={() => void history.refetch()} />
        ) : history.data.length === 0 ? (
          <p className="mt-3 text-sm text-ash-573">{t('adminKnowledge.noSearches')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-59">
            {history.data.slice(0, 12).map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 py-2 text-left text-sm hover:text-brand sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  onClick={() => setQuestion(h.query)}
                >
                  <span className="truncate">{h.query}</span>
                  <span className="shrink-0 text-xs text-ash-447">
                    {h.resolved_region?.region_code ?? t('adminKnowledge.noRegion')} · {h.search_mode} · {t('adminKnowledge.sourcesReturned', { count: h.returned })}
                    {h.generated ? ` · ${t('adminKnowledge.withAnswer')}` : ''} · {formatDate(h.created_at, true)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {preview ? (
        <Drawer title={t('adminKnowledge.sourceDocument')} onClose={() => setPreview(null)} wide>
          <DocumentDetail documentId={preview} mode="review" />
        </Drawer>
      ) : null}
    </div>
  )
}
