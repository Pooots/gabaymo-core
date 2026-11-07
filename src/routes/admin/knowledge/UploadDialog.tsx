import { useRef, useState } from 'react'
import { LoaderCircle, Upload } from 'lucide-react'

import { MetadataFields } from './document/MetadataFields'
import type { DocumentRow, Region } from '@/services/ai'
import { ErrorNote, Field, Modal, ProgressBar, Select, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useUploadDocument } from '@/queries/adminKnowledge'
import { aiError } from '@/services/ai'

const MAX_MB = 30
const ACCEPT = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown'

export function UploadDialog({ regions, onClose, onUploaded }: { regions: Array<Region>; onClose: () => void; onUploaded: (doc: DocumentRow) => void }) {
  const { t } = useI18n()
  const upload = useUploadDocument()
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    document_type: 'deped_memorandum',
    document_number: '',
    issuing_authority: '',
    issuing_office: '',
    source_url: '',
    category: '',
    publication_date: '',
    effectivity_date: '',
    expiration_date: '',
    revision_number: '',
    keywords: '',
    description: '',
  })
  const [visibility, setVisibility] = useState('global_public')
  const [partnerId, setPartnerId] = useState('')
  const [scope, setScope] = useState('')
  const [regionCodes, setRegionCodes] = useState<Array<string>>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  function pick(next: File | undefined) {
    setError('')
    if (!next) return
    if (next.size > MAX_MB * 1024 * 1024) {
      setError(t('adminKnowledge.fileTooLarge', { max: MAX_MB }))
      return
    }
    if (!/\.(pdf|docx|txt|md|markdown)$/i.test(next.name)) {
      setError(t('adminKnowledge.fileWrongType'))
      return
    }
    setFile(next)
    setForm((f) => ({ ...f, title: f.title || next.name.replace(/\.[^.]+$/, '') }))
  }

  async function submit() {
    if (!file) return
    setError('')
    setProgress(0)
    try {
      const doc = await upload.mutateAsync({
        file,
        onProgress: setProgress,
        metadata: {
          title: form.title.trim(),
          document_type: form.document_type,
          document_number: form.document_number || null,
          issuing_authority: form.issuing_authority || null,
          issuing_office: form.issuing_office || null,
          source_url: form.source_url || null,
          category: form.category || null,
          description: form.description || null,
          publication_date: form.publication_date || null,
          effectivity_date: form.effectivity_date || null,
          expiration_date: form.expiration_date || null,
          revision_number: form.revision_number || null,
          keywords: form.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          visibility,
          owner_partner_id: visibility.startsWith('partner') && partnerId ? Number(partnerId) : null,
          applicability_scope: scope || null,
          applicable_region_codes: scope === 'regional' ? regionCodes : [],
        },
      })
      onUploaded(doc)
    } catch (caught) {
      setError(aiError(caught, t('adminKnowledge.uploadFailed')))
      setProgress(null)
    }
  }

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value })

  return (
    <Modal
      title={t('adminKnowledge.uploadTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={primaryButton} disabled={!file || !form.title.trim() || progress !== null} onClick={() => void submit()}>
            {progress !== null ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}
            {progress !== null ? t('adminKnowledge.uploadingPercent', { percent: progress }) : t('adminKnowledge.upload')}
          </button>
        </>
      }
    >
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-moss-169 bg-ash-14 px-4 py-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pick(e.dataTransfer.files[0])
        }}
      >
        <p className="text-sm font-medium">{file ? file.name : t('adminKnowledge.dropFile')}</p>
        <p className="mt-1 text-xs text-ash-447">
          {file ? t('adminKnowledge.fileSizeMb', { size: (file.size / 1024 / 1024).toFixed(2) }) : t('adminKnowledge.dropFileHelp', { max: MAX_MB })}
        </p>
        <button type="button" className={`${secondaryButton} mt-3 h-9`} onClick={() => input.current?.click()}>
          {t('adminKnowledge.chooseFile')}
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="hidden"
          aria-label={t('adminKnowledge.chooseFile')}
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetadataFields form={form} set={set} />
        <Field label={t('adminKnowledge.visibility')}>
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="global_public">{t('adminKnowledge.visibilityGlobal')}</option>
            <option value="regional_public">{t('adminKnowledge.visibilityRegional')}</option>
            <option value="partner_private">{t('adminKnowledge.visibilityPartnerPrivate')}</option>
            <option value="partner_shared">{t('adminKnowledge.visibilityPartnerShared')}</option>
          </Select>
        </Field>
        {visibility.startsWith('partner') ? (
          <Field label={t('adminKnowledge.owningPartner')}>
            <input className={inputClass} inputMode="numeric" value={partnerId} onChange={(e) => setPartnerId(e.target.value.replace(/\D/g, ''))} />
          </Field>
        ) : (
          <span />
        )}
        <Field label={t('adminKnowledge.knownApplicability')}>
          <Select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="">{t('adminKnowledge.detectFromDocument')}</option>
            <option value="national">{t('adminKnowledge.national')}</option>
            <option value="regional">{t('adminKnowledge.specificRegions')}</option>
          </Select>
        </Field>
        {scope === 'regional' ? (
          <Field label={t('adminKnowledge.regions')}>
            <Select multiple value={regionCodes} onChange={(e) => setRegionCodes(Array.from(e.target.selectedOptions).map((o) => o.value))} className="h-28">
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
      </div>
      {progress !== null ? (
        <div className="mt-3">
          <ProgressBar value={progress} label={t('adminKnowledge.uploading')} />
        </div>
      ) : null}
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
