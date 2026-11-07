import { useState } from 'react'
import { ChevronDown, LoaderCircle } from 'lucide-react'

import type { MemberProfile } from '@/services/memberAuth'
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useUpdateRegion } from '@/queries/member'

export function RegionForm({ member, onMember }: { member: MemberProfile | null; onMember: (member: MemberProfile) => void }) {
  const { t } = useI18n()
  const update = useUpdateRegion()
  // Local choice; null = follow the saved profile.
  const [choice, setChoice] = useState<string | null>(null)
  const region = choice ?? member?.region ?? ''
  const pending = update.isPending

  function save() {
    update.mutate(region, {
      onSuccess: (next) => {
        onMember(next)
        setChoice(null)
      },
    })
  }

  return (
    <div className="max-w-md">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">{t('settings.regionTitle')}</span>
        <span className="relative block">
          <select
            value={region}
            onChange={(event) => {
              setChoice(event.target.value)
              update.reset()
            }}
            className="h-12 w-full appearance-none rounded-2xl border border-sand-125 bg-surface px-4 pr-10 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          >
            <option value="" disabled>
              {t('settings.regionPlaceholder')}
            </option>
            {PHILIPPINE_REGIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-moss-571" />
        </span>
      </label>
      {update.isError ? (
        <p role="alert" className="mt-3 text-sm text-rust-600">
          {apiErrorMessage(update.error, t('settings.regionError'))}
        </p>
      ) : null}
      {update.isSuccess ? (
        <p role="status" className="mt-3 text-sm text-brand">
          {t('settings.regionSaved')}
        </p>
      ) : null}
      <button type="button" className="btn-primary mt-5 h-11" disabled={pending || !region || region === member?.region} onClick={save}>
        {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : null}
        {pending ? t('common.saving') : t('settings.regionSave')}
      </button>
    </div>
  )
}
