import { useState } from 'react'
import type { FormEvent } from 'react'

import { useI18n } from '@/i18n'

const empty = { name: '', email: '' }

/** "Give someone this role": invites a staff account on the selected role (they set their own password). Clears itself on success. */
export function RoleAccessForm({
  pending,
  inputClass,
  onSubmit,
}: {
  pending: boolean
  inputClass: string
  onSubmit: (person: { name: string; email: string }) => Promise<boolean>
}) {
  const { t } = useI18n()
  const [person, setPerson] = useState(empty)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const ok = await onSubmit({ name: person.name.trim(), email: person.email.trim() })
    if (ok) setPerson(empty)
  }

  return (
    <form className="mt-4 rounded-3xl border border-sand-86 bg-surface p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
      <h2 className="text-lg font-semibold">{t('admin.rolesGiveTitle')}</h2>
      <p className="mt-1 text-sm text-ash-573">{t('adminOps.staffInviteHelp')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          required
          aria-label={t('admin.colName')}
          placeholder={t('admin.colName')}
          autoComplete="off"
          value={person.name}
          onChange={(event) => setPerson({ ...person, name: event.target.value })}
          className={inputClass}
        />
        <input
          required
          type="email"
          aria-label={t('admin.email')}
          placeholder={t('admin.email')}
          autoComplete="off"
          value={person.email}
          onChange={(event) => setPerson({ ...person, email: event.target.value })}
          className={inputClass}
        />
      </div>
      <button type="submit" className="btn-primary mt-4 h-11 px-5" disabled={pending}>
        {t('adminOps.sendInvite')}
      </button>
    </form>
  )
}
