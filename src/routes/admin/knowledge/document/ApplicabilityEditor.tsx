import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import type { Region, RegionRow, VersionDetail } from '@/services/ai'
import {
  ErrorNote,
  Field,
  Modal,
  SectionLabel,
  Select,
  inputClass,
  primaryButton,
  secondaryButton,
} from '@/components/ui'
import { useI18n } from '@/i18n'
import { useUpdateApplicability } from '@/queries/adminKnowledge'
import { aiError } from '@/services/ai'

function codes(rows: Array<RegionRow>, keep: (row: RegionRow) => boolean) {
  return [
    ...new Set(
      rows.filter(keep).flatMap((r) => (r.region_code ? [r.region_code] : [])),
    ),
  ]
}

type EditScope = 'national' | 'regional' | 'division' | 'unknown'

/** The dialog's choice for a stored scope ("division" only when a division row exists to keep). */
export function initialScope(scope: string, hasDivision: boolean): EditScope {
  if (scope === 'national') return 'national'
  if (scope === 'regional' || scope === 'multi_regional') return 'regional'
  if (scope === 'division' || scope === 'school')
    return hasDivision ? 'division' : 'regional'
  return 'unknown'
}

/**
 * Regions to pre-tick: where it applies (a division counts as its region); if nothing
 * applies yet, the region in the letterhead ("Issued by"), so a Region X memo opens with X ticked.
 */
export function initialRegions(rows: Array<RegionRow>) {
  const applies = codes(
    rows,
    (r) =>
      r.relation === 'applies_to' &&
      (r.level === 'region' || r.level === 'division'),
  )
  return applies.length > 0
    ? applies
    : codes(
        rows,
        (r) =>
          r.relation === 'issuing_origin' &&
          (r.level === 'region' || r.level === 'division'),
      )
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
  const divisions = rows.filter(
    (r) =>
      r.relation === 'applies_to' && r.level === 'division' && r.division_code,
  )
  const [scope, setScope] = useState<EditScope>(
    initialScope(version.applicability.scope, divisions.length > 0),
  )
  const [applies, setApplies] = useState<Array<string>>(initialRegions(rows))
  const [excluded, setExcluded] = useState<Array<string>>(
    codes(rows, (r) => r.relation === 'excluded'),
  )
  const [verified, setVerified] = useState(true)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  function toggle(
    list: Array<string>,
    set: (next: Array<string>) => void,
    code: string,
  ) {
    set(list.includes(code) ? list.filter((c) => c !== code) : [...list, code])
  }

  async function save() {
    setError('')
    const next: Array<RegionRow & { label?: string | null }> = [
      ...(scope === 'national'
        ? [
            {
              relation: 'applies_to' as const,
              level: 'national' as const,
              region_code: null,
            },
          ]
        : []),
      ...(scope === 'regional'
        ? applies.map((code) => ({
            relation: 'applies_to' as const,
            level: 'region' as const,
            region_code: code,
          }))
        : []),
      ...(scope === 'division'
        ? divisions.map((d) => ({
            relation: 'applies_to' as const,
            level: 'division' as const,
            region_code: d.region_code,
            division_code: d.division_code,
            label: d.detected_label,
          }))
        : []),
      ...(scope === 'national'
        ? excluded.map((code) => ({
            relation: 'excluded' as const,
            level: 'region' as const,
            region_code: code,
          }))
        : []),
    ]
    try {
      await mutation.mutateAsync({
        id: documentId,
        scope:
          scope === 'regional' && applies.length > 1 ? 'multi_regional' : scope,
        rows: next,
        verified: scope !== 'unknown' && verified,
        note,
      })
      await onSaved()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.applicabilitySaveFailed')))
    }
  }

  const regionGrid = (
    list: Array<string>,
    set: (next: Array<string>) => void,
  ) => (
    <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
      {regions.map((r) => (
        <label key={r.code} className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={list.includes(r.code)}
            onChange={() => toggle(list, set, r.code)}
          />
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
          <button
            type="button"
            className={primaryButton}
            disabled={
              mutation.isPending ||
              (scope === 'regional' && applies.length === 0)
            }
            onClick={() => void save()}
          >
            {mutation.isPending ? (
              <LoaderCircle size={16} className="animate-spin" aria-hidden />
            ) : null}
            {t('common.save')}
          </button>
        </>
      }
    >
      <p className="text-sm text-ash-573">
        {t('adminKnowledge.applicabilityHelp')}
      </p>
      <Field label={t('adminKnowledge.scope')} className="mt-4">
        <Select
          value={scope}
          onChange={(e) => setScope(e.target.value as EditScope)}
        >
          <option value="national">{t('adminKnowledge.scopeNational')}</option>
          <option value="regional">{t('adminKnowledge.scopeRegional')}</option>
          {divisions.length > 0 ? (
            <option value="division">
              {t('adminKnowledge.scopeDivision')}
            </option>
          ) : null}
          <option value="unknown">{t('adminKnowledge.scopeUnknown')}</option>
        </Select>
      </Field>
      {scope === 'division' ? (
        <p className="mt-3 text-sm text-ash-573">
          {t('adminKnowledge.divisionScopeHelp', {
            divisions: divisions
              .map((d) => d.detected_label ?? d.division_code)
              .join(', '),
          })}
        </p>
      ) : null}
      {scope === 'regional' ? (
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
            <SectionLabel>
              {t('adminKnowledge.nationalExceptions')}
            </SectionLabel>
          </legend>
          {regionGrid(excluded, setExcluded)}
        </fieldset>
      ) : null}
      {scope !== 'unknown' ? (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          {t('adminKnowledge.verifiedAgainstIssuance')}
        </label>
      ) : null}
      <Field label={t('adminKnowledge.note')} className="mt-3">
        <input
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('adminKnowledge.applicabilityNotePlaceholder')}
        />
      </Field>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
