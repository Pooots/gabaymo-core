import { useCallback, useSyncExternalStore } from 'react'

/** Live `matchMedia` result (false where matchMedia is missing, e.g. tests/SSR). */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === 'undefined' || !('matchMedia' in window)) return () => undefined
      const list = window.matchMedia(query)
      list.addEventListener('change', listener)
      return () => list.removeEventListener('change', listener)
    },
    [query],
  )
  const read = () => typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia(query).matches
  return useSyncExternalStore(subscribe, read, () => false)
}
