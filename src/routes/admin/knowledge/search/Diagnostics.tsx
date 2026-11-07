import type { MessageKey } from '@/i18n'
import type { SearchResult } from '@/services/ai'
import { Card, CardTitle, SectionLabel } from '@/components/ui'
import { useI18n } from '@/i18n'

const exclusionKeys: Record<string, MessageKey> = {
  other_region_not_applicable: 'adminKnowledge.exclOtherRegion',
  user_region_unknown: 'adminKnowledge.exclUserRegionUnknown',
  national_excludes_user_region: 'adminKnowledge.exclNationalExcludes',
  below_threshold: 'adminKnowledge.exclBelowThreshold',
  stale_version: 'adminKnowledge.exclStaleVersion',
  unapproved: 'adminKnowledge.exclUnapproved',
  withdrawn: 'adminKnowledge.exclWithdrawn',
  orphan_vector: 'adminKnowledge.exclOrphanVector',
  unauthorized_partner: 'adminKnowledge.exclUnauthorizedPartner',
  revoked: 'adminKnowledge.exclRevoked',
  not_yet_effective: 'adminKnowledge.exclNotYetEffective',
  division_not_applicable: 'adminKnowledge.exclDivision',
  school_not_applicable: 'adminKnowledge.exclSchool',
  unknown_applicability: 'adminKnowledge.exclUnknownApplicability',
}

/** How the retrieval ran: region, mode, counts, timings, cost and excluded candidates. */
export function Diagnostics({ result }: { result: SearchResult }) {
  const { t } = useI18n()
  const d = result.diagnostics
  return (
    <Card className="space-y-4 p-5">
      <CardTitle>{t('adminKnowledge.diagnostics')}</CardTitle>
      <div>
        <SectionLabel>{t('adminKnowledge.queryInterpretation')}</SectionLabel>
        <ul className="mt-2 space-y-1">
          {d.query_interpretation.map((n, i) => (
            <li key={i} className="text-xs text-ash-773">
              • {n}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat
          label={t('adminKnowledge.statResolvedRegion')}
          value={d.resolved_region.region_code ? `${d.resolved_region.region_name} (${d.resolved_region.region_code})` : t('adminKnowledge.unknown')}
        />
        <Stat label={t('adminKnowledge.statMode')} value={d.search_mode} />
        <Stat label={t('adminKnowledge.statCandidates')} value={d.candidates} />
        <Stat label={t('adminKnowledge.statExcluded')} value={d.excluded} />
        <Stat label={t('adminKnowledge.statReturned')} value={`${d.returned} / ${d.governing}`} />
        <Stat label={t('adminKnowledge.statRetrieval')} value={t('adminKnowledge.ms', { ms: d.retrieval_ms })} />
        {d.generation_ms !== undefined ? <Stat label={t('adminKnowledge.statGeneration')} value={t('adminKnowledge.ms', { ms: d.generation_ms })} /> : null}
        <Stat label={t('adminKnowledge.statEmbeddingTokens')} value={d.embedding_tokens} />
        {d.token_usage ? (
          <Stat
            label={t('adminKnowledge.statGenerationTokens')}
            value={t('adminKnowledge.tokensInOut', { in: d.token_usage.generation_prompt ?? 0, out: d.token_usage.generation_completion ?? 0 })}
          />
        ) : null}
        {d.token_usage ? (
          <Stat
            label={t('adminKnowledge.statValidationTokens')}
            value={t('adminKnowledge.tokensInOut', { in: d.token_usage.validation_prompt ?? 0, out: d.token_usage.validation_completion ?? 0 })}
          />
        ) : null}
        {d.estimated_cost_usd !== undefined ? <Stat label={t('adminKnowledge.statCost')} value={`$${d.estimated_cost_usd.toFixed(5)}`} /> : null}
        {d.model ? <Stat label={t('adminKnowledge.statModel')} value={d.model} /> : null}
      </div>
      <div>
        <SectionLabel>{t('adminKnowledge.excludedCandidates')}</SectionLabel>
        {result.excluded.length === 0 ? (
          <p className="mt-2 text-xs text-ash-573">{t('adminKnowledge.excludedNone')}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {result.excluded.slice(0, 25).map((x) => {
              const key = exclusionKeys[x.reason]
              return (
                <li key={x.chunk_id} className="flex justify-between gap-2 text-xs">
                  <span className="truncate">{x.document_number ?? x.title ?? x.chunk_id}</span>
                  <span className="shrink-0 text-rust-620">
                    {key ? t(key) : x.reason.replace(/_/g, ' ')} · {x.score.toFixed(3)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <details>
        <summary className="cursor-pointer text-xs font-medium text-brand">{t('adminKnowledge.effectiveFilters')}</summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-sand-53 p-3 text-[11px]">{JSON.stringify(d.effective_filters, null, 2)}</pre>
      </details>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-ash-25 px-3 py-2">
      <p className="text-[10px] tracking-wide text-ash-447 uppercase">{label}</p>
      <p className="mt-0.5 font-medium break-words text-ash-890">{value}</p>
    </div>
  )
}
