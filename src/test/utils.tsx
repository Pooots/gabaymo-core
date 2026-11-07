import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

/** Render with a fresh, non-retrying react-query client. */
export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}

/** Minimal axios-like error for code that checks `axios.isAxiosError`. */
export function axiosError(status: number, data: unknown = {}) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data, headers: {}, statusText: '', config: {} },
    config: {},
    toJSON: () => ({}),
  })
}
