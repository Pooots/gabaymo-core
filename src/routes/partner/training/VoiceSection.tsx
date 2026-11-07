import { useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'

import { useFormatDate } from '../AnswerCard'
import type { useTrainingVoice } from '@/queries/partner'
import { ErrorState, Skeleton, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useTrainingActions } from '@/queries/partner'
import { trainingError } from '@/services/training'

/** "Your voice": the style description GabayMo writes the partner's take with. */
export function VoiceSection({
  voice,
  answersCount,
  minAnswers,
}: {
  voice: ReturnType<typeof useTrainingVoice>
  answersCount: number
  minAnswers: number
}) {
  const { t, tn } = useI18n()
  const formatDate = useFormatDate()
  const { saveVoice, rebuildVoice } = useTrainingActions()
  // null = not edited: the textarea shows the saved voice.
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState('')

  const profile = voice.data
  const value = draft ?? profile?.text ?? ''
  const changed = profile !== undefined && value.trim() !== profile.text
  const busy = saveVoice.isPending || rebuildVoice.isPending

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError('')
    try {
      await action()
      setDraft(null)
    } catch (caught) {
      setError(trainingError(caught, fallback))
    }
  }

  const status = profile?.updatedAt
    ? profile.source === 'edited'
      ? t('partner.voiceEdited', { date: formatDate(profile.updatedAt) })
      : t('partner.voiceUpdated', { date: formatDate(profile.updatedAt) })
    : t('partner.voiceNotSet')

  return (
    <section className="rounded-3xl border border-moss-149 bg-ash-27 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-[15px] font-semibold">{t('partner.voiceTitle')}</h2>
        {profile ? <span className="text-xs text-ash-573">{status}</span> : null}
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{t('partner.voiceHelp')}</p>
      {voice.isPending ? (
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      ) : voice.isError ? (
        <ErrorState
          className="mt-4"
          compact
          title={t('partner.voiceLoadError')}
          error={voice.error}
          retrying={voice.isRefetching}
          onRetry={() => void voice.refetch()}
        />
      ) : (
        <textarea
          rows={3}
          value={value}
          aria-label={t('partner.voiceLabel')}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('partner.voicePlaceholder', { count: minAnswers })}
          className={`${inputClass} mt-4 field-sizing-content h-auto min-h-[6rem] bg-surface py-3 leading-relaxed`}
        />
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rust-620">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${primaryButton} h-9 px-4`}
          disabled={!changed || value.trim().length < 10 || busy}
          onClick={() => void run(() => saveVoice.mutateAsync(value), t('partner.voiceSaveError'))}
        >
          {saveVoice.isPending ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : null}
          {t('partner.voiceSave')}
        </button>
        <button
          type="button"
          className={`${secondaryButton} h-9 px-4`}
          disabled={answersCount < minAnswers || busy}
          onClick={() => void run(() => rebuildVoice.mutateAsync(), t('partner.voiceRebuildError'))}
        >
          {rebuildVoice.isPending ? (
            <LoaderCircle size={14} className="animate-spin" aria-hidden />
          ) : (
            <RefreshCw size={14} aria-hidden />
          )}
          {t('partner.voiceRebuild')}
        </button>
        {answersCount < minAnswers ? (
          <span className="text-xs text-ash-573">{tn('partner.moreAnswers', minAnswers - answersCount)}</span>
        ) : null}
      </div>
    </section>
  )
}
