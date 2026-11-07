import { Sparkles } from 'lucide-react'

import { PreferredAnswers } from '../PreferredAnswers'
import { Tick } from '../Tick'
import type { SearchResult } from '@/services/ai'
import { Card, CardTitle, SectionLabel, StatusPill } from '@/components/ui'
import { PartnerTakeCard } from '@/components/answers/PartnerTakeCard'
import { RichText } from '@/components/answers/RichText'
import { useI18n } from '@/i18n'

type Answer = NonNullable<SearchResult['answer']>

/** Test answer from Knowledge Search, with every claim's citation checks. */
export function AnswerCard({ result, answer }: { result: SearchResult; answer: Answer }) {
  const { t } = useI18n()
  const statusLabel =
    answer.route.status === 'ready_for_review'
      ? t('adminKnowledge.answerReadyNeedsReview')
      : answer.route.status === 'needs_confirmation'
        ? t('adminKnowledge.answerNeedsConfirmation')
        : answer.route.status === 'partner_handoff'
          ? t('adminKnowledge.answerPartnerHandoff')
          : answer.route.status
  const tone = answer.route.status === 'ready_for_review' ? 'green' : answer.route.status === 'partner_handoff' ? 'red' : 'amber'

  return (
    <Card className="p-5">
      <CardTitle
        icon={Sparkles}
        action={
          <StatusPill tone={tone} dot>
            {statusLabel}
          </StatusPill>
        }
      >
        {t('adminKnowledge.aiAnswerTest')}
      </CardTitle>
      <RichText text={answer.validated_text} className="mt-4 text-sm leading-relaxed text-ash-890" />
      {result.partner_take ? (
        <div className="mt-4">
          <SectionLabel>{t('adminKnowledge.partnerTakeSearch')}</SectionLabel>
          <PartnerTakeCard className="mt-2" text={result.partner_take.text} />
        </div>
      ) : null}
      <PreferredAnswers items={result.preferred_answers} />
      {answer.route.reasons.length > 0 ? (
        <div className="mt-4">
          <SectionLabel>{t('adminKnowledge.whyReviewer')}</SectionLabel>
          <ul className="mt-2 space-y-1">
            {answer.issues.map((i, k) => (
              <li key={k} className={`text-xs ${i.severity === 'hard' ? 'text-rust-620' : 'text-honey-694'}`}>
                • {i.detail}
              </li>
            ))}
          </ul>
          {answer.route.reasons
            .filter((r) => !answer.issues.some((i) => i.code === r))
            .map((r) => (
              <p key={r} className="text-xs text-honey-694">
                • {r.replace(/_/g, ' ')}
              </p>
            ))}
        </div>
      ) : null}
      {answer.claims.length > 0 ? (
        <div className="mt-4">
          <SectionLabel>{t('adminKnowledge.claimsChecks')}</SectionLabel>
          <ul className="mt-2 space-y-2">
            {answer.claims.map((claim, i) => {
              const cites = answer.citations.filter((c) => c.claim_index === i)
              return (
                <li key={i} className="rounded-xl bg-ash-25 px-3 py-2 text-xs">
                  <p className="text-[13px] text-ash-890">
                    {claim.kind === 'interpretation' ? `${t('adminKnowledge.interpretation')} ` : ''}
                    {claim.text}
                  </p>
                  {cites.map((c, k) => (
                    <p key={k} className="mt-1 flex flex-wrap items-center gap-2 text-ash-573">
                      [{c.marker}] p.{c.page ?? '?'}
                      <Tick ok={c.literal_match} label={t('adminKnowledge.tickQuote')} />
                      <Tick ok={c.page_verified} label={t('adminKnowledge.tickPage')} />
                      <Tick ok={c.version_verified && c.approval_verified} label={t('adminKnowledge.tickApprovedVersion')} />
                      <Tick ok={c.region_verified} label={t('adminKnowledge.tickRegionLabel')} />
                    </p>
                  ))}
                  {claim.support ? (
                    <p className="mt-1 text-ash-573">
                      {t('adminKnowledge.support')} <strong>{claim.support.verdict}</strong> — {claim.support.reason}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
