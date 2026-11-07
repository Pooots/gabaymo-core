import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'

import type { PartnerProfile } from '@/services/partners'
import { useI18n } from '@/i18n'
import { PRACTICE_AREA_KEYS, practiceAreaLabel } from '@/lib/practiceAreas'
import { useUpdatePartnerProfile } from '@/queries/partner'
import { partnerError } from '@/services/partners'

const field = 'mt-1.5 h-11 w-full rounded-xl border border-sand-125 bg-surface px-3 text-sm outline-none focus:border-brand'

/** Profile fields, started from the loaded profile. */
export function ProfileForm({ profile }: { profile: PartnerProfile }) {
  const { t } = useI18n()
  const update = useUpdatePartnerProfile()
  const [first, setFirst] = useState(profile.first_name ?? '')
  const [last, setLast] = useState(profile.last_name ?? '')
  const [mobile, setMobile] = useState(profile.mobile ?? '')
  const [specialty, setSpecialty] = useState(profile.specialty ?? '')
  const [hours, setHours] = useState(String(profile.response_hours))
  const [areas, setAreas] = useState<Array<string>>(profile.practice_areas ?? [])
  const [title, setTitle] = useState(profile.title ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url ?? '')

  function toggleArea(key: string, on: boolean) {
    setAreas((current) => (on ? [...current.filter((a) => a !== key), key] : current.filter((a) => a !== key)))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    update.reset()
    update.mutate({
      first_name: first.trim(),
      last_name: last.trim(),
      mobile: mobile.replace(/[\s-]/g, ''),
      specialty: specialty.trim(),
      response_hours: Number(hours),
      practice_areas: PRACTICE_AREA_KEYS.filter((key) => areas.includes(key)),
      title: title.trim() || null,
      bio: bio.trim() || null,
      photo_url: photoUrl.trim() || null,
    })
  }

  const pending = update.isPending

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-3">
      <label className="block text-sm">
        {t('partner.firstName')}
        <input value={first} onChange={(event) => setFirst(event.target.value)} required autoComplete="given-name" className={field} />
      </label>
      <label className="block text-sm">
        {t('partner.lastName')}
        <input value={last} onChange={(event) => setLast(event.target.value)} required autoComplete="family-name" className={field} />
      </label>
      <label className="block text-sm">
        {t('partner.mobileNumber')}
        <input
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
          required
          type="tel"
          autoComplete="tel"
          className={field}
        />
      </label>
      <label className="block text-sm">
        {t('partner.specialty')}
        <input
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          required
          placeholder={t('partner.specialtyPlaceholder')}
          className={field}
        />
      </label>
      <label className="block text-sm">
        {t('partner.responseWindow')}
        <input
          type="number"
          min={1}
          max={168}
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          required
          className={field}
        />
      </label>
      <fieldset className="pt-2">
        <legend className="text-sm">{t('partner.practiceAreas')}</legend>
        <p className="mt-1 text-xs text-muted">{t('partner.practiceAreasHint')}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PRACTICE_AREA_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-sand-125 bg-surface px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={areas.includes(key)}
                onChange={(event) => toggleArea(key, event.target.checked)}
              />
              {practiceAreaLabel(t, key)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        {t('partner.profileTitle')} ({t('common.optional')})
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder={t('partner.profileTitlePlaceholder')}
          className={field}
        />
      </label>
      <label className="block text-sm">
        {t('partner.profileBio')} ({t('common.optional')})
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={2000}
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-sand-125 bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <span className="mt-1 block text-xs text-muted">{t('partner.profileBioHint')}</span>
      </label>
      <label className="block text-sm">
        {t('partner.profilePhotoUrl')} ({t('common.optional')})
        <input
          type="url"
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          maxLength={2048}
          placeholder="https://"
          className={field}
        />
        <span className="mt-1 block text-xs text-muted">{t('partner.profilePhotoUrlHint')}</span>
      </label>
      {update.isError ? (
        <p role="alert" className="text-sm text-rust-600">
          {partnerError(update.error)}
        </p>
      ) : null}
      {update.isSuccess ? (
        <p role="status" className="text-sm text-brand">
          {t('partner.profileSaved')}
        </p>
      ) : null}
      <button type="submit" className="btn-primary mt-2" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
        {pending ? t('common.saving') : t('partner.saveProfile')}
      </button>
    </form>
  )
}
