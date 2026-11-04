import axios from 'axios'

import { api } from '@/lib/api'
import { readAdminToken } from '@/services/adminAuth'
import { clearMemberSession, readMemberToken } from '@/services/memberAuth'

export type PartnerRow = {
  id: number
  name: string
  email: string
  mobile: string | null
  specialty: string | null
  open_tickets: number
  response_hours: number
  partner_status: string
}

export type PartnerProfile = {
  name: string
  first_name: string | null
  last_name: string | null
  email: string
  mobile: string | null
  specialty: string | null
  type: string | null
  response_hours: number
  partner_status: string
}

export type PartnerInstruction = { id: number; title: string; body: string }

export type PartnerDocument = {
  id: number
  title: string
  category: string
  kind_label: string
  reference: string | null
  summary: string
  content: string
}

function partnerHeaders() {
  return { Authorization: `Bearer ${readMemberToken() ?? ''}` }
}

function adminHeaders() {
  return { Authorization: `Bearer ${readAdminToken() ?? ''}` }
}

export async function fetchPartners() {
  const { data } = await api.get<{ partners: PartnerRow[] }>('/v1/admin/partners', {
    headers: adminHeaders(),
  })
  return data.partners
}

export async function createPartner(input: {
  first_name: string
  last_name: string
  email: string
  mobile: string
  specialty: string
  password: string
  response_hours: number
  partner_status: string
}) {
  const { data } = await api.post<{ partner: PartnerRow }>('/v1/admin/partners', input, {
    headers: adminHeaders(),
  })
  return data.partner
}

export type PartnerDashboardData = {
  partner: PartnerProfile
  open_tickets: number
  instructions: { id: number; title: string }[]
  documents: number
  sources: { id: number; title: string; reference: string | null }[]
}

export async function fetchPartnerDashboard() {
  const { data } = await api.get<PartnerDashboardData>('/v1/partner/dashboard', {
    headers: partnerHeaders(),
  })
  return data
}

export async function fetchPartnerInstructions() {
  const { data } = await api.get<{ instructions: PartnerInstruction[] }>(
    '/v1/partner/instructions',
    { headers: partnerHeaders() },
  )
  return data.instructions
}

export type PartnerTicket = {
  id: number
  subject: string
  body: string
  status: string
  created_at: string | null
  member_name: string
  member_email: string | null
  member_region: string | null
  member_plan: string
}

export type TicketChatMessage = {
  id: number
  body: string
  created_at: string | null
  mine: boolean
  sender_name: string
  sender_role: string
}

export async function fetchPartnerTickets() {
  const { data } = await api.get<{ tickets: PartnerTicket[] }>('/v1/partner/tickets', {
    headers: partnerHeaders(),
  })
  return data.tickets
}

export async function fetchAcceptedTickets() {
  const { data } = await api.get<{ tickets: PartnerTicket[] }>('/v1/partner/accepted', {
    headers: partnerHeaders(),
  })
  return data.tickets
}

export async function acceptPartnerTicket(id: number) {
  const { data } = await api.post<{ ticket: PartnerTicket }>(
    `/v1/partner/tickets/${id}/accept`,
    {},
    { headers: partnerHeaders() },
  )
  return data.ticket
}

export async function fetchPartnerThread(id: number) {
  const { data } = await api.get<{ ticket: PartnerTicket; messages: TicketChatMessage[] }>(
    `/v1/partner/tickets/${id}/messages`,
    { headers: partnerHeaders() },
  )
  return data
}

export async function sendPartnerMessage(id: number, body: string) {
  const { data } = await api.post<{ message: TicketChatMessage }>(
    `/v1/partner/tickets/${id}/messages`,
    { body },
    { headers: partnerHeaders() },
  )
  return data.message
}

export async function fetchPartnerKnowledge() {
  const { data } = await api.get<{ documents: PartnerDocument[] }>('/v1/partner/knowledge', {
    headers: partnerHeaders(),
  })
  return data.documents
}

export async function updatePartnerProfile(input: {
  first_name: string
  last_name: string
  mobile: string
  specialty: string
  response_hours: number
}) {
  const { data } = await api.put<{ partner: PartnerProfile }>('/v1/partner/profile', input, {
    headers: partnerHeaders(),
  })
  return data.partner
}

export async function logoutPartner() {
  const token = readMemberToken()
  try {
    if (token) {
      await api.post('/v1/partner/logout', {}, { headers: partnerHeaders() })
    }
  } finally {
    clearMemberSession()
  }
}

export function partnerError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const first = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return first || data?.message || 'Something went wrong. Try again.'
  }
  return 'Something went wrong. Try again.'
}
