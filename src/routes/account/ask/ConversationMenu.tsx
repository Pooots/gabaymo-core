import { useId, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'

import { ErrorNote, Field, IconButton, Modal, inputClass, secondaryButton, useConfirm } from '@/components/ui'
import { useDismiss, useMenuKeyboard } from '@/hooks/useDismiss'
import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useConversationActions } from '@/queries/member'

/** "…" menu for one conversation: rename (dialog) and delete (confirm). */
export function ConversationMenu({ id, title, onDeleted }: { id: string; title: string | null; onDeleted?: () => void }) {
  const { t } = useI18n()
  const { rename, remove } = useConversationActions()
  const [confirm, confirmDialog] = useConfirm()
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  useDismiss(menuRef, open, () => setOpen(false), triggerRef)
  useMenuKeyboard(menuRef, open)
  const label = title ?? t('ask.untitled')

  async function onDelete() {
    setOpen(false)
    setError('')
    const ok = await confirm({
      title: t('conversations.deleteTitle'),
      description: t('conversations.deleteBody', { title: label }),
      confirmLabel: t('conversations.delete'),
      tone: 'danger',
    })
    if (!ok) return
    remove.mutate(id, {
      onSuccess: () => onDeleted?.(),
      onError: (caught) => setError(apiErrorMessage(caught, t('conversations.deleteError'))),
    })
  }

  return (
    <div className="relative">
      <IconButton
        ref={triggerRef}
        label={t('conversations.actionsLabel')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={16} aria-hidden />
      </IconButton>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t('conversations.actionsLabel')}
          className="absolute top-10 right-0 z-30 w-48 rounded-2xl border border-line bg-surface p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-ash-41 focus-visible:bg-ash-41 focus-visible:outline-none"
            onClick={() => {
              setOpen(false)
              rename.reset()
              setRenaming(true)
            }}
          >
            <Pencil size={14} aria-hidden />
            {t('conversations.rename')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-rust-600 hover:bg-rust-29 focus-visible:bg-rust-29 focus-visible:outline-none"
            onClick={() => void onDelete()}
          >
            <Trash2 size={14} aria-hidden />
            {t('conversations.delete')}
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="absolute top-10 right-0 z-20 w-64">
          <ErrorNote>{error}</ErrorNote>
        </div>
      ) : null}
      {renaming ? <RenameDialog id={id} title={title ?? ''} onClose={() => setRenaming(false)} /> : null}
      {confirmDialog}
    </div>
  )
}

function RenameDialog({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  const { t } = useI18n()
  const { rename } = useConversationActions()
  const [value, setValue] = useState(title)
  const formId = useId()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!value.trim()) return
    rename.mutate({ id, title: value }, { onSuccess: onClose })
  }

  return (
    <Modal
      size="max-w-md"
      title={t('conversations.renameTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" form={formId} className="btn-primary h-11" disabled={rename.isPending || !value.trim()}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <form id={formId} className="space-y-3 pb-2" onSubmit={onSubmit}>
        <Field label={t('conversations.renameLabel')}>
          <input data-autofocus value={value} maxLength={120} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setValue(event.target.value)} className={inputClass} />
        </Field>
        {rename.isError ? <ErrorNote>{apiErrorMessage(rename.error, t('conversations.renameError'))}</ErrorNote> : null}
      </form>
    </Modal>
  )
}
