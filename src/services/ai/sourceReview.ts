import { ADMIN, idem } from './shared'
import type { DocumentRow } from './documents'
import type { Paginated } from './shared'
import { adminApi } from '@/lib/api'

/** Admin Source Review queue. */

export async function fetchReviewQueue(tab: string, q = '') {
  const { data } = await adminApi.get<
    Paginated<DocumentRow> & { meta: { counts?: Record<string, number> } }
  >(`${ADMIN}/knowledge/reviews`, {
    params: { tab, q: q || undefined, per_page: 50 },
  })
  return data
}

export async function reviewDecision(
  id: string,
  decision: 'approve' | 'return' | 'reject',
  body: Record<string, unknown>,
) {
  const { data } = await adminApi.post(
    `${ADMIN}/knowledge/reviews/${id}/${decision}`,
    body,
    { headers: idem() },
  )
  return data
}
