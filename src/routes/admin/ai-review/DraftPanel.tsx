import { useRef, useState } from 'react'
import { Check, LoaderCircle, PenLine, RefreshCw, UserRoundCheck, UserRoundPlus, XCircle } from 'lucide-react'

import { useKnowledgeLabels } from '../knowledge/labels'
import { ActionDialog } from './ActionDialog'
import { CitationLine, EvidenceItem } from './Evidence'
import { History } from './History'
import { reasonKeys } from './reasons'
import type { DraftActionName } from './reasons'
import type { DraftDetail } from '@/services/ai'
import { ErrorNote, ErrorState, LoadingState, SectionLabel, StatusPill, primaryButton, secondaryButton } from '@/components/ui'
import { PartnerTakeCard } from '@/components/answers/PartnerTakeCard'
import { RichText } from '@/components/answers/RichText'
import { useI18n } from '@/i18n'
import { useDraft, useDraftAction } from '@/queries/adminKnowledge'
import { aiError, answerTone, formatDate } from '@/services/ai'

/** One draft answer: claims with citation checks, evidence, and the review actions. */
export function DraftPanel({ id, onChanged }: { id: string; onChanged: (message: string, nextId?: string) => void }) {
  const { t } = useI18n()
  const query = useDraft(id)

  if (query.isPending) return <LoadingState className="p-5" label={t('adminKnowledge.answerLoading')} />
  if (query.isError) {
    return <ErrorState error={query.error} title={t('adminKnowledge.answerLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
  }
  return <DraftBody draft={query.data} onChanged={onChanged} />
}

function DraftBody({ draft, onChanged }: { draft: DraftDetail; onChanged: (message: string, nextId?: string) => void }) {
  const { t } = useI18n()
  const labels = useKnowledgeLabels()
  const mutation = useDraftAction()
  const [error, setError] = useState('')
  const [pending, setPending] = useState<DraftActionName | ''>('')
  const [dialog, setDialog] = useState<DraftActionName | null>(null)
  const [focusMarker, setFocusMarker] = useState<string | null>(null)
  const evidenceRef = useRef<HTMLDivElement>(null)

  const open = ['ready_for_review', 'needs_confirmation', 'partner_handoff'].includes(draft.answer_status)
  const sendable = ['ready_for_review', 'needs_confirmation'].includes(draft.answer_status)
  const hardBlocked = Boolean(draft.validation_results?.hard_blocked)
  const issues = draft.validation_results?.literal?.issues ?? []
  const support = draft.validation_results?.support?.results ?? {}
  const citations = draft.citations ?? []
  const q = draft.question

  async function run(action: DraftActionName, body: Record<string, unknown>, message: string) {
    setError('')
    setPending(action)
    try {
      const result = await mutation.mutateAsync({ id: draft.id, action, body })
      setDialog(null)
      onChanged(message, result.id !== draft.id ? result.id : undefined)
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.actionFailed')))
    } finally {
      setPending('')
    }
  }

  function showEvidence(marker: string) {
    setFocusMarker(marker)
    window.setTimeout(() => {
      const target = evidenceRef.current?.querySelector<HTMLElement>(`[data-marker="${marker}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      target?.focus({ preventScroll: true })
    }, 0)
  }

  const spinner = <LoaderCircle size={16} className="animate-spin" aria-hidden />

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>{t('adminKnowledge.question')}</SectionLabel>
          <p className="mt-1 text-[15px] font-medium">{q?.text}</p>
          <p className="mt-1 text-xs text-ash-573">
            {t('adminKnowledge.questionMeta', {
              actor: q?.actor_type ?? '',
              user: q?.user_id ?? '',
              region: q?.region_code ?? t('adminKnowledge.unknownLower'),
              credit: q?.credit_status ?? '',
              asked: formatDate(q?.asked_at, true),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={answerTone(draft.answer_status)} dot>
            {labels.answerStatus(draft.answer_status)}
          </StatusPill>
          <StatusPill tone={draft.risk_level === 'high' ? 'red' : draft.risk_level === 'medium' ? 'amber' : 'gray'}>{t('adminKnowledge.riskLevel', { level: draft.risk_level })}</StatusPill>
        </div>
      </div>

      {draft.review_reasons.length > 0 ? (
        <div className="rounded-2xl border border-honey-169 bg-honey-47 px-4 py-3">
          <SectionLabel>{t('adminKnowledge.whyReviewerNeeded')}</SectionLabel>
          <ul className="mt-1.5 space-y-0.5 text-xs text-honey-755">
            {draft.review_reasons.map((r) => {
              const key = reasonKeys[r]
              return <li key={r}>• {key ? t(key) : r.replace(/_/g, ' ')}</li>
            })}
          </ul>
        </div>
      ) : null}

      {draft.answer_status === 'processing' ? (
        <p className="flex items-center gap-2 text-sm text-ash-573" role="status">
          {spinner} {t('adminKnowledge.stillDrafting')}
        </p>
      ) : draft.failure_reason ? (
        <ErrorNote>{draft.failure_reason}</ErrorNote>
      ) : null}

      {draft.validated_draft || draft.draft ? (
        <div>
          <SectionLabel>{t('adminKnowledge.fromDocumentsDraft')}</SectionLabel>
          <RichText text={draft.validated_draft ?? draft.draft ?? ''} className="mt-2 rounded-2xl bg-ash-25 px-4 py-3 text-sm leading-relaxed" />
        </div>
      ) : null}

      {draft.partner_take ? (
        <div>
          <SectionLabel>
            {t('adminKnowledge.partnerTakeMeta', {
              partner: draft.partner_take.partner_id,
              score: Math.round(draft.partner_take.score * 100),
              method: draft.partner_take.method === 'adapted' ? t('adminKnowledge.takeAdapted') : t('adminKnowledge.takeOwnWords'),
            })}
          </SectionLabel>
          <PartnerTakeCard className="mt-2" text={draft.partner_take.text} />
          <p className="mt-1 text-[11px] text-ash-447">{t('adminKnowledge.partnerTakeHelp')}</p>
        </div>
      ) : null}

      {draft.structured && draft.structured.claims.length > 0 ? (
        <div>
          <SectionLabel>{t('adminKnowledge.sentenceBySentence')}</SectionLabel>
          <ul className="mt-2 space-y-2">
            {draft.structured.claims.map((claim, i) => {
              const cites = citations.filter((c) => c.claim_index === i)
              const verdict = support[String(i)]
              const claimIssues = issues.filter((x) => x.claim_index === i)
              return (
                <li key={i} className="rounded-xl border border-sand-73 px-3 py-2 text-xs">
                  <p className="text-[13px] text-ash-890">
                    {claim.kind === 'interpretation' ? <em className="text-ash-573">{t('adminKnowledge.interpretation')} </em> : null}
                    {claim.text}
                  </p>
                  {cites.map((c, k) => (
                    <CitationLine key={k} citation={c} onShow={() => showEvidence(c.marker)} />
                  ))}
                  {verdict ? (
                    <p className="mt-1 text-ash-573">
                      {t('adminKnowledge.supportCheck')} <strong className={verdict.verdict === 'supported' ? 'text-brand-strong' : 'text-rust-620'}>{verdict.verdict}</strong> — {verdict.reason}
                    </p>
                  ) : null}
                  {claimIssues.map((x, k) => (
                    <p key={k} className={`mt-1 ${x.severity === 'hard' ? 'text-rust-620' : 'text-honey-694'}`}>
                      • {x.detail}
                    </p>
                  ))}
                </li>
              )
            })}
          </ul>
          {issues
            .filter((x) => x.claim_index === null)
            .map((x, k) => (
              <p key={k} className={`mt-2 text-xs ${x.severity === 'hard' ? 'text-rust-620' : 'text-honey-694'}`}>
                • {x.detail}
              </p>
            ))}
          {draft.structured.regional_note ? <p className="mt-2 text-xs text-ash-639">{t('adminKnowledge.regionalNote', { note: draft.structured.regional_note })}</p> : null}
          {draft.structured.outdated_note ? <p className="mt-1 text-xs text-rust-620">{t('adminKnowledge.outdatedNote', { note: draft.structured.outdated_note })}</p> : null}
        </div>
      ) : null}

      {draft.evidence.length > 0 ? (
        <div ref={evidenceRef}>
          <SectionLabel>{t('adminKnowledge.evidenceGiven')}</SectionLabel>
          <ul className="mt-2 space-y-2">
            {draft.evidence.map((e) => (
              <EvidenceItem key={e.marker} evidence={e} focused={focusMarker === e.marker} />
            ))}
          </ul>
        </div>
      ) : null}

      <ErrorNote>{error}</ErrorNote>

      {open ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-sand-73 pt-4">
          <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => void run('assign', {}, t('adminKnowledge.assignedNotice'))}>
            {pending === 'assign' ? spinner : <UserRoundCheck size={16} aria-hidden />} {t('adminKnowledge.assignToMe')}
          </button>
          <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => setDialog('regenerate')}>
            <RefreshCw size={16} aria-hidden /> {t('adminKnowledge.regenerate')}
          </button>
          <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => setDialog('handoff')}>
            <UserRoundPlus size={16} aria-hidden /> {t('adminKnowledge.handOff')}
          </button>
          <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => setDialog('reject')}>
            <XCircle size={16} aria-hidden /> {t('adminKnowledge.reject')}
          </button>
          <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => setDialog('edit')}>
            <PenLine size={16} aria-hidden /> {t('adminKnowledge.edit')}
          </button>
          {sendable ? (
            <button
              type="button"
              className={primaryButton}
              disabled={pending !== '' || hardBlocked}
              title={hardBlocked ? t('adminKnowledge.hardBlockedTitle') : undefined}
              onClick={() => setDialog('approve')}
            >
              <Check size={16} aria-hidden /> {t('adminKnowledge.approveAndSend')}
            </button>
          ) : null}
        </div>
      ) : null}
      {hardBlocked && sendable ? <p className="text-right text-xs text-rust-620">{t('adminKnowledge.hardBlocked')}</p> : null}

      <History draft={draft} />

      {dialog ? (
        <ActionDialog action={dialog} draft={draft} pending={pending === dialog} onClose={() => setDialog(null)} onSubmit={(body, message) => void run(dialog, body, message)} />
      ) : null}
    </div>
  )
}
