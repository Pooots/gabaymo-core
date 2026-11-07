import { useState } from 'react'
import { BellRing, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatWhen } from '../format'
import type { FormEvent } from 'react'

import type { Reminder, ReminderInput } from '@/services/account'
import { EmptyState, ErrorNote, ErrorState, Field, IconButton, LoadingState, Modal, Pagination, inputClass, secondaryButton, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useReminderActions, useReminders } from '@/queries/member'

/** Prefill for a new reminder (e.g. from an answer: its question + conversation). */
export type ReminderDraft = { title?: string; notes?: string; conversation_id?: string | null }

/** `datetime-local` value (local time, minutes) ↔ ISO string. */
function toLocalInput(value: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function defaultDue() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(8, 0, 0, 0)
  return toLocalInput(date)
}

export function RemindersScreen() {
  const { t, intl } = useI18n()
  const [page, setPage] = useState(1)
  const reminders = useReminders(page)
  const { remove } = useReminderActions()
  const [confirm, confirmDialog] = useConfirm()
  const [editing, setEditing] = useState<Reminder | 'new' | null>(null)
  const now = Date.now()

  async function onDelete(reminder: Reminder) {
    const ok = await confirm({
      title: t('memberAccount.reminderDeleteTitle'),
      description: t('memberAccount.reminderDeleteBody', { title: reminder.title }),
      confirmLabel: t('common.delete'),
      tone: 'danger',
    })
    if (ok) remove.mutate(reminder.id)
  }

  const addButton = (
    <button type="button" className="btn-primary h-11" onClick={() => setEditing('new')}>
      <Plus size={16} aria-hidden />
      {t('memberAccount.reminderAdd')}
    </button>
  )

  return (
    <div>
      <div className="mb-4 flex justify-end">{addButton}</div>
      {remove.isError ? (
        <p role="alert" className="mb-3 text-sm text-rust-600">
          {apiErrorMessage(remove.error, t('memberAccount.reminderDeleteError'))}
        </p>
      ) : null}
      {reminders.isPending ? (
        <LoadingState rows={3} />
      ) : reminders.isError ? (
        <ErrorState compact error={reminders.error} onRetry={() => void reminders.refetch()} retrying={reminders.isRefetching} />
      ) : reminders.data.data.length === 0 ? (
        <EmptyState icon={BellRing} title={t('memberAccount.remindersEmptyTitle')} className="py-12">
          {t('memberAccount.remindersEmpty')}
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-2">
            {reminders.data.data.map((reminder) => {
              const past = new Date(reminder.due_at).getTime() < now
              return (
                <li key={reminder.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                  <BellRing size={16} aria-hidden className={`mt-0.5 shrink-0 ${past ? 'text-moss-433' : 'text-brand'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium break-words ${past ? 'text-moss-555' : ''}`}>{reminder.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {past
                        ? t('memberAccount.reminderWasDue', { when: formatWhen(reminder.due_at, intl, true) })
                        : t('memberAccount.reminderDue', { when: formatWhen(reminder.due_at, intl, true) })}
                    </p>
                    {reminder.notes ? <p className="mt-1 text-xs leading-relaxed break-words whitespace-pre-wrap text-moss-731">{reminder.notes}</p> : null}
                  </div>
                  <IconButton label={t('memberAccount.reminderEdit', { title: reminder.title })} onClick={() => setEditing(reminder)}>
                    <Pencil size={15} aria-hidden />
                  </IconButton>
                  <IconButton label={t('memberAccount.reminderDelete', { title: reminder.title })} onClick={() => void onDelete(reminder)} disabled={remove.isPending}>
                    <Trash2 size={15} aria-hidden />
                  </IconButton>
                </li>
              )
            })}
          </ul>
          <Pagination meta={reminders.data.meta} onPage={setPage} disabled={reminders.isFetching} />
        </>
      )}
      {editing ? <ReminderDialog reminder={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
      {confirmDialog}
    </div>
  )
}

/** Create (reminder null, optional prefill) or edit a reminder. */
export function ReminderDialog({
  reminder,
  draft,
  onClose,
  onSaved,
}: {
  reminder: Reminder | null
  draft?: ReminderDraft
  onClose: () => void
  onSaved?: (reminder: Reminder) => void
}) {
  const { t } = useI18n()
  const { create, update } = useReminderActions()
  const [title, setTitle] = useState(reminder?.title ?? draft?.title?.slice(0, 160) ?? '')
  const [due, setDue] = useState(reminder ? toLocalInput(new Date(reminder.due_at)) : defaultDue())
  const [notes, setNotes] = useState(reminder?.notes ?? draft?.notes?.slice(0, 2000) ?? '')
  const [error, setError] = useState('')
  const saving = create.isPending || update.isPending

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const when = new Date(due)
    if (!title.trim()) return setError(t('memberAccount.reminderTitleRequired'))
    if (Number.isNaN(when.getTime())) return setError(t('memberAccount.reminderDueRequired'))
    if (!reminder && when.getTime() <= Date.now()) return setError(t('memberAccount.reminderDueFuture'))
    const input: ReminderInput = { title: title.trim(), due_at: when.toISOString(), notes: notes.trim() || null }
    try {
      const saved = reminder
        ? await update.mutateAsync({ id: reminder.id, reminder: input })
        : await create.mutateAsync({ ...input, conversation_id: draft?.conversation_id ?? null })
      onSaved?.(saved)
      onClose()
    } catch (caught) {
      setError(apiErrorMessage(caught, t('memberAccount.reminderSaveError')))
    }
  }

  return (
    <Modal
      size="max-w-md"
      title={reminder ? t('memberAccount.reminderEditTitle') : t('memberAccount.reminderNewTitle')}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="reminder-form" className="btn-primary h-11" disabled={saving}>
            {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('common.save')}
          </button>
        </>
      }
    >
      <form id="reminder-form" className="space-y-4 pb-2" onSubmit={(event) => void onSubmit(event)} noValidate>
        <Field label={t('memberAccount.reminderTitle')}>
          <input data-autofocus value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </Field>
        <Field label={t('memberAccount.reminderDueLabel')}>
          <input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} className={inputClass} />
        </Field>
        <Field label={`${t('memberAccount.reminderNotes')} (${t('common.optional')})`}>
          <textarea
            value={notes}
            maxLength={2000}
            rows={4}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full resize-none rounded-2xl border border-sand-124 bg-ash-14 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </Field>
        <p className="text-xs text-muted">{t('memberAccount.reminderHint')}</p>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Modal>
  )
}
