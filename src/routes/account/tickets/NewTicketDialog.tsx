import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'

import { Modal } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { PRACTICE_AREA_KEYS, practiceAreaLabel } from '@/lib/practiceAreas'
import { useTicketActions } from '@/queries/member'

/** "New ticket" form in a focus-trapped modal. Escape / Cancel close it (not while sending). */
export function NewTicketDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { create } = useTicketActions()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [area, setArea] = useState('')
  const saving = create.isPending

  function close() {
    if (saving) return
    onClose()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    create.mutate({ subject: subject.trim(), body: body.trim(), practice_area: area || null }, { onSuccess: onClose })
  }

  return (
    <Modal title={t('tickets.newTitle')} onClose={close} size="max-w-lg">
      <form autoComplete="off" onSubmit={onSubmit} className="pb-4">
        <label className="block text-sm font-medium" htmlFor="ticket-subject">
          {t('tickets.subject')}
        </label>
        <input
          id="ticket-subject"
          data-autofocus
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
          maxLength={160}
          autoComplete="off"
          placeholder={t('tickets.subjectPlaceholder')}
          className="mt-2 h-11 w-full rounded-2xl border border-moss-98 bg-ash-14 px-4 text-sm outline-none focus:border-brand"
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="ticket-area">
          {t('tickets.area')}
        </label>
        <select
          id="ticket-area"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          aria-describedby="ticket-area-hint"
          className="mt-2 h-11 w-full rounded-2xl border border-moss-98 bg-ash-14 px-4 text-sm outline-none focus:border-brand"
        >
          <option value="">{t('tickets.areaNotSure')}</option>
          {PRACTICE_AREA_KEYS.map((key) => (
            <option key={key} value={key}>
              {practiceAreaLabel(t, key)}
            </option>
          ))}
        </select>
        <p id="ticket-area-hint" className="mt-1 text-xs text-muted">
          {t('tickets.areaHint')}
        </p>
        <label className="mt-4 block text-sm font-medium" htmlFor="ticket-body">
          {t('tickets.body')}
        </label>
        <textarea
          id="ticket-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          maxLength={4000}
          rows={5}
          placeholder={t('tickets.bodyPlaceholder')}
          className="mt-2 w-full resize-none rounded-2xl border border-moss-98 bg-ash-14 px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand"
        />
        {create.isError ? (
          <p role="alert" className="mt-3 text-sm text-rust-580">
            {apiErrorMessage(create.error, t('tickets.createError'))}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="h-11 rounded-full px-4 text-sm font-medium text-muted" onClick={close}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary h-11">
            {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('tickets.submit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
