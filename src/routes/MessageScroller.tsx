import { useLayoutEffect, useRef, type PointerEvent, type ReactNode } from 'react'

export function MessageScroller({ watch, children }: { watch: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [watch])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const node = ref.current
    if (!node) return
    drag.current = { y: event.clientY, top: node.scrollTop }
    try {
      node.setPointerCapture(event.pointerId)
    } catch {
      // A drag still follows the pointer while it stays over the messages.
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !ref.current) return
    ref.current.scrollTop = drag.current.top - (event.clientY - drag.current.y)
  }

  function endDrag() {
    drag.current = null
  }

  return (
    <div
      ref={ref}
      className="chat-scroll min-h-0 flex-1 cursor-grab space-y-3 overflow-y-auto px-5 py-5 active:cursor-grabbing sm:px-8"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {children}
    </div>
  )
}
