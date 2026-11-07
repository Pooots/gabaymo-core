import axios from 'axios'

/** Helpers shared by the GabayMo AI services. */

export const ADMIN = '/v1/admin/ai'

export function idem() {
  return { 'Idempotency-Key': crypto.randomUUID() }
}

export type Paginated<T> = {
  data: Array<T>
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page?: number
  } & Record<string, unknown>
}

const reasonText: Record<string, string> = {
  self_approval_not_allowed:
    'You uploaded this document, so another reviewer must approve it.',
  stale_review:
    'The document changed after you opened it. Reload and review it again.',
  insufficient_credits: 'No questions left on this plan.',
}

export function aiError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string
          errors?: Record<string, Array<string>>
          reasons?: Array<string>
        }
      | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    const message = first || data?.message || fallback
    // Skip reason texts that only repeat the message.
    const extra = (data?.reasons ?? [])
      .map((r) => reasonText[r] ?? r.replace(/_/g, ' '))
      .filter((text) => !message.includes(text))
    return (
      message + (first || extra.length === 0 ? '' : ` (${extra.join('; ')})`)
    )
  }
  return fallback
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return '—'
  return new Date(value).toLocaleString(
    'en-PH',
    withTime
      ? {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}
