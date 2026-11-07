import { useId, useRef } from 'react'
import { X } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'

import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'

function useEscape(onClose: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    // Only the innermost dialog closes.
    event.stopPropagation()
    onClose()
  }
}

/** Right-side panel used for document and answer details. Traps focus; Escape closes. */
export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const { t } = useI18n()
  const panel = useRef<HTMLElement>(null)
  const titleId = useId()
  useFocusTrap(panel)
  const onKeyDown = useEscape(onClose)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onKeyDown={onKeyDown}>
      {/* Backdrop: mouse convenience only; keyboard users have Escape and the Close button. */}
      <div aria-hidden className="absolute inset-0 bg-moss-898/40" onClick={onClose} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex h-full w-full flex-col bg-ash-25 shadow-[0_30px_70px_-36px_rgba(18,48,32,0.55)] ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-sand-86 bg-surface px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="serif truncate text-2xl font-medium tracking-[-0.02em]">
              {title}
            </h2>
            {subtitle ? <div className="mt-1 text-sm text-ash-573">{subtitle}</div> : null}
          </div>
          <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ash-41" aria-label={t('common.close')} onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  )
}

/** Centered modal dialog. Traps focus, restores it on close; Escape closes. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'max-w-2xl',
  role = 'dialog',
  describedBy,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: string
  role?: 'dialog' | 'alertdialog'
  describedBy?: string
}) {
  const { t } = useI18n()
  const box = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(box)
  const onKeyDown = useEscape(onClose)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onKeyDown={onKeyDown}>
      <div aria-hidden className="absolute inset-0 bg-moss-898/45" onClick={onClose} />
      <div
        ref={box}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={`relative z-10 flex max-h-[calc(100dvh-2rem)] w-full ${size} flex-col rounded-3xl bg-surface shadow-[0_30px_70px_-36px_rgba(18,48,32,0.55)]`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <h2 id={titleId} className="serif text-2xl font-medium tracking-[-0.03em]">
            {title}
          </h2>
          <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ash-41" aria-label={t('common.close')} onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="mt-4 min-h-0 overflow-y-auto px-6 pb-2">{children}</div>
        {footer ? <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-sand-73 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}
