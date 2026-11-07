import { useState } from 'react'

import type { DocumentDetail as Detail } from '@/services/ai'
import { ErrorNote, ErrorState, SectionLabel, Select, Skeleton, inputClass, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocuments, useRelationActions } from '@/queries/adminKnowledge'
import { aiError, formatDate } from '@/services/ai'

/** Newer issuances acting on this one, older ones it acts on, and linking new relations. */
export function Relations({ detail, onChanged }: { detail: Detail; onChanged: () => Promise<void> }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [relation, setRelation] = useState('supersedes')
  const [effective, setEffective] = useState('')
  const [error, setError] = useState('')
  const actions = useRelationActions()
  const found = useDocuments({ q: term, per_page: 8 }, { enabled: term !== '' })
  const results = term ? (found.data?.data ?? []).filter((d) => d.id !== detail.document.id) : []

  function find() {
    if (search.trim()) setTerm(search.trim())
  }

  async function link(targetId: string, as = relation) {
    setError('')
    try {
      await actions.add.mutateAsync({ id: detail.document.id, targetId, relation: as, effective })
      setTerm('')
      setSearch('')
      await onChanged()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.linkFailed')))
    }
  }

  async function unlink(relationId: number) {
    setError('')
    try {
      await actions.remove.mutateAsync({ id: detail.document.id, relationId })
      await onChanged()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.unlinkFailed')))
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sand-73 bg-surface p-4">
        <SectionLabel>{t('adminKnowledge.newerActing')}</SectionLabel>
        {detail.relations.newer.length === 0 ? (
          <p className="mt-2 text-sm text-ash-573">{t('adminKnowledge.newerNone')}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {detail.relations.newer.map((n) => (
              <li key={n.document_id + n.relation}>
                {t('adminKnowledge.relationBy', { relation: n.relation })} <strong>{n.document_number ?? n.title}</strong>
                {n.published ? '' : ` ${t('adminKnowledge.notYetPublished')}`}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-sand-73 bg-surface p-4">
        <SectionLabel>{t('adminKnowledge.actsOn')}</SectionLabel>
        {detail.relations.older.length === 0 ? (
          <p className="mt-2 text-sm text-ash-573">{t('adminKnowledge.olderNone')}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {detail.relations.older.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2">
                <span>
                  {o.relation} <strong>{o.document_number ?? o.title}</strong>
                  {o.effective_date ? ` · ${t('adminKnowledge.effectiveOn', { date: formatDate(o.effective_date) })}` : ''}
                </span>
                <button type="button" className="text-xs text-rust-620 hover:underline" disabled={actions.remove.isPending} onClick={() => void unlink(o.id)}>
                  {t('adminKnowledge.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
        {detail.relations.suggested.length > 0 ? (
          <div className="mt-3 space-y-1">
            <SectionLabel>{t('adminKnowledge.detectedInText')}</SectionLabel>
            {detail.relations.suggested.map((s, i) => (
              <div key={i} className="rounded-xl bg-honey-47 px-3 py-2 text-xs text-honey-755">
                p.{s.page}: “{s.snippet}” → {s.relation} {s.target_text}
                {s.match_document_id ? (
                  <button
                    type="button"
                    className="ml-2 font-medium underline"
                    onClick={() => {
                      const target = s.match_document_id
                      if (!target) return
                      setRelation(s.relation)
                      void link(target, s.relation)
                    }}
                  >
                    {t('adminKnowledge.linkTo', { title: s.match_title ?? '' })}
                  </button>
                ) : (
                  <span className="ml-1">{t('adminKnowledge.notInLibrary')}</span>
                )}
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-[10rem_10rem_minmax(0,1fr)_auto]">
          <Select value={relation} onChange={(e) => setRelation(e.target.value)} aria-label={t('adminKnowledge.relation')}>
            <option value="supersedes">{t('adminKnowledge.relSupersedes')}</option>
            <option value="amends">{t('adminKnowledge.relAmends')}</option>
            <option value="revokes">{t('adminKnowledge.relRevokes')}</option>
            <option value="clarifies">{t('adminKnowledge.relClarifies')}</option>
            <option value="references">{t('adminKnowledge.relReferences')}</option>
          </Select>
          <input type="date" className={inputClass} value={effective} onChange={(e) => setEffective(e.target.value)} aria-label={t('adminKnowledge.effectiveDate')} />
          <input
            className={inputClass}
            value={search}
            aria-label={t('adminKnowledge.findOlderPlaceholder')}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminKnowledge.findOlderPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') find()
            }}
          />
          <button type="button" className={secondaryButton} onClick={find}>
            {t('adminKnowledge.find')}
          </button>
        </div>
        {term && found.isPending ? (
          <div className="mt-2 space-y-1" aria-busy="true">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ) : null}
        {term && found.isError ? (
          <ErrorState compact className="mt-2" error={found.error} retrying={found.isRefetching} onRetry={() => void found.refetch()} />
        ) : null}
        {results.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {results.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-ash-25 px-3 py-2 text-sm">
                <span className="truncate">
                  {r.document_number ?? ''} {r.title}
                </span>
                <button type="button" className="shrink-0 text-sm font-medium text-brand hover:underline" onClick={() => void link(r.id)}>
                  {t('adminKnowledge.thisDocumentRelates', { relation })}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-2">
          <ErrorNote>{error}</ErrorNote>
        </div>
      </div>
    </div>
  )
}
