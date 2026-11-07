import { useKnowledgeLabels } from '../labels'
import { Field, Select, inputClass } from '@/components/ui'
import { useI18n } from '@/i18n'
import { shelves } from '@/services/ai'

/** Shared metadata inputs (upload dialog and metadata editor). */
export function MetadataFields<T extends Record<string, string>>({ form, set }: { form: T; set: (key: keyof T) => (event: { target: { value: string } }) => void }) {
  const { t } = useI18n()
  const labels = useKnowledgeLabels()
  return (
    <>
      <Field label={t('adminKnowledge.fieldTitle')} className="sm:col-span-2">
        <input required className={inputClass} value={form.title} onChange={set('title')} />
      </Field>
      <Field label={t('adminKnowledge.fieldType')}>
        <Select value={form.document_type} onChange={set('document_type')}>
          {labels.documentTypes.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('adminKnowledge.fieldNumber')}>
        <input className={inputClass} value={form.document_number} onChange={set('document_number')} placeholder={t('adminKnowledge.fieldNumberPlaceholder')} />
      </Field>
      <Field label={t('adminKnowledge.fieldIssuingAuthority')}>
        <input className={inputClass} value={form.issuing_authority} onChange={set('issuing_authority')} placeholder={t('adminKnowledge.fieldIssuingAuthorityPlaceholder')} />
      </Field>
      <Field label={t('adminKnowledge.fieldIssuingOffice')}>
        <input className={inputClass} value={form.issuing_office} onChange={set('issuing_office')} placeholder={t('adminKnowledge.fieldIssuingOfficePlaceholder')} />
      </Field>
      <Field label={t('adminKnowledge.fieldShelf')}>
        <Select value={form.category} onChange={set('category')}>
          <option value="">—</option>
          {shelves.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('adminKnowledge.fieldRevision')}>
        <input className={inputClass} value={form.revision_number} onChange={set('revision_number')} />
      </Field>
      <Field label={t('adminKnowledge.fieldPublicationDate')}>
        <input type="date" className={inputClass} value={form.publication_date} onChange={set('publication_date')} />
      </Field>
      <Field label={t('adminKnowledge.fieldEffectivityDate')}>
        <input type="date" className={inputClass} value={form.effectivity_date} onChange={set('effectivity_date')} />
      </Field>
      <Field label={t('adminKnowledge.fieldExpirationDate')}>
        <input type="date" className={inputClass} value={form.expiration_date} onChange={set('expiration_date')} />
      </Field>
      <Field label={t('adminKnowledge.fieldSourceUrl')}>
        <input className={inputClass} value={form.source_url} onChange={set('source_url')} placeholder="https://www.deped.gov.ph/…" />
      </Field>
      <Field label={t('adminKnowledge.fieldKeywords')} className="sm:col-span-2">
        <input className={inputClass} value={form.keywords} onChange={set('keywords')} placeholder={t('adminKnowledge.fieldKeywordsPlaceholder')} />
      </Field>
      <Field label={t('adminKnowledge.fieldDescription')} className="sm:col-span-2">
        <textarea rows={2} className={`${inputClass} h-auto py-3`} value={form.description} onChange={set('description')} />
      </Field>
    </>
  )
}
