import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { LoaderCircle } from 'lucide-react'
import { AccountShell } from './AccountShell'
import type { FormEvent, ReactNode } from 'react'

import type { AcceptInvitationInput, Invitation } from '@/services/account'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { PRACTICE_AREA_KEYS, practiceAreaLabel } from '@/lib/practiceAreas'
import { acceptInvitation, fetchInvitation } from '@/services/account'
import { writeAdminUser } from '@/services/adminAuth'
import { rememberMember } from '@/services/memberAuth'

const inputClass =
  'h-11 w-full rounded-xl border border-sand-125 bg-surface px-3 text-[14px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'

/** 410 `invitation_invalid`: unknown, expired, used, replaced or wrong email. */
function isInvalidInvitation(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 410
}

function Label({ text, children, hint }: { text: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-moss-833">{text}</span>
        {children}
      </label>
      {hint ? <p className="mt-1 text-[11px] text-moss-571">{hint}</p> : null}
    </div>
  )
}

/**
 * /setup-account?token=&email= from the invitation (or staff-sent reset)
 * email: partners and staff set their password, and on a first setup their
 * name (plus practice areas and an optional phone/title/bio for partners).
 */
export function SetupAccountPage() {
  const { t } = useI18n()
  const search = useSearch({ from: '/setup-account' })
  const token = search.token ?? ''
  const email = search.email ?? ''
  const complete = token !== '' && email !== ''

  const invitation = useQuery({
    queryKey: ['public', 'invitation', token, email],
    queryFn: () => fetchInvitation(token, email),
    enabled: complete,
    retry: (count, error) => !isInvalidInvitation(error) && count < 2,
    staleTime: Infinity,
  })
  const [invalidated, setInvalidated] = useState(false)

  const reset = invitation.data?.purpose === 'reset'
  const title = reset ? t('setup.titleReset') : t('setup.titleSetup')

  let body: ReactNode
  if (!complete) {
    body = <Notice title={t('setup.invalidTitle')} text={t('setup.missingLink')} />
  } else if (invalidated || (invitation.isError && isInvalidInvitation(invitation.error))) {
    body = <Notice title={t('setup.invalidTitle')} text={t('setup.invalidBody')} />
  } else if (invitation.isError) {
    body = (
      <div className="mt-6 space-y-3">
        <Notice title={t('setup.loadError')} text={apiErrorMessage(invitation.error, t('setup.loadError'))} />
        <button type="button" className="btn-primary h-11" onClick={() => void invitation.refetch()}>
          {t('common.retry')}
        </button>
      </div>
    )
  } else if (invitation.isPending) {
    body = (
      <p role="status" className="mt-6 flex items-center gap-2 text-sm text-moss-571">
        <LoaderCircle size={16} className="animate-spin" aria-hidden />
        {t('setup.loading')}
      </p>
    )
  } else {
    body = <SetupForm invitation={invitation.data} token={token} onInvalid={() => setInvalidated(true)} />
  }

  return (
    <AccountShell fit eyebrow={t('setup.eyebrow')} title={title} text={t('setup.heroText')}>
      {body}
    </AccountShell>
  )
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div role="alert" className="mt-6 rounded-2xl bg-rust-29 px-4 py-4 text-rust-600">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  )
}

