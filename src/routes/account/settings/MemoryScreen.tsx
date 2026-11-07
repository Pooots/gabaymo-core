import { LoaderCircle, Trash2 } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import type { MemoryItem } from '@/services/ai'
import { ErrorState, LoadingState, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useMemory, useMemoryActions } from '@/queries/member'
import { aiError } from '@/services/ai'

const CATEGORY_LABELS: Record<MemoryItem['category'], MessageKey> = {
  role: 'settings.memoryCategoryRole',
  school: 'settings.memoryCategorySchool',
  location: 'settings.memoryCategoryLocation',
  preference: 'settings.memoryCategoryPreference',
  other: 'settings.memoryCategoryOther',
}

export function MemoryScreen() {
  const { t } = useI18n()
  const memory = useMemory()
  const { setEnabled, remove, clear } = useMemoryActions()
  const [confirm, confirmDialog] = useConfirm()
  const busy = setEnabled.isPending || remove.isPending || clear.isPending
  const failed = setEnabled.error ?? remove.error ?? clear.error

  function resetErrors() {
    setEnabled.reset()
    remove.reset()
    clear.reset()
  }

  async function clearAll() {
    const ok = await confirm({
      title: t('settings.memoryClearTitle'),
      description: t('settings.memoryClearBody'),
      confirmLabel: t('settings.memoryClearConfirm'),
      tone: 'danger',
    })
    if (!ok) return
    resetErrors()
    clear.mutate()
  }

  if (memory.isPending) return <LoadingState rows={2} label={t('settings.memoryLoading')} />
  if (memory.isError) {
    return (
      <ErrorState
        compact
        title={t('settings.memoryLoadError')}
        message={aiError(memory.error, t('common.errorBody'))}
        error={memory.error}
        retrying={memory.isRefetching}
        onRetry={() => void memory.refetch()}
      />
    )
  }

  const state = memory.data
  return (
    <div className="max-w-xl space-y-4">
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3">
        <span>
          <span className="block text-sm font-medium text-moss-833">{t('settings.memoryUse')}</span>
          <span className="block text-xs leading-relaxed text-muted">
            {state.enabled ? t('settings.memoryOnHint') : t('settings.memoryOffHint')}
          </span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-brand"
          checked={state.enabled}
          disabled={busy || !state.available}
          onChange={(event) => {
            resetErrors()
            setEnabled.mutate(event.target.checked)
          }}
        />
      </label>

      {state.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-moss-129 px-4 py-6 text-center text-sm text-muted">{t('settings.memoryEmpty')}</p>
      ) : (
        <ul className="divide-y divide-ash-59 rounded-3xl border border-line bg-surface">
          {state.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-relaxed break-words text-moss-833">{item.fact}</span>
                <span className="block text-xs text-moss-433">{t(CATEGORY_LABELS[item.category])}</span>
              </span>
              <button
                type="button"
                aria-label={t('settings.memoryDeleteItem', { fact: item.fact })}
                disabled={busy}
                onClick={() => {
                  resetErrors()
                  remove.mutate(item.id)
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-rust-33 hover:text-rust-620 disabled:opacity-50"
              >
                {remove.isPending && remove.variables === item.id ? (
                  <LoaderCircle className="animate-spin" size={14} aria-hidden />
                ) : (
                  <Trash2 size={14} aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {failed ? (
        <p role="alert" className="text-sm text-rust-600">
          {aiError(failed, t('settings.memoryUpdateError'))}
        </p>
      ) : null}

      {state.items.length > 0 ? (
        <button type="button" className="text-sm font-medium text-rust-620 hover:underline disabled:opacity-60" disabled={busy} onClick={() => void clearAll()}>
          {clear.isPending ? t('settings.memoryClearing') : t('settings.memoryClear')}
        </button>
      ) : null}
      {confirmDialog}
    </div>
  )
}
