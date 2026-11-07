import { useCallback, useId, useRef, useState } from 'react'

import { Modal } from './Dialog'
import { dangerButton, primaryButton, secondaryButton } from './styles'
import type { ReactNode } from 'react'
import { useI18n } from '@/i18n'

export type ConfirmOptions = {
  title?: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` styles the confirm button red (deletes, discards). */
  tone?: 'default' | 'danger'
}

/**
 * Accessible replacement for window.confirm(): an alertdialog with focus on
 * Cancel (the safe choice), Escape = cancel, focus restored afterwards.
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  busy = false,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
}: ConfirmOptions & {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  const { t } = useI18n()
  const descriptionId = useId()
  if (!open) return null
  return (
    <Modal
      role="alertdialog"
      size="max-w-md"
      title={title ?? t('common.confirmDefaultTitle')}
      describedBy={description ? descriptionId : undefined}
      onClose={onCancel}
      footer={
        <>
          <button type="button" data-autofocus className={secondaryButton} onClick={onCancel} disabled={busy}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button type="button" className={tone === 'danger' ? dangerButton : primaryButton} onClick={onConfirm} disabled={busy}>
            {confirmLabel ?? t('common.confirm')}
          </button>
        </>
      }
    >
      {description ? (
        <div id={descriptionId} className="text-sm leading-relaxed text-ash-573">
          {description}
        </div>
      ) : null}
    </Modal>
  )
}

/**
 * Promise-based confirm, a drop-in for `window.confirm`:
 *
 *   const [confirm, confirmDialog] = useConfirm()
 *   if (!(await confirm({ title: 'Discard changes?', tone: 'danger' }))) return
 *   ...
 *   return <>{confirmDialog}...</>
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions = {}) => {
    resolver.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  const dialog = (
    <ConfirmDialog open={options !== null} {...options} onConfirm={() => settle(true)} onCancel={() => settle(false)} />
  )

  return [confirm, dialog] as const
}
