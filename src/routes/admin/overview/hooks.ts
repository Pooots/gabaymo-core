import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Eases a number from its previous value to the new one. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const origin = from.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target
      setValue(target)
      return
    }
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = origin + (target - origin) * eased
      setValue(next)
      from.current = next
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

/** Callback ref + the element's content-box size (tracked with ResizeObserver). */
export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return [setElement, size] as const
}

/** Current time, re-read every `interval` ms (for "5m ago" labels). */
export function useNow(interval = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(timer)
  }, [interval])
  return now
}
