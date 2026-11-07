import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import { MetadataFields } from './MetadataFields'
import type { VersionDetail } from '@/services/ai'
import { ErrorNote, Field, Modal, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useUpdateMetadata } from '@/queries/adminKnowledge'
import { aiError } from '@/services/ai'

/** Metadata values arrive loosely typed; show them as editable text. */
function metaText(value: string | Array<string> | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return Array.isArray(value) ? value.join(', ') : String(value)
}

export function MetadataDialog({ documentId, version, onClose, onSaved }: { documentId: string; version: VersionDetail; onClose: () => void; onSaved: () => Promise<void> }) {
  const { t } = useI18n()
  const m = version.metadata
  const [form, setForm] = useState({
    title: m.title,
    document_type: m.document_type || 'other',
    document_number: metaText(m.document_number),
    issuing_authority: metaText(m.issuing_authority),
    issuing_office: metaText(m.issuing_office),
    source_url: metaText(m.source_url),
    category: metaText(m.category),
    publication_date: metaText(m.publication_date),
    effectivity_date: metaText(m.effectivity_date),
    expiration_date: metaText(m.expiration_date),
    revision_number: metaText(m.revision_number),
    keywords: m.keywords.join(', '),
    description: metaText(m.description),
  })
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const mutation = useUpdateMetadata()

  async function save() {
    setError('')
    try {
      await mutation.mutateAsync({
        id: documentId,
        note,
        metadata: {
          ...form,
          document_number: form.document_number || null,
          issuing_authority: form.issuing_authority || null,
          issuing_office: form.issuing_office || null,
          source_url: form.source_url || null,
          category: form.category || null,
          publication_date: form.publication_date || null,
          effectivity_date: form.effectivity_date || null,
          expiration_date: form.expiration_date || null,
          revision_number: form.revision_number || null,
          description: form.description || null,
          keywords: form.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        },
      })
      await onSaved()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.metadataSaveFailed')))
    }
  }

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value })

  return (
    <Modal
      title={t('adminKnowledge.editMetadata')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={primaryButton} disabled={mutation.isPending} onClick={() => void save()}>
            {mutation.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null} {t('common.save')}
          </button>
        </>
      }
    >
      <p className="mb-4 text-xs text-ash-573">
        {version.review.status === 'approved' ? t('adminKnowledge.metadataApprovedNote') : t('adminKnowledge.metadataCorrectionNote')}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataFields form={form} set={set} />
        <Field label={t('adminKnowledge.correctionNote')} className="sm:col-span-2">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('adminKnowledge.correctionNotePlaceholder')} />
        </Field>
      </div>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
