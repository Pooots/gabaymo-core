import { api } from '@/lib/api'
import { readMemberToken } from '@/services/memberAuth'

export type MemberTicket = {
  id: number
  subject: string
  body: string
  status: string
  partner_name?: string | null
  created_at: string | null
}

export type TicketChatMessage = {
  id: number
  body: string
  created_at: string | null
  mine: boolean
  sender_name: string
  sender_role: string
}

function headers() {
  return { Authorization: `Bearer ${readMemberToken() ?? ''}` }
}

export async function fetchMemberTickets() {
  const { data } = await api.get<{ tickets: MemberTicket[] }>('/v1/tickets', { headers: headers() })
  return data.tickets
}

export async function fetchMemberThread(id: number) {
  const { data } = await api.get<{ ticket: MemberTicket; messages: TicketChatMessage[] }>(
    `/v1/tickets/${id}`,
    { headers: headers() },
  )
  return data
}

export async function sendMemberMessage(id: number, body: string) {
  const { data } = await api.post<{ message: TicketChatMessage }>(
    `/v1/tickets/${id}/messages`,
    { body },
    { headers: headers() },
  )
  return data.message
}

export async function createMemberTicket(input: { subject: string; body: string }) {
  const { data } = await api.post<{ ticket: MemberTicket }>('/v1/tickets', input, {
    headers: headers(),
  })
  return data.ticket
}
