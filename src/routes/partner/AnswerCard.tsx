import { useState } from 'react'
import { BookMarked, CircleAlert, CircleCheck, LoaderCircle, Pencil, Trash2 } from 'lucide-react'

import type { SavedAnswer } from '@/services/training'
import { inputClass, primaryButton, secondaryButton, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { trainingError } from '@/services/training'

/** Short date ("Nov 7, 2026") in the reader's locale. */
export function useFormatDate() {
  const { intl } = useI18n()
  return (value: string) => new Date(value).toLocaleDateString(intl, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** One saved question + answer, editable in place. */
export function AnswerCard({
  answer,
  onSave,
  onDelete,
}: {
  answer: SavedAnswer
  onSave: (text: string) => Promise<unknown>
  onDelete?: () => Promise<unknown>
}) {
  const { t } = useI18n()
  const formatDate = useFormatDate()
  const [confirm, confirmDialog] = useConfirm()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(answer.answer)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setPending(true)
    setError('')
    try {
      await action()
      after?.()
    } catch (caught) {
      setError(trainingError(caught, t('partner.saveChangeError')))
    } finally {
      setPending(false)
    }
  }

  async function onDeleteClick() {
    if (!onDelete) return
    const ok = await confirm({
      title: t('partner.deleteTitle'),
      description: t('partner.deleteBody'),
      confirmLabel: t('common.delete'),
      tone: 'danger',
    })
    if (ok) await run(onDelete)
  }

  const date = formatDate(answer.updatedAt ?? answer.savedAt)

  return (
    <article className="min-w-0 rounded-3xl border border-sand-86 bg-surface p-5">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed font-medium break-words">{answer.question}</p>
        <p className="shrink-0 text-[11px] text-ash-447">
          {answer.updatedAt ? t('partner.answerEdited', { date }) : t('partner.answerSaved', { date })}
        </p>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-brand">
        <BookMarked size={13} aria-hidden className="shrink-0" />
        <span className="min-w-0 break-words">{t('partner.sourcePage', { title: answer.source.title, page: answer.source.page })}</span>
      </p>
      <EmbeddingBadge answer={answer} />
      {error ? (
        <p role="alert" className="mt-2 text-xs text-rust-620">
          {error}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-3">
          <textarea
            rows={4}
            value={text}
            aria-label={t('partner.answerLabel')}
            onChange={(event) => setText(event.target.value)}
            className={`${inputClass} field-sizing-content h-auto min-h-[6rem] py-3 leading-relaxed`}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`${primaryButton} h-9 px-4`}
              disabled={!text.trim() || pending}
              onClick={() => void run(() => onSave(text), () => setEditing(false))}
            >
              {t('partner.saveAnswer')}
            </button>
            <button
              type="button"
              className={`${secondaryButton} h-9 px-4`}
              onClick={() => {
                setText(answer.answer)
                setEditing(false)
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 rounded-2xl bg-ash-25 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-ash-773">
            {answer.answer}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-ash-890 hover:underline"
              onClick={() => setEditing(true)}
            >
              <Pencil size={13} aria-hidden />
              {t('partner.editAnswer')}
            </button>
            {onDelete ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-rust-600 hover:underline"
                disabled={pending}
                onClick={() => void onDeleteClick()}
              >
                {pending ? <LoaderCircle size={13} className="animate-spin" aria-hidden /> : <Trash2 size={13} aria-hidden />}
                {t('common.delete')}
              </button>
            ) : null}
          </div>
        </>
      )}
    </article>
  )
}

/** Whether this answer is a preferred answer GabayMo uses for paid members' matching questions. */
function EmbeddingBadge({ answer }: { answer: SavedAnswer }) {
  const { t, tn } = useI18n()
  const { status, useCount, error } = answer.embedding
  if (status === 'embedded') {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-strong">
        <CircleCheck size={12} aria-hidden className="shrink-0" />
        {t('partner.embedded')}
        {useCount > 0 ? `${t('partner.separator')}${tn('partner.usedTimes', useCount)}` : ''}
      </p>
    )
  }
  if (status === 'failed') {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-rust-620">
        <CircleAlert size={12} aria-hidden className="shrink-0" />
        {error ?? t('partner.embedFailed')}
      </p>
    )
  }
  return (
    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ash-573">
      <LoaderCircle size={12} className="animate-spin" aria-hidden />
      {t('partner.embedPending')}
    </p>
  )
}
