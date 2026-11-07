import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

export function focusableIn(container: HTMLElement): Array<HTMLElement> {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true',
  )
}

/**
 * Modal focus handling: moves focus into `ref` when active (the element marked
 * `data-autofocus`, else the first focusable, else the container), keeps Tab
 * inside it, and returns focus to whatever had it before when it closes.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const initial =
      container.querySelector<HTMLElement>('[data-autofocus]') ?? focusableIn(container)[0] ?? container
    if (initial === container && !container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1')
    initial.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return
      const items = focusableIn(container)
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) {
        event.preventDefault()
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [ref, active])
}
