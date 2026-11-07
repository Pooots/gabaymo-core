import { UserRound } from 'lucide-react'

import { RichText } from './RichText'
import { useI18n } from '@/i18n'

/**
 * "A partner's take": the second part of an answer, shown under "From the
 * documents". Practical guidance from a GabayMo partner's saved answer; it is
 * never a cited source.
 */
export function PartnerTakeCard({ text, className = '' }: { text: string; className?: string }) {
  const { t } = useI18n()
  return (
    <div className={`flex gap-3 ${className}`}>
      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-moss-861 text-white" aria-hidden>
        <UserRound size={14} />
      </span>
      <article className="min-w-0 flex-1 break-words rounded-2xl border border-sea-98 border-l-[3px] border-l-sea-565 bg-surface px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-sea-539 uppercase">{t('ask.partnerTake')}</p>
        <RichText text={text} className="mt-1.5 text-[15px] leading-relaxed text-moss-863" />
        <p className="mt-2 text-[11px] leading-relaxed text-sea-424">{t('ask.partnerTakeNote')}</p>
      </article>
    </div>
  )
}
