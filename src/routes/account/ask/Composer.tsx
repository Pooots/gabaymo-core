import { ArrowUp } from 'lucide-react'
import type { FormEvent } from 'react'

import { useI18n } from '@/i18n'

export function Composer({
  draft,
  setDraft,
  onSubmit,
  disabled = false,
}: {
  draft: string
  setDraft: (value: string) => void
  onSubmit: (event: FormEvent) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-surface bg-surface pr-2 pl-5 shadow-[0_18px_50px_-28px_rgba(23,48,38,0.45)]"
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t('ask.placeholder')}
        aria-label={t('ask.placeholder')}
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-moss-433"
      />
      <button
        type="submit"
        disabled={disabled || !draft.trim()}
        aria-label={t('ask.submit')}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white disabled:bg-moss-137"
      >
        <ArrowUp size={18} aria-hidden />
      </button>
    </form>
  )
}
