import axios from 'axios'

import { api } from '@/lib/api'
import { readAdminToken } from '@/services/adminAuth'

export type SubscriptionCadence = 'forever' | 'month' | 'year'

export type SubscriptionPlan = {
  id: number
  name: string
  price: number
  price_label: string
  cadence: SubscriptionCadence
  cadence_label: string
  tokens: number
  summary: string
  specs: string[]
  featured: boolean
  active: boolean
  sort_order: number
}

export type SubscriptionInput = {
  name: string
  price: number
  cadence: SubscriptionCadence
  tokens: number
  summary: string
  specs: string[]
  featured: boolean
  active: boolean
  sort_order: number
}

function adminHeaders() {
  return { Authorization: `Bearer ${readAdminToken() ?? ''}` }
}

export async function fetchSubscriptions() {
  const { data } = await api.get<{ plans: SubscriptionPlan[] }>(
    '/v1/admin/subscriptions',
    { headers: adminHeaders() },
  )
  return data.plans
}

export async function fetchPublishedPlans() {
  const { data } = await api.get<{ plans: SubscriptionPlan[] }>('/v1/plans')
  return data.plans
}

export async function saveSubscription(id: number | null, input: SubscriptionInput) {
  const config = { headers: adminHeaders() }
  const response = id
    ? await api.put<{ plan: SubscriptionPlan }>(
        `/v1/admin/subscriptions/${id}`,
        input,
        config,
      )
    : await api.post<{ plan: SubscriptionPlan }>(
        '/v1/admin/subscriptions',
        input,
        config,
      )
  return response.data.plan
}

export function subscriptionError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const first = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return first || data?.message || 'Could not save this subscription.'
  }
  return 'Could not save this subscription.'
}
