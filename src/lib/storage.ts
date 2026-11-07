/**
 * localStorage that never throws (private mode, blocked storage, quota, SSR).
 * Use it for conveniences only; nothing here may be relied on to persist.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage unavailable or full: the app keeps working without it.
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore: nothing to clean up if storage is unavailable.
    }
  },
  getJson<T>(key: string): T | null {
    const raw = safeStorage.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  setJson(key: string, value: unknown) {
    safeStorage.set(key, JSON.stringify(value))
  },
}
