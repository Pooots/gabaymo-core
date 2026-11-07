import type { Instruction } from '@/services/ai'
import { ErrorState, LoadingState, Modal } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useInstructionVersions } from '@/queries/adminKnowledge'
import { formatDate } from '@/services/ai'

/** Earlier wordings of one instruction. */
export function HistoryModal({ base, instruction, onClose }: { base: 'admin' | 'partner'; instruction: Instruction; onClose: () => void }) {
  const { t } = useI18n()
  const query = useInstructionVersions(base, instruction.id)

  return (
    <Modal title={t('adminKnowledge.historyTitle', { title: instruction.title })} onClose={onClose}>
      {query.isPending ? (
        <LoadingState className="pb-4" />
      ) : query.isError ? (
        <ErrorState compact className="mb-4" error={query.error} title={t('adminKnowledge.historyLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
      ) : (
        <ul className="space-y-3 pb-4">
          {query.data.map((r) => (
            <li key={r.version} className="rounded-2xl border border-sand-73 p-3 text-sm">
              <p className="text-xs text-ash-573">
                v{r.version} · {r.change_type} · {r.changed_by_name ?? '—'} · {formatDate(r.created_at, true)}
              </p>
              <p className="mt-1 font-medium">{r.title}</p>
              <p className="mt-1 text-[13px] whitespace-pre-wrap text-ash-773">{r.instruction_body}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
