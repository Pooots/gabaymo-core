import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'

/** Don't retry what retrying can't fix (auth, validation, not found). */
function shouldRetry(failureCount: number, error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    if (status >= 400 && status < 500) return false
  }
  return failureCount < 1
}

/** The app's single react-query client (also used outside React to invalidate). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: shouldRetry, staleTime: 30_000 },
    mutations: { retry: false },
  },
})
