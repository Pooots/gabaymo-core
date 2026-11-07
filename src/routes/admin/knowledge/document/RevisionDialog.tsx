import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import type { DocumentRow } from '@/services/ai'
import { ErrorNote, Field, Modal, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useUploadVersion } from '@/queries/adminKnowledge'
import { aiError } from '@/services/ai'

export function RevisionDialog({ document, onClose, onSaved }: { document: DocumentRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const mutation = useUploadVersion()

  async function save() {
    if (!file) return
    try {
      await mutation.mutateAsync({ id: document.id, file, note })
      await onSaved()
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.versionUploadFailed')))
    }
  }

  return (
    <Modal
      title={t('adminKnowledge.revisionTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={primaryButton} disabled={!file || mutation.isPending} onClick={() => void save()}>
            {mutation.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {t('adminKnowledge.upload')}
          </button>
        </>
      }
    >
      <p className="text-sm text-ash-573">{t('adminKnowledge.revisionHelp')}</p>
      <input
        type="file"
        accept=".pdf,.docx,.txt,.md"
        aria-label={t('adminKnowledge.chooseFile')}
        className="mt-4 text-sm"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Field label={t('adminKnowledge.whatChanged')} className="mt-3">
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
