import { useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'

import { primaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocumentAction } from '@/queries/adminKnowledge'
import { aiError, formatDate } from '@/services/ai'

export function PublishFailure({ documentId, error, onRetried }: { documentId: string; error: { message: string; at: string | null } | null; onRetried: () => Promise<void> }) {
  const { t } = useI18n()
  const action = useDocumentAction()
  const [note, setNote] = useState('')

  async function retry() {
    setNote('')
    try {
      await action.mutateAsync({ id: documentId, action: 'retry-publish' })
      setNote(t('adminKnowledge.publishRetrying'))
      await onRetried()
    } catch (caught) {
      setNote(aiError(caught, t('adminKnowledge.publishRetryFailed')))
    }
  }

  return (
    <div className="rounded-2xl border border-rust-124 bg-rust-33 px-4 py-3 text-[13px] leading-relaxed text-rust-708">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('adminKnowledge.publishFailedTitle')}</p>
          <p className="mt-1 break-words">{error?.message ?? t('adminKnowledge.publishNoDetail')}</p>
          {error?.at ? <p className="mt-1 text-[11px] text-rust-545">{t('adminKnowledge.publishLastAttempt', { date: formatDate(error.at, true) })}</p> : null}
        </div>
        <button type="button" className={primaryButton} disabled={action.isPending} onClick={() => void retry()}>
          {action.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />} {t('adminKnowledge.retryPublishing')}
        </button>
      </div>
      {note ? (
        <p className="mt-2 text-xs" role="status">
          {note}
        </p>
      ) : null}
    </div>
  )
}
