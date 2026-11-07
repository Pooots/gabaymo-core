import { UserRoundCheck } from 'lucide-react'

import type { PreferredAnswer } from '@/services/ai'
import { SectionLabel } from '@/components/ui'
import { useI18n } from '@/i18n'

/** Partner answers (Train GabayMo) that matched the question. Shown to admins; never cited. */
export function PreferredAnswers({ items }: { items: Array<PreferredAnswer> | undefined }) {
  const { t } = useI18n()
  if (!items || items.length === 0) return null
  return (
    <div className="mt-4">
      <SectionLabel>{t('adminKnowledge.preferredTitle')}</SectionLabel>
      <ul className="mt-2 space-y-2">
        {items.map((p) => (
          <li key={p.answer_id} className="rounded-xl border border-sea-71 bg-sea-22 px-3 py-2 text-xs">
            <p className="flex flex-wrap items-center gap-1.5 font-medium text-sea-743">
              <UserRoundCheck size={13} aria-hidden />{' '}
              {t('adminKnowledge.preferredMeta', { marker: p.marker, partner: p.partner_id, score: Math.round(p.score * 100), source: p.source_marker })}
            </p>
            <p className="mt-1 text-ash-773">{t('adminKnowledge.preferredQuestion', { text: p.question })}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-ash-773">{t('adminKnowledge.preferredAnswer', { text: p.answer })}</p>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] text-ash-447">{t('adminKnowledge.preferredFootnote')}</p>
    </div>
  )
}
