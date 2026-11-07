import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import type { DraftActionName } from './reasons'
import type { MessageKey } from '@/i18n'
import type { DraftDetail } from '@/services/ai'
import { ErrorNote, Modal, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'

const titles: Record<DraftActionName, MessageKey> = {
  approve: 'adminKnowledge.actionApproveTitle',
  reject: 'adminKnowledge.actionRejectTitle',
  edit: 'adminKnowledge.actionEditTitle',
  handoff: 'adminKnowledge.actionHandoffTitle',
  regenerate: 'adminKnowledge.actionRegenerateTitle',
  assign: 'adminKnowledge.actionAssignTitle',
}

/** Confirmation + note/edit form for a review action on a draft. */
export function ActionDialog({
  action,
  draft,
  pending,
  onClose,
  onSubmit,
}: {
  action: DraftActionName
  draft: DraftDetail
  pending: boolean
  onClose: () => void
  onSubmit: (body: Record<string, unknown>, message: string) => void
}) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const [answer, setAnswer] = useState(draft.validated_draft ?? draft.draft ?? '')
  const [confirmed, setConfirmed] = useState(false)
  const [includeTake, setIncludeTake] = useState(draft.include_partner_take ?? true)
  const [localError, setLocalError] = useState('')
  const needsConfirm = draft.answer_status === 'needs_confirmation'

  function submit() {
    setLocalError('')
    if (action === 'approve') {
      if (!confirmed) return setLocalError(t('adminKnowledge.approveTickRequired'))
      if (needsConfirm && note.trim().length < 3) return setLocalError(t('adminKnowledge.approveNoteRequired'))
      return onSubmit({ note: note.trim() || null, confirm: true, include_partner_take: includeTake }, t('adminKnowledge.approvedNotice'))
    }
    if (action === 'reject') {
      if (note.trim().length < 3) return setLocalError(t('adminKnowledge.rejectReasonRequired'))
      return onSubmit({ note: note.trim() }, t('adminKnowledge.rejectedNotice'))
    }
    if (action === 'edit') {
      if (answer.trim().length < 3) return setLocalError(t('adminKnowledge.answerEmpty'))
      return onSubmit({ answer: answer.trim(), note: note.trim() || null }, t('adminKnowledge.editedNotice'))
    }
    if (action === 'handoff') return onSubmit({ note: note.trim() || null }, t('adminKnowledge.handoffNotice'))
    if (action === 'regenerate') return onSubmit({ guidance: note.trim() || null }, t('adminKnowledge.regenerateNotice'))
  }

  const placeholder =
    action === 'regenerate'
      ? t('adminKnowledge.regenerateGuidance')
      : action === 'reject'
        ? t('adminKnowledge.reasonRequired')
        : needsConfirm && action === 'approve'
          ? t('adminKnowledge.whatYouChecked')
          : t('adminKnowledge.noteOptional')

  return (
    <Modal
      title={t(titles[action])}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={primaryButton} disabled={pending} onClick={submit}>
            {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null} {action === 'approve' ? t('adminKnowledge.sendToMember') : t('common.confirm')}
          </button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        {action === 'edit' ? (
          <>
            <p className="text-xs text-ash-573">{t('adminKnowledge.editHelp')}</p>
            <textarea
              rows={10}
              value={answer}
              aria-label={t('adminKnowledge.actionEditTitle')}
              onChange={(e) => setAnswer(e.target.value)}
              className={`${inputClass} h-auto py-3 leading-relaxed`}
            />
          </>
        ) : null}
        {action === 'approve' ? (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            {t('adminKnowledge.approveCheck')}
          </label>
        ) : null}
        {action === 'approve' && draft.partner_take ? (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={includeTake} onChange={(e) => setIncludeTake(e.target.checked)} />
            {t('adminKnowledge.includePartnerTake')}
          </label>
        ) : null}
        <textarea rows={3} value={note} aria-label={placeholder} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} className={`${inputClass} h-auto py-3`} />
        <ErrorNote>{localError}</ErrorNote>
      </div>
    </Modal>
  )
}
