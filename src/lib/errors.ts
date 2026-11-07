import axios from 'axios'

/**
 * Human message for a failed request: the first validation error, else the
 * API's `message`, else `fallback`. Network failures get `fallback` too.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, Array<string>> } | undefined
    const first = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return first || data?.message || fallback
  }
  return fallback
}

/** True when the request never reached the server (offline, DNS, CORS). */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}