function SetupForm({ invitation, token, onInvalid }: { invitation: Invitation; token: string; onInvalid: () => void }) {
  const { t, intl } = useI18n()
  const navigate = useNavigate()
  const partner = invitation.account_type === 'partner'
  const required = new Set(invitation.fields_required)
  const optional = new Set(invitation.fields_optional)
  const needsName = required.has('name')
  const needsAreas = required.has('practice_areas')
  const minLength = partner ? 8 : 10
  const options = (invitation.practice_area_options?.length ? invitation.practice_area_options : [...PRACTICE_AREA_KEYS]).filter(Boolean)

  const [name, setName] = useState(invitation.name ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [areas, setAreas] = useState<Array<string>>(invitation.prefill?.practice_areas ?? [])
  const [phone, setPhone] = useState(invitation.prefill?.phone ?? '')
  const [title, setTitle] = useState(invitation.prefill?.title ?? '')
  const [bio, setBio] = useState(invitation.prefill?.bio ?? '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const inviter = invitation.invited_by ? t('setup.invitedBy', { name: invitation.invited_by }) : ''
  const intro =
    invitation.purpose === 'reset'
      ? t('setup.introReset', { email: invitation.email })
      : partner
        ? t('setup.introPartner', { inviter })
        : t('setup.introAdmin', { role: invitation.role?.name ?? t('setup.roleFallback'), inviter })

  function toggle(key: string, on: boolean) {
    setAreas((current) => (on ? [...current.filter((a) => a !== key), key] : current.filter((a) => a !== key)))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (needsName && !name.trim()) return setError(t('setup.nameRequired'))
    if (password.length < minLength) return setError(t('setup.passwordTooShort', { min: minLength }))
    if (password !== confirm) return setError(t('setup.passwordMismatch'))
    if (needsAreas && areas.length === 0) return setError(t('setup.practiceAreasRequired'))

    const input: AcceptInvitationInput = { token, email: invitation.email, password, password_confirmation: confirm }
    if (needsName) input.name = name.trim()
    if (needsAreas) input.practice_areas = options.filter((key) => areas.includes(key))
    if (optional.has('phone') && phone.trim()) input.phone = phone.replace(/[\s-]/g, '')
    if (optional.has('title') && title.trim()) input.title = title.trim()
    if (optional.has('bio') && bio.trim()) input.bio = bio.trim()

    setPending(true)
    try {
      const result = await acceptInvitation(input)
      const notice = invitation.purpose === 'reset' ? 'password_reset' : 'account_ready'
      if (result.signed_in && result.account_type === 'partner') {
        rememberMember(result.user, 'partner')
        await navigate({ to: '/partner' })
      } else if (result.signed_in) {
        writeAdminUser(result.user)
        await navigate({ to: '/admin' })
      } else if (result.account_type === 'admin') {
        await navigate({ to: '/admin/login', search: { notice } })
      } else {
        await navigate({ to: '/login', search: { notice } })
      }
    } catch (caught) {
      if (isInvalidInvitation(caught)) {
        onInvalid()
        return
      }
      setError(apiErrorMessage(caught, t('setup.submitError')))
      setPending(false)
    }
  }

  return (
    <>
      <p className="mt-3 text-sm leading-relaxed text-moss-571">{intro}</p>
      {invitation.expires_at ? (
        <p className="mt-1 text-xs text-moss-571">
          {t('setup.expires', { when: new Date(invitation.expires_at).toLocaleString(intl, { dateStyle: 'medium', timeStyle: 'short' }) })}
        </p>
      ) : null}
      <form className="mt-5 space-y-3" onSubmit={(event) => void onSubmit(event)} noValidate>
        <Label text={t('setup.email')}>
          <input value={invitation.email} readOnly autoComplete="username" className={`${inputClass} bg-ash-41 text-moss-571`} />
        </Label>
        {needsName ? (
          <Label text={t('setup.name')}>
            <input value={name} maxLength={120} autoComplete="name" onChange={(event) => setName(event.target.value)} className={inputClass} />
          </Label>
        ) : null}
        <div className="grid gap-3 min-[400px]:grid-cols-2">
          <Label text={t('setup.password')} hint={t('setup.passwordHint', { min: minLength })}>
            <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </Label>
          <Label text={t('setup.confirmPassword')}>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className={inputClass} />
          </Label>
        </div>
        {needsAreas ? (
          <fieldset>
            <legend className="text-xs font-medium text-moss-833">{t('setup.practiceAreas')}</legend>
            <p className="mt-0.5 text-[11px] text-moss-571">{t('setup.practiceAreasHint')}</p>
            <div className="mt-2 grid gap-1.5 min-[400px]:grid-cols-2">
              {options.map((key) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border border-sand-125 bg-surface px-3 py-2 text-[13px]">
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={areas.includes(key)} onChange={(event) => toggle(key, event.target.checked)} />
                  {practiceAreaLabel(t, key)}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {optional.has('phone') || optional.has('title') ? (
          <div className="grid gap-3 min-[400px]:grid-cols-2">
            {optional.has('phone') ? (
              <Label text={`${t('setup.phone')} (${t('common.optional')})`}>
                <input value={phone} inputMode="tel" autoComplete="tel" placeholder="09171234567" onChange={(event) => setPhone(event.target.value)} className={inputClass} />
              </Label>
            ) : null}
            {optional.has('title') ? (
              <Label text={`${t('setup.title')} (${t('common.optional')})`}>
                <input value={title} maxLength={120} placeholder={t('setup.titlePlaceholder')} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
              </Label>
            ) : null}
          </div>
        ) : null}
        {optional.has('bio') ? (
          <Label text={`${t('setup.bio')} (${t('common.optional')})`}>
            <textarea
              value={bio}
              maxLength={2000}
              rows={3}
              placeholder={t('setup.bioPlaceholder')}
              onChange={(event) => setBio(event.target.value)}
              className="w-full resize-none rounded-xl border border-sand-125 bg-surface px-3 py-2 text-[14px] leading-relaxed outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </Label>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-xl bg-rust-29 px-3 py-2 text-sm text-rust-600">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary h-11 w-full justify-center" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
          {pending ? t('setup.submitting') : invitation.purpose === 'reset' ? t('setup.submitReset') : t('setup.submitSetup')}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link to={partner ? '/login' : '/admin/login'} className="font-medium text-brand">
          {t('auth.backToSignIn')}
        </Link>
      </p>
    </>
  )
}
