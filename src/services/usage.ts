import { adminApi, api } from '@/lib/api'

export type UsageStatus = 'ok' | 'warning' | 'critical' | 'exhausted'

/**
 * Token usage for the current period, as percentages of the plan allowance.
 * Raw token counts are only sent to staff (`raw`).
 */
export type TokenUsage = {
  percent_used: number
  percent_remaining: number
  /** Held by questions still being answered. */
  percent_in_progress: number
  /** Extra usage granted by staff, as a percent of the plan allowance. Spent after the plan. */
  extra_percent: number
  status: UsageStatus
  refreshes: boolean
  resets_at: string | null
  period_started_at: string | null
  raw?: {
    allowance: number
    used: number
    reserved: number
    extra: number
    available: number
  }
}

export type UsageEvent = {
  id: number
  type: 'period_start' | 'usage' | 'extra_grant' | 'adjustment'
  percent: number
  question_id?: string
  created_at: string | null
  note?: string
  tokens?: number
  input_tokens?: number
  cached_input_tokens?: number
  output_tokens?: number
}

/** Weighted tokens of a typical question (mirrors services.usage.tokens_per_question). For hints only. */
export const TYPICAL_QUESTION_TOKENS = 10_000

export const EMPTY_USAGE: TokenUsage = {
  percent_used: 0,
  percent_remaining: 0,
  percent_in_progress: 0,
  extra_percent: 0,
  status: 'exhausted',
  refreshes: false,
  resets_at: null,
  period_started_at: null,
}

export async function fetchUsage() {
  const { data } = await api.get<{
    usage: TokenUsage
    events: Array<UsageEvent>
  }>('/v1/usage')
  return data
}

export async function fetchMemberUsage(memberId: number) {
  const { data } = await adminApi.get<{
    usage: TokenUsage
    events: Array<UsageEvent>
  }>(`/v1/admin/members/${memberId}/usage`)
  return data
}

/** "12.5%", "0.4%", "<0.1%" */
export function formatPercent(value: number) {
  if (value > 0 && value < 0.1) return '<0.1%'
  return `${Number(value.toFixed(1)).toLocaleString('en-PH')}%`
}

export function formatResetDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
  })
}

/** Plain-language line under the meter. */
export function usageSummary(usage: TokenUsage) {
  const reset = formatResetDate(usage.resets_at)
  if (usage.status === 'exhausted') {
    if (usage.percent_used < 100)
      return 'Your remaining usage is held by questions still being answered.'
    return reset
      ? `You have used all of this month's usage. It refreshes on ${reset}.`
      : 'You have used all of your trial usage. Upgrade to keep asking.'
  }
  const left = `${formatPercent(usage.percent_remaining)} left`
  return reset ? `${left} · refreshes on ${reset}` : left
}

/** Staff-facing compact token count: 200K, 3.6M. */
export function formatTokens(value: number) {
  return new Intl.NumberFormat('en-PH', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
