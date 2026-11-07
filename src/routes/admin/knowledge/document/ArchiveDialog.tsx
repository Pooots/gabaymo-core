import { useState } from 'react'

import { Field, Modal, dangerButton, inputClass, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'

/** Asks why a document is archived (replaces the old window.prompt). */
export function ArchiveDialog({ pending, onClose, onConfirm }: { pending: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 3

  return (
    <Modal
      title={t('adminKnowledge.archiveTitle')}
      size="max-w-md"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={dangerButton} disabled={!valid || pending} onClick={() => void onConfirm(reason.trim())}>
            {t('adminKnowledge.archive')}
          </button>
        </>
      }
    >
      <p className="text-sm text-ash-573">{t('adminKnowledge.archivePrompt')}</p>
      <Field label={t('adminKnowledge.archiveReason')} className="mt-4">
        <input
          className={inputClass}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) void onConfirm(reason.trim())
          }}
        />
      </Field>
    </Modal>
  )
}
