import { api } from '@/lib/api'
import { readMemberToken } from '@/services/memberAuth'

function headers() {
  return { Authorization: `Bearer ${readMemberToken() ?? ''}` }
}

export async function startMembershipCheckout(planId: number) {
  const { data } = await api.post<{
    reference: string
    checkout_url: string
    subtotal: number
    total: number
    price_label: string
  }>('/v1/payments/checkout', { plan_id: planId }, { headers: headers() })
  return data
}

export async function confirmMembershipPayment(reference: string) {
  const { data } = await api.post<{ status: string; reference: string }>(
    '/v1/payments/confirm',
    { reference },
    { headers: headers() },
  )
  return data
}
