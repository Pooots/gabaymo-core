import { useEffect, useMemo, useState } from 'react'
import { Archive, ArrowDown, ArrowUp, History, LoaderCircle, Lock, Plus, Save } from 'lucide-react'

import { EffectiveCard } from './instructions/EffectiveCard'
import { HistoryModal } from './instructions/HistoryModal'
import type { LucideIcon } from 'lucide-react'
import type { Instruction } from '@/services/ai'
import { Banner, Card, CardTitle, ErrorNote, ErrorState, IconButton, LoadingState, Toggle, inputClass, primaryButton, useConfirm } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useInstructionActions, useInstructions } from '@/queries/adminKnowledge'
import { aiError } from '@/services/ai'

type Row = {
  key: string
  id: number | null
  title: string
  instruction_body: string
  is_active: boolean
  is_mandatory: boolean
  version: number
}

function toRow(i: Instruction): Row {
  return { key: `id-${i.id}`, id: i.id, title: i.title, instruction_body: i.instruction_body, is_active: i.is_active, is_mandatory: i.is_mandatory, version: i.version }
}

const EMPTY: Array<Instruction> = []
const rowButton = 'grid h-7 w-7 place-items-center rounded-full hover:bg-sand-53 disabled:opacity-30'

/**
 * Editable list of Service Instructions for one scope (global, or one
 * partner). Used by the admin page and the partner portal.
 */
