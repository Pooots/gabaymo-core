import { ErrorState, LoadingState, StatusPill } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocumentVersions } from '@/queries/adminKnowledge'
import { formatDate } from '@/services/ai'

export function VersionList({ documentId }: { documentId: string }) {
  const { t } = useI18n()
  const query = useDocumentVersions(documentId)

  if (query.isPending) return <LoadingState className="py-6" label={t('adminKnowledge.versionsLoading')} />
  if (query.isError) {
    return <ErrorState compact error={query.error} title={t('adminKnowledge.versionsLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
  }

  return (
    <ul className="space-y-3">
      {query.data.map((v) => (
        <li key={v.id} className="rounded-2xl border border-sand-73 bg-surface p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{t('adminKnowledge.versionNumber', { version: v.version_number })}</span>
            <span className="text-xs text-ash-573">
              {v.change_type.replace(/_/g, ' ')} · {formatDate(v.created_at, true)} · {v.uploaded_by_name ?? '—'}
            </span>
            {v.is_published ? <StatusPill tone="green">{t('adminKnowledge.live')}</StatusPill> : null}
            {v.is_current ? <StatusPill tone="amber">{t('adminKnowledge.current')}</StatusPill> : null}
            <StatusPill tone="gray">
              {v.review.status.replace(/_/g, ' ')} · {v.publication.status}
            </StatusPill>
          </div>
          {v.change_note ? <p className="mt-1 text-xs text-ash-573">{v.change_note}</p> : null}
          <ul className="mt-2 space-y-1 border-l-2 border-sand-86 pl-3">
            {(v.review.history ?? []).map((h, i) => (
              <li key={i} className="text-xs text-ash-773">
                <span className="font-medium">{h.decision.replace(/_/g, ' ')}</span> · {h.reviewer_name ?? t('adminKnowledge.system')} · {formatDate(h.created_at, true)}
                {h.note ? <span className="text-ash-573"> — {h.note}</span> : null}
                {h.exception_reason ? <span className="text-rust-620"> {t('adminKnowledge.selfApprovalException', { reason: h.exception_reason })}</span> : null}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
