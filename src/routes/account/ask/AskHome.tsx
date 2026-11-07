import { Composer } from './Composer'
import type { FormEvent } from 'react'
import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const STARTERS: Array<MessageKey> = ['ask.starter1', 'ask.starter2', 'ask.starter3']

/** "Where should we start?" — the empty ask screen with starter prompts. */
export function AskHome({
  firstName,
  draft,
  setDraft,
  onSubmit,
  asking,
  error,
}: {
  firstName: string
  draft: string
  setDraft: (value: string) => void
  onSubmit: (event: FormEvent) => void
  asking: boolean
  error: string
}) {
  const { t } = useI18n()
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-5">
      <h1 className="serif text-center text-[2.2rem] leading-none font-medium tracking-[-0.03em] text-moss-863 sm:text-5xl">
        {t('ask.homeTitle')}
      </h1>
      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-muted">{t('ask.homeBody', { name: firstName })}</p>
      <Composer draft={draft} setDraft={setDraft} onSubmit={onSubmit} disabled={asking} />
      {error ? (
        <p role="alert" className="mt-3 max-w-xl text-center text-sm text-rust-620">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
        {STARTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setDraft(t(key))}
            className="max-w-full rounded-full border border-moss-98 bg-surface/80 px-3 py-1.5 text-left text-[13px] text-moss-731 hover:border-moss-220"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  )
}
