import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Close a popover/menu on Escape or a pointer press outside `ref`.
 * On Escape, focus goes back to `returnFocus` (usually the trigger button).
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
  returnFocus?: RefObject<HTMLElement | null>,
) {
  const callback = useRef(onDismiss)
  useEffect(() => {
    callback.current = onDismiss
  })

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      callback.current()
      returnFocus?.current?.focus()
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target || ref.current?.contains(target) || returnFocus?.current?.contains(target)) return
      callback.current()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, ref, returnFocus])
}

/**
 * Arrow-key navigation for a menu: Up/Down/Home/End move between
 * [role="menuitem"] children of `ref`. Focuses the first item when opened.
 */
export function useMenuKeyboard(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const menu = ref.current
    if (!open || !menu) return
    const items = () => Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'))
    items()[0]?.focus()
    function onKey(event: KeyboardEvent) {
      const list = items()
      if (list.length === 0) return
      const index = list.indexOf(document.activeElement as HTMLElement)
      let next: number | null = null
      if (event.key === 'ArrowDown') next = (index + 1) % list.length
      else if (event.key === 'ArrowUp') next = (index - 1 + list.length) % list.length
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = list.length - 1
      if (next === null) return
      event.preventDefault()
      list[next]?.focus()
    }
    menu.addEventListener('keydown', onKey)
    return () => menu.removeEventListener('keydown', onKey)
  }, [ref, open])
}