export function InstructionEditor({ base, scope, partnerId, icon }: { base: 'admin' | 'partner'; scope: 'global' | 'partner'; partnerId: number | null; icon: LucideIcon }) {
  const { t } = useI18n()
  const query = useInstructions(base, scope, partnerId)
  const actions = useInstructionActions(base)
  const [confirm, confirmDialog] = useConfirm()
  const saved = query.data ?? EMPTY
  const [rows, setRows] = useState<Array<Row>>([])
  const [syncedFrom, setSyncedFrom] = useState<Array<Instruction> | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [history, setHistory] = useState<Instruction | null>(null)

  // Reset the editable copy whenever a fresh saved list arrives (first load, after save/archive).
  if (query.data && query.data !== syncedFrom) {
    setSyncedFrom(query.data)
    setRows(query.data.map(toRow))
  }

  const dirty = useMemo(() => {
    if (rows.length !== saved.length) return true
    return rows.some((row, index) => {
      const original = saved[index]
      return (
        !original ||
        original.id !== row.id ||
        original.title !== row.title ||
        original.instruction_body !== row.instruction_body ||
        original.is_active !== row.is_active ||
        original.is_mandatory !== row.is_mandatory
      )
    })
  }, [rows, saved])

  // Unsaved changes warning.
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function update(key: string, patch: Partial<Row>) {
    setNotice('')
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function move(index: number, delta: number) {
    const next = [...rows]
    const target = index + delta
    const a = next[index]
    const b = next[target]
    if (!a || !b) return
    next[index] = b
    next[target] = a
    setRows(next)
  }

  async function saveAll() {
    setError('')
    setNotice('')
    if (rows.some((r) => !r.title.trim() || r.instruction_body.trim().length < 3)) {
      setError(t('adminKnowledge.instructionsNeedTitle'))
      return
    }
    try {
      await actions.save.mutateAsync({ scope, partnerId, rows, saved })
      setNotice(t('adminKnowledge.instructionsSaved'))
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.instructionsSaveFailed')))
    }
  }

  async function archive(row: Row) {
    if (row.id === null) {
      setRows((current) => current.filter((r) => r.key !== row.key))
      return
    }
    const ok = await confirm({
      title: t('adminKnowledge.archiveInstructionTitle', { title: row.title }),
      description: t('adminKnowledge.archiveInstructionBody'),
      confirmLabel: t('adminKnowledge.archive'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      await actions.archive.mutateAsync(row.id)
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.archiveInstructionFailed')))
    }
  }

  const pending = actions.save.isPending
  const Icon = icon
  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">
        <CardTitle
          icon={Icon}
          action={
            <button type="button" className={primaryButton} disabled={pending || query.isPending || !dirty} onClick={() => void saveAll()}>
              {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />} {t('adminKnowledge.saveChanges')}
            </button>
          }
        >
          {scope === 'global' ? t('adminKnowledge.globalInstructions') : t('adminKnowledge.partnerInstructions')}
        </CardTitle>
        {dirty && query.isSuccess ? (
          <Banner tone="warning" className="mt-4">
            {t('adminKnowledge.unsavedChanges')}
          </Banner>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-brand-strong ring-1 ring-moss-128">
            {notice}
          </p>
        ) : null}
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>

        {query.isPending ? (
          <LoadingState className="py-4" label={t('adminKnowledge.instructionsLoading')} />
        ) : query.isError ? (
          <ErrorState error={query.error} title={t('adminKnowledge.instructionsLoadError')} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
        ) : (
          <div className="mt-5 space-y-5">
            {rows.length === 0 ? (
              <p className="text-sm text-ash-573">{scope === 'global' ? t('adminKnowledge.noGlobalInstructions') : t('adminKnowledge.noPartnerScopeInstructions')}</p>
            ) : null}
            {rows.map((row, index) => {
              const locked = row.is_mandatory && base === 'partner'
              return (
                <div key={row.key} className={row.is_active ? '' : 'opacity-60'}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sand-53 text-[10px] font-semibold text-ash-639">
                      {index + 1}
                    </span>
                    <input
                      value={row.title}
                      disabled={locked}
                      placeholder={t('adminKnowledge.instructionTitlePlaceholder')}
                      aria-label={t('adminKnowledge.instructionTitleLabel', { index: index + 1 })}
                      onChange={(e) => update(row.key, { title: e.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium outline-none hover:border-sand-86 focus:border-brand"
                    />
                    {row.id === null ? <span className="text-[11px] font-medium text-brand">{t('adminKnowledge.new')}</span> : <span className="text-[11px] text-ash-447">v{row.version}</span>}
                    {scope === 'global' ? (
                      <label className="flex items-center gap-1 text-[11px] text-ash-639" title={t('adminKnowledge.mandatoryHelp')}>
                        <input type="checkbox" checked={row.is_mandatory} onChange={(e) => update(row.key, { is_mandatory: e.target.checked })} />
                        <Lock size={11} aria-hidden /> {t('adminKnowledge.mandatory')}
                      </label>
                    ) : null}
                    <IconButton label={t('adminKnowledge.moveUp')} className={rowButton} disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp size={14} aria-hidden />
                    </IconButton>
                    <IconButton label={t('adminKnowledge.moveDown')} className={rowButton} disabled={index === rows.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown size={14} aria-hidden />
                    </IconButton>
                    {row.id !== null ? (
                      <IconButton label={t('adminKnowledge.history')} className={rowButton} onClick={() => setHistory(saved.find((s) => s.id === row.id) ?? null)}>
                        <History size={14} aria-hidden />
                      </IconButton>
                    ) : null}
                    <IconButton label={t('adminKnowledge.archive')} className={rowButton} disabled={row.is_mandatory} onClick={() => void archive(row)}>
                      <Archive size={14} aria-hidden />
                    </IconButton>
                    <Toggle
                      checked={row.is_active}
                      disabled={row.is_mandatory && row.is_active}
                      label={t('adminKnowledge.instructionActive', { title: row.title || t('adminKnowledge.instruction') })}
                      onChange={(next) => update(row.key, { is_active: next })}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={row.instruction_body}
                    disabled={locked}
                    aria-label={t('adminKnowledge.instructionBodyLabel', { index: index + 1 })}
                    placeholder={t('adminKnowledge.instructionBodyPlaceholder')}
                    onChange={(e) => update(row.key, { instruction_body: e.target.value })}
                    className={`${inputClass} field-sizing-content h-auto min-h-[5.5rem] py-3 leading-relaxed`}
                  />
                </div>
              )
            })}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-1 text-sm font-medium text-brand hover:underline"
              onClick={() => setRows((current) => [...current, { key: `new-${Date.now()}`, id: null, title: '', instruction_body: '', is_active: true, is_mandatory: false, version: 0 }])}
            >
              <Plus size={16} aria-hidden /> {t('adminKnowledge.addInstruction')}
            </button>
          </div>
        )}
      </Card>

      <EffectiveCard base={base} partnerId={partnerId} />

      {history ? <HistoryModal base={base} instruction={history} onClose={() => setHistory(null)} /> : null}
      {confirmDialog}
    </div>
  )
}
