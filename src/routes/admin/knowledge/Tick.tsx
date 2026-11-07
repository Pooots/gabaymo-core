import { CircleCheck, CircleX } from 'lucide-react'

import { useI18n } from '@/i18n'

/** One citation check (passed / failed) with its label. */
export function Tick({ ok, label }: { ok: boolean; label: string }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex items-center gap-1 ${ok ? 'text-brand-strong' : 'text-rust-620'}`}>
      {ok ? <CircleCheck size={12} aria-hidden /> : <CircleX size={12} aria-hidden />} {label}
      <span className="sr-only">{ok ? t('adminKnowledge.checkPassed') : t('adminKnowledge.checkFailed')}</span>
    </span>
  )
}
