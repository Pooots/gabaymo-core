import { ADMIN, idem } from './shared'
import type { Citation, Evidence, PartnerTake, PreferredAnswer } from './search'
import type { Paginated } from './shared'
import { adminApi } from '@/lib/api'

/** Admin AI answer review queue. */

/** Member ratings of the sent answer; a "down" is flagged for reviewers. */
export type DraftFeedbackItem = {
  rating: 'up' | 'down'
  reason: string | null
  actor_type: string
  updated_at: string | null
}

export type DraftFeedback = {
  up: number
  down: number
  has_down: boolean
  items: Array<DraftFeedbackItem>
}

export type DraftRow = {
  id: string
  question_id: string
  question: {
    id: string
    text: string
    conversation_id: string
    actor_type: string
    user_id: number
    region_code: string | null
    credit_status: string
    asked_at: string | null
  } | null
  revision: number
  origin: string
  partner_id: number | null
  answer_status: string
  risk_level: string
  review_reasons: Array<string>
  priority: number
  assigned_reviewer_name: string | null
  draft: string | null
  validated_draft: string | null
  citations?: Array<Citation>
  reviewer_notes: string | null
  reviewed_by_name: string | null
  model: string | null
  token_usage: Record<string, unknown> | null
  estimated_cost: number | null
  failure_reason: string | null
  created_at: string | null
  /** Only when gabaymo-ai loaded the ratings. */
  feedback?: DraftFeedback | null
}

export type DraftDetail = DraftRow & {
  partner_take?: PartnerTake | null
  include_partner_take?: boolean
  evidence: Array<Evidence>
  structured: {
    claims: Array<{ text: string; kind: string }>
    regional_note: string
    outdated_note: string
  } | null
  validation_results: {
    literal?: {
      issues: Array<{
        code: string
        severity: string
        detail: string
        claim_index: number | null
      }>
    }
    support?: {
      method: string
      results: Record<string, { verdict: string; reason: string }>
    }
    hard_blocked?: boolean
    handoff?: { ticket_id: number | null }
  } | null
  retrieval_diagnostics: {
    plan?: { mode: string; interpretation: Array<string> }
    preferred_answers_used?: Array<PreferredAnswer>
  } | null
  reviews: Array<{
    action: string
    note: string | null
    reviewer_name: string | null
    from_status: string | null
    to_status: string | null
    created_at: string | null
  }>
  conversation: Array<{
    id: number
    role: string
    content: string
    created_at: string
  }>
  revisions: Array<{
    id: string
    revision: number
    origin: string
    answer_status: string
    created_at: string
  }>
}

export const answerStatusLabels: Record<string, string> = {
  processing: 'Processing',
  ready_for_review: 'Ready',
  needs_confirmation: 'Needs confirmation',
  partner_handoff: 'Partner handoff',
  approved: 'Approved',
  sent: 'Sent',
  rejected: 'Rejected',
  failed: 'Failed',
  cancelled: 'Replaced',
}

export function answerTone(status: string): 'green' | 'amber' | 'red' | 'gray' {
  if (['ready_for_review', 'approved', 'sent'].includes(status)) return 'green'
  if (['needs_confirmation', 'processing'].includes(status)) return 'amber'
  if (['partner_handoff', 'rejected', 'failed'].includes(status)) return 'red'
  return 'gray'
}

export async function fetchDrafts(params: {
  status: string
  assigned?: string
  priority?: string
  q?: string
  page?: number
}) {
  const { data } = await adminApi.get<
    Paginated<DraftRow> & { meta: { counts?: Record<string, number> } }
  >(`${ADMIN}/reviews`, {
    params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
  })
  return data
}

export async function fetchDraft(id: string) {
  const { data } = await adminApi.get<{ data: DraftDetail }>(
    `${ADMIN}/reviews/${id}`,
  )
  return data.data
}

export async function draftAction(
  id: string,
  action: 'approve' | 'reject' | 'edit' | 'handoff' | 'regenerate' | 'assign',
  body: Record<string, unknown> = {},
) {
  const { data } = await adminApi.post<{ data: DraftRow }>(
    `${ADMIN}/reviews/${id}/${action}`,
    body,
    { headers: idem() },
  )
  return data.data
}
