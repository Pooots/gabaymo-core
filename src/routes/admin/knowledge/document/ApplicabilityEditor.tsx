import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import type { Region, RegionRow, VersionDetail } from '@/services/ai'
import { ErrorNote, Field, Modal, SectionLabel, Select, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useUpdateApplicability } from '@/queries/adminKnowledge'
import { aiError } from '@/services/ai'

function codes(rows: Array<RegionRow>, keep: (row: RegionRow) => boolean) {
  return rows.filter(keep).flatMap((r) => (r.region_code ? [r.region_code] : []))
}

export function ApplicabilityEditor({
  documentId,
  version,
  regions,
  onClose,
  onSaved,
}: {
  documentId: string
  version: VersionDetail
  regions: Array<Region>
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const { t } = useI18n()
  const rows = version.applicability.rows ?? []
  const mutation = useUpdateApplicability()
  const [scope, setScope] = useState(version.applicability.scope)
  const [applies, setApplies] = useState<Array<string>>(codes(rows, (r) => r.relation === 'applies_to' && r.level === 'region'))
  const [excluded, setExcluded] = useState<Array<string>>(codes(rows, (r) => r.relation === 'excluded'))
  const [verified, setVerified] = useState(true)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  function toggle(list: Array<string>, set: (next: Array<string>) => void, code: string) {
    set(list.includes(code) ? list.filter((c) => c !== code) : [...list, code])
  }

  async function save() {
    setError('')
    const next: Array<RegionRow> = [
      ...(scope === 'national' ? [{ relation: 'applies_to' as const, level: 'national' as const, region_code: null }] : []),
      ...(scope !== 'national' ? applies.map((code) => ({ relation: 'applies_to' as const, level: 'region' as const, region_code: code })) : []),
      ...excluded.map((code) => ({ relation: 'excluded' as const, level: 'region' as const, region_code: code })),
    ]
    try {
      await mutation.mutateAsync({
        id: documentId,
        scope: scope === 'regional' && applies.length > 1 ? 'multi_regional' : scope,
        rows: next,
        verified: scope !== 'unknown' && verified,
        note,
      })
      await onSaved()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.applicabilitySaveFailed')))
    }
  }

  const regionGrid = (list: Array<string>, set: (next: Array<string>) => void) => (
    <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
      {regions.map((r) => (
        <label key={r.code} className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={list.includes(r.code)} onChange={() => toggle(list, set, r.code)} />
          {r.name} ({r.code})
        </label>
      ))}
    </div>
  )

  return (
    <Modal
      title={t('adminKnowledge.applicabilityTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={primaryButton} disabled={mutation.isPending} onClick={() => void save()}>
            {mutation.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('common.save')}
          </button>
        </>
      }
    >
      <p className="text-sm text-ash-573">{t('adminKnowledge.applicabilityHelp')}</p>
      <Field label={t('adminKnowledge.scope')} className="mt-4">
        <Select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="national">{t('adminKnowledge.scopeNational')}</option>
          <option value="regional">{t('adminKnowledge.scopeRegional')}</option>
          <option value="unknown">{t('adminKnowledge.scopeUnknown')}</option>
        </Select>
      </Field>
      {scope !== 'national' && scope !== 'unknown' ? (
        <fieldset className="mt-4">
          <legend>
            <SectionLabel>{t('adminKnowledge.relAppliesTo')}</SectionLabel>
          </legend>
          {regionGrid(applies, setApplies)}
        </fieldset>
      ) : null}
      {scope === 'national' ? (
        <fieldset className="mt-4">
          <legend>
            <SectionLabel>{t('adminKnowledge.nationalExceptions')}</SectionLabel>
          </legend>
          {regionGrid(excluded, setExcluded)}
        </fieldset>
      ) : null}
      {scope !== 'unknown' ? (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          {t('adminKnowledge.verifiedAgainstIssuance')}
        </label>
      ) : null}
      <Field label={t('adminKnowledge.note')} className="mt-3">
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('adminKnowledge.applicabilityNotePlaceholder')} />
      </Field>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
