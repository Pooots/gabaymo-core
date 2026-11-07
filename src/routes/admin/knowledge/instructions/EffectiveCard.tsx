import { useState } from 'react'
import { Eye } from 'lucide-react'

import { Card, CardTitle, ErrorState, LoadingState, SectionLabel, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useEffectiveInstructions } from '@/queries/adminKnowledge'

/** The merged instruction tiers the next answer will use. */
export function EffectiveCard({ base, partnerId }: { base: 'admin' | 'partner'; partnerId: number | null }) {
  const { t } = useI18n()
  const query = useEffectiveInstructions(base, partnerId)
  const [showText, setShowText] = useState(false)
  const effective = query.data

  return (
    <Card className="p-6">
      <CardTitle
        icon={Eye}
        action={
          <button type="button" className={`${secondaryButton} h-9`} aria-expanded={showText} onClick={() => setShowText((v) => !v)}>
            {showText ? t('adminKnowledge.hideFullText') : t('adminKnowledge.showFullText')}
          </button>
        }
      >
        {partnerId ? t('adminKnowledge.effectiveForPartner', { id: partnerId }) : t('adminKnowledge.effectiveInstructions')}
      </CardTitle>
      {query.isPending ? (
        <LoadingState className="mt-4" rows={2} />
      ) : query.isError || !effective ? (
        <ErrorState compact className="mt-4" error={query.error} title={t('adminKnowledge.effectiveLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
      ) : (
        <div className="mt-4 space-y-3">
          {effective.tiers.map((tier) => (
            <div key={tier.tier}>
              <SectionLabel>
                {tier.tier}. {tier.label}
              </SectionLabel>
              {tier.items.length === 0 ? (
                <p className="mt-1 text-xs text-ash-447">{t('adminKnowledge.none')}</p>
              ) : (
                <ol className="mt-1 space-y-1">
                  {tier.items.map((item, i) => (
                    <li key={`${tier.tier}-${item.id ?? i}`} className="flex gap-2 text-sm text-ash-773">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {item.title}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
          {showText ? (
            <pre className="max-h-96 overflow-auto rounded-xl bg-sand-53 p-3 text-[11px] whitespace-pre-wrap">
              {effective.tiers[0]?.items[0]?.body}
              {'\n\n'}
              {effective.text}
            </pre>
          ) : null}
          <p className="text-[11px] text-ash-447">{t('adminKnowledge.fingerprint', { hash: effective.hash.slice(0, 12) })}</p>
        </div>
      )}
    </Card>
  )
}
