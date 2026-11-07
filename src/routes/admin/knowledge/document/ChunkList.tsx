import { ErrorState, LoadingState, StatusPill } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocumentChunks } from '@/queries/adminKnowledge'

export function ChunkList({ documentId, versionId }: { documentId: string; versionId: string }) {
  const { t } = useI18n()
  const query = useDocumentChunks(documentId, versionId)

  if (query.isPending) return <LoadingState className="py-6" label={t('adminKnowledge.chunksLoading')} />
  if (query.isError) {
    return <ErrorState compact error={query.error} title={t('adminKnowledge.chunksLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
  }
  if (query.data.length === 0) return <p className="py-10 text-center text-sm text-ash-573">{t('adminKnowledge.noChunks')}</p>

  return (
    <ul className="space-y-2">
      {query.data.map((c) => (
        <li key={c.id} className="rounded-2xl border border-sand-73 bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ash-573">
            <span className="font-semibold text-ash-890">#{c.chunk_index + 1}</span>
            <span>
              p.{c.page_start}
              {c.page_end !== c.page_start ? `–${c.page_end}` : ''}
            </span>
            {c.section_heading ? <span>· {c.section_heading}</span> : null}
            {c.paragraph_ref ? <span>· ¶ {c.paragraph_ref}</span> : null}
            <span>· {t('adminKnowledge.tokens', { count: c.token_count })}</span>
            <StatusPill tone={c.index_status === 'published' ? 'green' : 'gray'}>{c.index_status}</StatusPill>
          </div>
          <p className="mt-2 line-clamp-6 text-[13px] leading-relaxed whitespace-pre-wrap text-ash-773">{c.text}</p>
        </li>
      ))}
    </ul>
  )
}
