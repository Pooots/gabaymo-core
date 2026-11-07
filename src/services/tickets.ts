import { api } from '@/lib/api'

export type MemberTicket = {
  id: number
  subject: string
  body: string
  status: string
  partner_name?: string | null
  practice_area?: string | null
  /** When the partner owes a reply (accepted tickets). */
  reply_due_at?: string | null
  closed_at?: string | null
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

export async function fetchMemberTickets() {
  const { data } = await api.get<{ tickets: Array<MemberTicket> }>(
    '/v1/tickets',
  )
  return data.tickets
}

export async function fetchMemberThread(id: number) {
  const { data } = await api.get<{
    ticket: MemberTicket
    messages: Array<TicketChatMessage>
  }>(`/v1/tickets/${id}`)
  return data
}

export async function sendMemberMessage(id: number, body: string) {
  const { data } = await api.post<{ message: TicketChatMessage }>(
    `/v1/tickets/${id}/messages`,
    { body },
  )
  return data.message
}

export async function closeMemberTicket(id: number) {
  const { data } = await api.post<{ ticket: MemberTicket }>(`/v1/tickets/${id}/close`)
  return data.ticket
}

export async function createMemberTicket(input: {
  subject: string
  body: string
  practice_area?: string | null
}) {
  const { data } = await api.post<{ ticket: MemberTicket }>(
    '/v1/tickets',
    input,
  )
  return data.ticket
}
