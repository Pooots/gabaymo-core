import { useKnowledgeLabels } from './labels'
import type { DocumentRow } from '@/services/ai'
import { StatusPill } from '@/components/ui'
import { useI18n } from '@/i18n'
import { lifecycleTone } from '@/services/ai'

/** Knowledge-library badges. Generic UI lives in '@/components/ui'. */

export function LifecycleBadge({ status }: { status: string }) {
  const labels = useKnowledgeLabels()
  return (
    <StatusPill tone={lifecycleTone(status)} dot>
      {labels.lifecycle(status)}
    </StatusPill>
  )
}

export function LegalBadge({ status }: { status: string }) {
  const labels = useKnowledgeLabels()
  if (!status || status === 'in_force') return null
  const tone = status === 'amended' ? 'amber' : 'red'
  return <StatusPill tone={tone}>{labels.legal(status)}</StatusPill>
}

export function RegionPills({ document }: { document: Pick<DocumentRow, 'applicability_scope' | 'region_codes'> }) {
  const { t } = useI18n()
  if (document.applicability_scope === 'national') {
    return <span className="inline-flex rounded-full bg-moss-53 px-2 py-0.5 text-[11px] font-medium text-brand-strong">{t('adminKnowledge.national')}</span>
  }
  if (document.applicability_scope === 'unknown' || document.region_codes.length === 0) {
    return <span className="inline-flex rounded-full bg-honey-47 px-2 py-0.5 text-[11px] font-medium text-honey-694">{t('adminKnowledge.regionUnknown')}</span>
  }
  return (
    <span className="flex flex-wrap gap-1">
      {document.region_codes.map((code) => (
        <span key={code} className="inline-flex rounded-full bg-sand-53 px-2 py-0.5 text-[11px] font-medium text-moss-731 ring-1 ring-sand-124">
          {code === 'NCR' || code === 'CAR' || code === 'BARMM' || code === 'NIR' ? code : t('adminKnowledge.regionCode', { code })}
        </span>
      ))}
    </span>
  )
}
