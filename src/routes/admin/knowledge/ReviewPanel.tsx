import { useState } from 'react'
import { Check, LoaderCircle, Undo2, XCircle } from 'lucide-react'

import type { DocumentDetail as Detail } from '@/services/ai'
import { Banner, ErrorNote, SectionLabel, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useReviewDecision } from '@/queries/adminKnowledge'
import { aiError, formatDate } from '@/services/ai'

type Decision = 'approve' | 'return' | 'reject'

/** Source Review checklist + approve / return / reject for the current version. */
export function ReviewPanel({ detail, onDone }: { detail: Detail; onDone: (message: string) => Promise<void> }) {
  const { t } = useI18n()
  const version = detail.current_version
  const mutation = useReviewDecision()
  const [checks, setChecks] = useState({ source_authenticity_checked: false, applicability_verified: false, ocr_text_verified: false })
  const [note, setNote] = useState('')
  const [exception, setException] = useState('')
  const [pending, setPending] = useState<'' | Decision>('')
  const [error, setError] = useState('')

  if (!version) return null
  const current = version
  const reviewable = current.review.status === 'awaiting_review'
  const returned = current.review.status === 'returned'
  const blocking = detail.readiness.filter((r) => r.blocking)
  const hasOcr = (current.processing.summary?.ocr_pages ?? 0) > 0
  const title = detail.document.title

  async function decide(decision: Decision) {
    setError('')
    if (decision !== 'approve' && note.trim().length < 3) {
      setError(t('adminKnowledge.reviewNoteRequired'))
      return
    }
    setPending(decision)
    try {
      await mutation.mutateAsync({
        id: detail.document.id,
        decision,
        body:
          decision === 'approve'
            ? {
                version_id: current.id,
                fingerprint: current.review.fingerprint,
                checklist: { ...checks, text_readable: true },
                note: note.trim() || null,
                self_approval_reason: exception.trim() || null,
              }
            : { version_id: current.id, note: note.trim() },
      })
      await onDone(
        decision === 'approve'
          ? t('adminKnowledge.reviewApproved', { version: current.version_number, title })
          : decision === 'return'
            ? t('adminKnowledge.reviewReturned', { title })
            : t('adminKnowledge.reviewRejected', { title }),
      )
      setNote('')
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.reviewFailed')))
    } finally {
      setPending('')
    }
  }

  if (!reviewable && !returned) {
    return current.review.status === 'approved' ? (
      <Banner>
        {t('adminKnowledge.approvedBy', { name: current.review.approved_by_name ?? t('adminKnowledge.aReviewer'), date: formatDate(current.review.approved_at, true) })}
        {current.review.note ? ` — “${current.review.note}”` : ''}. {t('adminKnowledge.publicationStatus', { status: current.publication.status })}
      </Banner>
    ) : null
  }

  const spinner = <LoaderCircle size={16} className="animate-spin" aria-hidden />

  return (
    <div className="rounded-2xl border border-moss-128 bg-ash-27 p-4">
      <SectionLabel>{t('adminKnowledge.reviewVersion', { version: current.version_number })}</SectionLabel>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <CheckItem
          label={t('adminKnowledge.checkAuthenticity')}
          checked={checks.source_authenticity_checked}
          onChange={(v) => setChecks({ ...checks, source_authenticity_checked: v })}
        />
        <CheckItem label={t('adminKnowledge.checkApplicability')} checked={checks.applicability_verified} onChange={(v) => setChecks({ ...checks, applicability_verified: v })} />
        {hasOcr ? <CheckItem label={t('adminKnowledge.checkOcr')} checked={checks.ocr_text_verified} onChange={(v) => setChecks({ ...checks, ocr_text_verified: v })} /> : null}
      </div>
      {blocking.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {blocking.map((r) => (
            <li key={r.code} className="text-xs text-rust-620">
              • {r.message}
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        rows={2}
        value={note}
        maxLength={2000}
        aria-label={t('adminKnowledge.reviewNoteLabel')}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('adminKnowledge.reviewNotePlaceholder')}
        className={`${inputClass} mt-3 h-auto py-3`}
      />
      <details className="mt-2 text-xs text-ash-573">
        <summary className="cursor-pointer">{t('adminKnowledge.selfApprovalSummary')}</summary>
        <input
          value={exception}
          aria-label={t('adminKnowledge.selfApprovalPlaceholder')}
          onChange={(e) => setException(e.target.value)}
          placeholder={t('adminKnowledge.selfApprovalPlaceholder')}
          className={`${inputClass} mt-2 h-9`}
        />
      </details>
      <div className="mt-2">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => void decide('reject')}>
          {pending === 'reject' ? spinner : <XCircle size={16} aria-hidden />} {t('adminKnowledge.reject')}
        </button>
        <button type="button" className={secondaryButton} disabled={pending !== ''} onClick={() => void decide('return')}>
          {pending === 'return' ? spinner : <Undo2 size={16} aria-hidden />} {t('adminKnowledge.returnWithNote')}
        </button>
        {reviewable ? (
          <button
            type="button"
            className={primaryButton}
            disabled={pending !== '' || !checks.source_authenticity_checked || !checks.applicability_verified}
            onClick={() => void decide('approve')}
          >
            {pending === 'approve' ? spinner : <Check size={16} aria-hidden />} {t('adminKnowledge.approveVersion', { version: current.version_number })}
          </button>
        ) : null}
      </div>
      {returned ? <p className="mt-2 text-xs text-ash-573">{t('adminKnowledge.returnedHelp')}</p> : null}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-xs ring-1 ring-sand-124">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
