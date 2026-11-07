import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'

import { ErrorNote, Field, inputClass, primaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'

export type PasswordChange = { current_password: string; password: string; password_confirmation: string }

/**
 * Current + new + confirm. Used by member settings, the partner profile
 * and the admin Security page; `submit` calls the area's endpoint.
 */
export function ChangePasswordForm({
  submit,
  minLength = 8,
  onDone,
  submitLabel,
}: {
  submit: (input: PasswordChange) => Promise<unknown>
  minLength?: number
  onDone?: () => void
  submitLabel?: string
}) {
  const { t } = useI18n()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setDone(false)
    if (next.length < minLength) return setError(t('security.passwordTooShort', { min: minLength }))
    if (next !== confirm) return setError(t('security.passwordMismatch'))
    if (next === current) return setError(t('security.passwordSame'))
    setPending(true)
    try {
      await submit({ current_password: current, password: next, password_confirmation: confirm })
      setCurrent('')
      setNext('')
      setConfirm('')
      setDone(true)
      onDone?.()
    } catch (caught) {
      setError(apiErrorMessage(caught, t('security.passwordError')))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
      <Field label={t('security.currentPassword')}>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label={t('security.newPassword')}>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={minLength}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label={t('security.confirmNewPassword')}>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={inputClass}
        />
      </Field>
      <p className="text-xs text-ash-573">{t('security.passwordHint', { min: minLength })}</p>
      <ErrorNote>{error}</ErrorNote>
      {done ? (
        <p role="status" className="text-sm text-brand">
          {t('security.passwordChanged')}
        </p>
      ) : null}
      <button type="submit" className={primaryButton} disabled={pending || !current || !next || !confirm}>
        {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
        {pending ? t('security.changingPassword') : (submitLabel ?? t('security.changePassword'))}
      </button>
    </form>
  )
}
