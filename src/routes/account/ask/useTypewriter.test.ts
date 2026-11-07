import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTypewriter } from './useTypewriter'

const TEXT = 'Schools may charge internet to MOOE up to PHP 2,500 a month.'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
}

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }))
  })

  afterEach(() => {
    setVisibility('visible')
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('types the answer in when the page is visible', () => {
    vi.useFakeTimers()
    setVisibility('visible')
    const { result } = renderHook(() => useTypewriter(TEXT, true))
    expect(result.current.done).toBe(false)
    // Each tick schedules the next one after React re-renders, so step through them.
    for (let i = 0; i < 60 && !result.current.done; i++) {
      act(() => {
        vi.advanceTimersByTime(30)
      })
    }
    expect(result.current.done).toBe(true)
    expect(result.current.visible).toBe(TEXT)
  })

  it('shows the whole answer at once when the tab is in the background', () => {
    setVisibility('hidden')
    const { result } = renderHook(() => useTypewriter(TEXT, true))
    expect(result.current.done).toBe(true)
    expect(result.current.visible).toBe(TEXT)
  })
})
