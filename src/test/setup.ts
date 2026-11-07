import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.cookie.split('; ').forEach((part) => {
    const name = part.split('=')[0]
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
})

// jsdom has no matchMedia / ResizeObserver / IntersectionObserver.
if (!('matchMedia' in window)) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

if (!('ResizeObserver' in window)) Object.defineProperty(window, 'ResizeObserver', { value: NoopObserver })
if (!('IntersectionObserver' in window)) Object.defineProperty(window, 'IntersectionObserver', { value: NoopObserver })
if (!('scrollTo' in Element.prototype)) Object.defineProperty(Element.prototype, 'scrollTo', { value: () => {} })
