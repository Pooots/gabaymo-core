import type { Evidence } from '@/services/ai'
import { StatusPill } from '@/components/ui'
import { useI18n } from '@/i18n'

function roleTone(role: string): 'green' | 'amber' | 'gray' {
  return role === 'governing' ? 'green' : role === 'reference' ? 'amber' : 'gray'
}

/** One retrieved passage with its role, score and why it was kept. */
export function SourceItem({ source, onPreview }: { source: Evidence; onPreview: () => void }) {
  const { t } = useI18n()
  const applies = source.scope === 'national' ? t('adminKnowledge.national') : source.region_names.join(', ') || source.scope
  const pages = `p.${source.page_start}${source.page_end !== source.page_start ? `–${source.page_end}` : ''}`
  const role = source.role === 'governing' ? t('adminKnowledge.roleGoverning') : source.role === 'reference' ? t('adminKnowledge.roleReference') : t('adminKnowledge.roleHistorical')
  return (
    <li className="rounded-2xl border border-sand-73 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ash-447">[{source.marker}]</p>
          <h3 className="text-sm font-semibold">{source.title}</h3>
          <p className="mt-0.5 text-xs text-ash-573">
            {[source.document_number, source.issuing_authority, t('adminKnowledge.appliesToValue', { value: applies }), pages, source.section].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <StatusPill tone={roleTone(source.role)} dot>
            {role}
          </StatusPill>
          {source.outdated ? <StatusPill tone="red">{t('adminKnowledge.outdatedStatus', { status: source.legal_status })}</StatusPill> : null}
          <span className="rounded-full bg-sand-53 px-2 py-0.5 text-[11px] font-medium text-ash-639">{t('adminKnowledge.score', { score: source.score.toFixed(3) })}</span>
          <StatusPill tone="gray">{source.publication_status}</StatusPill>
        </div>
      </div>
      <p className="mt-3 rounded-2xl border-l-2 border-brand/40 bg-ash-25 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap text-ash-773">{source.excerpt ?? source.text}</p>
      {source.newer_issuances.length > 0 ? (
        <p className="mt-2 text-xs text-rust-620">
          {source.newer_issuances
            .map((n) => `${t('adminKnowledge.relationByName', { relation: n.relation, name: n.document_number ?? n.title })}${n.in_evidence ? ` ${t('adminKnowledge.includedAbove')}` : ''}`)
            .join(' · ')}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-ash-447">
        {t('adminKnowledge.why', { reason: source.role_reason.replace(/_/g, ' ') })}
        {source.flags.length ? ` · ${source.flags.join(', ').replace(/_/g, ' ')}` : ''}
      </p>
      <button type="button" className="mt-2 text-xs font-medium text-brand hover:underline" onClick={onPreview}>
        {t('adminKnowledge.openSourceDocument')}
      </button>
    </li>
  )
}
