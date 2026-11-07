import axios from 'axios'

import { safeStorage } from '@/lib/storage'

/**
 * Cached copy of a signed-in profile, for instant UI, plus a once-per-page-load
 * probe asking the API who is signed in. The cache is NOT a credential: the
 * httpOnly session cookie is, and the API decides.
 *
 * Shared by the member (customer + partner) and admin sessions.
 */
export type SessionCache<T> = {
  /** Last known profile from localStorage (null when signed out / unreadable). */
  read: () => T | null
  /** Store a fresh profile and make it the answer to `load()`. */
  write: (user: T) => T
  /** Forget the profile (sign-out or 401). */
  clear: () => void
  /**
   * Who is signed in. Asks the API once, then reuses the answer. A 401 means
   * signed out (null); network trouble keeps the cached profile and retries on
   * the next call.
   */
  load: () => Promise<T | null>
}

export function createSessionCache<T>({
  storageKey,
  legacyKeys = [],
  probe,
}: {
  storageKey: string
  /** Old keys (e.g. pre-Sanctum bearer tokens) removed from browsers on load. */
  legacyKeys?: Array<string>
  probe: () => Promise<T>
}): SessionCache<T> {
  legacyKeys.forEach((key) => safeStorage.remove(key))

  let check: Promise<T | null> | null = null

  const read = () => safeStorage.getJson<T>(storageKey)

  const write = (user: T) => {
    safeStorage.setJson(storageKey, user)
    check = Promise.resolve(user)
    return user
  }

  const clear = () => {
    safeStorage.remove(storageKey)
    legacyKeys.forEach((key) => safeStorage.remove(key))
    check = Promise.resolve(null)
  }

  const load = () => {
    check ??= probe()
      .then(write)
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clear()
          return null
        }
        // Network trouble: don't sign the user out, try again next navigation.
        check = null
        return read()
      })
    return check
  }

  return { read, write, clear, load }
}
