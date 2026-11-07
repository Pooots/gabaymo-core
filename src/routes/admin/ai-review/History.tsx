import { useKnowledgeLabels } from '../knowledge/labels'
import type { DraftDetail } from '@/services/ai'
import { SectionLabel } from '@/components/ui'
import { useI18n } from '@/i18n'
import { formatDate } from '@/services/ai'

/** Collapsible conversation, revision and review history of a draft. */
export function History({ draft }: { draft: DraftDetail }) {
  const { t } = useI18n()
  const labels = useKnowledgeLabels()
  return (
    <details className="rounded-2xl border border-sand-73 px-4 py-3">
      <summary className="cursor-pointer text-xs font-medium text-brand">{t('adminKnowledge.historySummary')}</summary>
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        <div>
          <SectionLabel>{t('adminKnowledge.conversation')}</SectionLabel>
          <ul className="mt-2 space-y-1.5">
            {draft.conversation.map((m) => (
              <li key={m.id} className="text-xs">
                <span className="font-medium">{m.role}:</span> <span className="text-ash-773">{m.content.length > 240 ? `${m.content.slice(0, 240)}…` : m.content}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel>{t('adminKnowledge.revisions')}</SectionLabel>
          <ul className="mt-2 space-y-1">
            {draft.revisions.map((r) => (
              <li key={r.id} className={`text-xs ${r.id === draft.id ? 'font-medium' : 'text-ash-573'}`}>
                #{r.revision} {r.origin} · {labels.answerStatus(r.answer_status)} · {formatDate(r.created_at, true)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel>{t('adminKnowledge.reviews')}</SectionLabel>
          <ul className="mt-2 space-y-1">
            {draft.reviews.length === 0 ? (
              <li className="text-xs text-ash-447">{t('adminKnowledge.noneYet')}</li>
            ) : (
              draft.reviews.map((r, i) => (
                <li key={i} className="text-xs text-ash-773">
                  {t('adminKnowledge.reviewBy', { action: r.action, name: r.reviewer_name ?? '—' })} · {formatDate(r.created_at, true)}
                  {r.note ? ` — “${r.note}”` : ''}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ash-447">{t('adminKnowledge.modelCost', { model: draft.model ?? '—', cost: Number(draft.estimated_cost ?? 0).toFixed(5) })}</p>
    </details>
  )
}
