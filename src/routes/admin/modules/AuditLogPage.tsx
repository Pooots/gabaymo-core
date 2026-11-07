import { Frame, LoadingState, QueryState } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useAuditLog } from '@/queries/admin'

export function AuditLogPage() {
  const { t, intl } = useI18n()
  const logs = useAuditLog()
  const time = new Intl.DateTimeFormat(intl, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <Frame title={t('admin.auditTitle')} text={t('admin.auditText')}>
      <div className="rounded-3xl border border-sand-86 bg-surface">
        <QueryState
          query={logs}
          compact
          loading={<LoadingState rows={4} label={t('admin.auditLoading')} className="p-4" />}
          isEmpty={(rows) => rows.length === 0}
          empty={<p className="px-6 py-10 text-sm text-ash-573">{t('admin.auditEmpty')}</p>}
        >
          {(rows) => (
            <ul>
              {rows.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-59 px-6 py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words">{log.summary}</p>
                    <p className="mt-1 text-xs tracking-wide break-all text-ash-447 uppercase">{log.action}</p>
                  </div>
                  <p className="text-xs text-ash-573">{log.at ? time.format(new Date(log.at)) : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </div>
    </Frame>
  )
}
