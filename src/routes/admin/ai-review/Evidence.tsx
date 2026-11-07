import { Tick } from '../knowledge/Tick'
import type { Citation, Evidence } from '@/services/ai'
import { StatusPill } from '@/components/ui'
import { useI18n } from '@/i18n'

/** One citation under a claim: jump to its evidence plus each verification check. */
export function CitationLine({ citation: c, onShow }: { citation: Citation; onShow: () => void }) {
  const { t } = useI18n()
  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-ash-573">
      <button type="button" className="font-medium text-brand hover:underline" onClick={onShow}>
        [{c.marker}] p.{c.page ?? '?'}
      </button>
      <Tick ok={c.source_exists} label={t('adminKnowledge.tickSource')} />
      <Tick ok={c.approval_verified && c.version_verified} label={t('adminKnowledge.tickApprovedVersion')} />
      <Tick ok={c.literal_match} label={t('adminKnowledge.tickQuote')} />
      <Tick ok={c.page_verified} label={t('adminKnowledge.tickPage')} />
      <Tick ok={c.region_verified} label={t('adminKnowledge.tickRegion')} />
      {c.authority_role && c.authority_role !== 'governing' ? <span className="text-honey-694">{c.authority_role}</span> : null}
      {c.quoted_text ? <span className="w-full text-[11px] text-ash-447 italic">“{c.quoted_text}”</span> : null}
    </p>
  )
}

/** A passage the model was given, highlighted when a citation points at it. */
export function EvidenceItem({ evidence: e, focused }: { evidence: Evidence; focused: boolean }) {
  const { t } = useI18n()
  return (
    <li data-marker={e.marker} tabIndex={-1} className={`rounded-2xl border p-3 transition ${focused ? 'border-brand bg-ash-27' : 'border-sand-73'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold">
          [{e.marker}] {e.document_number ?? e.title} · p.{e.page_start}
          {e.page_end !== e.page_start ? `–${e.page_end}` : ''}
        </p>
        <div className="flex flex-wrap gap-1">
          <StatusPill tone={e.role === 'governing' ? 'green' : e.role === 'reference' ? 'amber' : 'gray'}>{e.role}</StatusPill>
          {e.outdated ? <StatusPill tone="red">{e.legal_status}</StatusPill> : null}
        </div>
      </div>
      <p className="mt-0.5 text-[11px] text-ash-573">
        {e.title} · {e.scope === 'national' ? t('adminKnowledge.appliesNationwide') : t('adminKnowledge.appliesToRegions', { regions: e.region_names.join(', ') })}
      </p>
      <p className="mt-2 max-h-48 overflow-auto text-[12px] leading-relaxed whitespace-pre-wrap text-ash-773">{e.text}</p>
      {e.newer_issuances.length > 0 ? (
        <p className="mt-1 text-[11px] text-rust-620">
          {e.newer_issuances.map((n) => t('adminKnowledge.relationByName', { relation: n.relation, name: n.document_number ?? n.title })).join(' · ')}
        </p>
      ) : null}
    </li>
  )
}
