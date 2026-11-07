import axios from 'axios'

import { adminApi, api } from '@/lib/api'

export type SubscriptionCadence = 'forever' | 'month' | 'year'

/** month: refreshes monthly (yearly plans too) · once: never refreshes (trial). */
export type AllowancePeriod = 'month' | 'once'

export type SubscriptionPlan = {
  id: number
  name: string
  price: number
  price_label: string
  cadence: SubscriptionCadence
  cadence_label: string
  /** Weighted tokens per usage period. */
  token_allowance: number
  allowance_period: AllowancePeriod
  estimated_questions: number
  allowance_label: string
  summary: string
  specs: Array<string>
  featured: boolean
  active: boolean
  sort_order: number
}

export type SubscriptionInput = {
  name: string
  price: number
  cadence: SubscriptionCadence
  token_allowance: number
  allowance_period: AllowancePeriod
  summary: string
  specs: Array<string>
  featured: boolean
  active: boolean
  sort_order: number
}

export async function fetchSubscriptions() {
  const { data } = await adminApi.get<{ plans: Array<SubscriptionPlan> }>(
    '/v1/admin/subscriptions',
  )
  return data.plans
}

export async function fetchPublishedPlans() {
  const { data } = await api.get<{ plans: Array<SubscriptionPlan> }>(
    '/v1/plans',
  )
  return data.plans
}

export async function saveSubscription(
  id: number | null,
  input: SubscriptionInput,
) {
  const response = id
    ? await adminApi.put<{ plan: SubscriptionPlan }>(
        `/v1/admin/subscriptions/${id}`,
        input,
      )
    : await adminApi.post<{ plan: SubscriptionPlan }>(
        '/v1/admin/subscriptions',
        input,
      )
  return response.data.plan
}

export function subscriptionError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, Array<string>> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Could not save this subscription.'
  }
  return 'Could not save this subscription.'
}
