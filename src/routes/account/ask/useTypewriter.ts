import { useEffect, useMemo, useRef, useState } from 'react'

/** Reveals text word by word (fast), so a finished answer reads as if it is being written. */
export function useTypewriter(text: string, active: boolean, onGrow?: () => void, running = true) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const words = useMemo(() => text.split(/(\s+)/), [text])
  const [count, setCount] = useState(active && !reduced ? 0 : words.length)
  const grow = useRef(onGrow)
  useEffect(() => {
    grow.current = onGrow
  }, [onGrow])

  useEffect(() => {
    if (!running || count >= words.length) return
    // Browsers slow timers to about once a second in a background tab, so an answer that
    // arrives while the member is in another tab would crawl in word by word. Show it whole.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      setCount(words.length)
      return
    }
    // About 2-4 seconds for a typical answer, whatever its length.
    const step = Math.max(2, Math.ceil(words.length / 140))
    const timer = window.setTimeout(() => {
      setCount((c) => Math.min(words.length, c + step))
      grow.current?.()
    }, 24)
    return () => window.clearTimeout(timer)
  }, [count, words.length, running])

  return { visible: words.slice(0, count).join(''), done: count >= words.length, finish: () => setCount(words.length) }
}
