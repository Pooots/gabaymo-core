import { useState } from 'react'
import { Pencil } from 'lucide-react'

import { ApplicabilityEditor } from './ApplicabilityEditor'
import type { MessageKey } from '@/i18n'
import type { Region, RegionRow, VersionDetail } from '@/services/ai'
import { Banner, ErrorState, StatusPill, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useRegions } from '@/queries/adminKnowledge'

const relationKeys: Record<RegionRow['relation'], { label: MessageKey; help: MessageKey }> = {
  issuing_origin: { label: 'adminKnowledge.relIssuedBy', help: 'adminKnowledge.relIssuedByHelp' },
  applies_to: { label: 'adminKnowledge.relAppliesTo', help: 'adminKnowledge.relAppliesToHelp' },
  excluded: { label: 'adminKnowledge.relExceptions', help: 'adminKnowledge.relExceptionsHelp' },
  mentioned: { label: 'adminKnowledge.relMentioned', help: 'adminKnowledge.relMentionedHelp' },
}

const classificationWarnings: Record<string, MessageKey> = {
  disseminates_other_issuance: 'adminKnowledge.warnDisseminates',
  national_language_in_regional_issuance: 'adminKnowledge.warnNationalLanguage',
  conflicting_applicability_signals: 'adminKnowledge.warnConflictingSignals',
  division_not_identified: 'adminKnowledge.warnDivisionNotIdentified',
  conflicting_issuing_regions: 'adminKnowledge.warnConflictingRegions',
  low_confidence_applicability: 'adminKnowledge.warnLowConfidence',
  historical_region_name: 'adminKnowledge.warnHistoricalRegion',
}

/** Where an issuance applies (as detected and as verified), plus the correction dialog. */
export function ApplicabilityPanel({ documentId, version, onChanged }: { documentId: string; version: VersionDetail; onChanged: () => Promise<void> }) {
  const { t } = useI18n()
  const regionsQuery = useRegions()
  const regions = regionsQuery.data ?? []
  const [editing, setEditing] = useState(false)
  const rows = version.applicability.rows ?? []
  const classification = version.applicability.classification

  function regionLabel(row: RegionRow, list: Array<Region>) {
    if (row.level === 'national') return t('adminKnowledge.national')
    const r = list.find((x) => x.code === row.region_code)
    const base = r ? `${r.name} (${r.code})` : (row.region_code ?? '')
    if (row.level === 'division') return `${row.division_code ?? t('adminKnowledge.division')} · ${base}`
    if (row.level === 'province') return `${row.detected_label ?? row.province_code} · ${base}`
    return base
  }

  return (
    <div className="space-y-4">
      {regionsQuery.isError ? (
        <ErrorState compact error={regionsQuery.error} title={t('adminKnowledge.regionsLoadError')} retrying={regionsQuery.isRefetching} onRetry={() => void regionsQuery.refetch()} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={version.applicability.scope === 'unknown' ? 'amber' : 'green'}>
          {t('adminKnowledge.scopeLabel', { scope: version.applicability.scope.replace(/_/g, ' ') })}
        </StatusPill>
        <StatusPill tone={version.applicability.verified ? 'green' : 'amber'}>
          {version.applicability.verified ? t('adminKnowledge.verifiedByReviewer') : t('adminKnowledge.notVerified')}
        </StatusPill>
        <button type="button" className={`${secondaryButton} ml-auto h-9`} onClick={() => setEditing(true)}>
          <Pencil size={14} aria-hidden /> {t('adminKnowledge.correctApplicability')}
        </button>
      </div>
      {classification ? (
        <Banner tone={classification.needs_review ? 'warning' : 'info'}>
          {classification.summary}{' '}
          {classification.confidence ? t('adminKnowledge.confidenceParen', { percent: Math.round(classification.confidence * 100) }) : ''}
          {classification.warnings.length ? (
            <ul className="mt-1.5 space-y-0.5">
              {classification.warnings.map((w) => {
                const key = classificationWarnings[w]
                return <li key={w}>• {key ? t(key) : w.replace(/_/g, ' ')}</li>
              })}
            </ul>
          ) : null}
        </Banner>
      ) : null}
      {classification?.ai_suggestion ? (
        <Banner tone="muted">
          {t('adminKnowledge.aiSuggestion', {
            scope: classification.ai_suggestion.scope,
            regions: classification.ai_suggestion.applies_to_regions.length ? ` · ${classification.ai_suggestion.applies_to_regions.join(', ')}` : '',
            rationale: classification.ai_suggestion.rationale,
          })}
        </Banner>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(relationKeys) as Array<RegionRow['relation']>).map((relation) => {
          const group = rows.filter((r) => r.relation === relation)
          return (
            <div key={relation} className="rounded-2xl border border-sand-73 bg-surface p-4">
              <p className="text-sm font-semibold">{t(relationKeys[relation].label)}</p>
              <p className="text-xs text-ash-447">{t(relationKeys[relation].help)}</p>
              {group.length === 0 ? (
                <p className="mt-3 text-xs text-ash-573">{t('adminKnowledge.none')}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {group.map((row, i) => (
                    <li key={row.id ?? i} className="text-xs">
                      <span className="font-medium text-ash-890">{regionLabel(row, regions)}</span>
                      <span className="text-ash-447">
                        {' '}
                        · {row.method}
                        {row.confidence !== undefined ? ` · ${Math.round((row.confidence ?? 0) * 100)}%` : ''}
                        {row.evidence_page ? ` · p.${row.evidence_page}` : ''}
                      </span>
                      {row.evidence_text ? <span className="mt-0.5 block truncate text-ash-573">“{row.evidence_text}”</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {editing ? (
        <ApplicabilityEditor
          documentId={documentId}
          version={version}
          regions={regions}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false)
            await onChanged()
          }}
        />
      ) : null}
    </div>
  )
}
