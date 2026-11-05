import axios from 'axios'

import { api } from '@/lib/api'
import { clearMemberSession } from '@/services/memberAuth'

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
  account_type: 'partner' | null
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

export async function fetchPartners() {
  const { data } = await api.get<{ partners: PartnerRow[] }>(
    '/v1/admin/partners',
  )
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
  const { data } = await api.post<{ partner: PartnerRow }>(
    '/v1/admin/partners',
    input,
  )
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
  const { data } = await api.get<PartnerDashboardData>('/v1/partner/dashboard')
  return data
}

export async function fetchPartnerInstructions() {
  const { data } = await api.get<{ instructions: PartnerInstruction[] }>(
    '/v1/partner/instructions',
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
  const { data } = await api.get<{ tickets: PartnerTicket[] }>(
    '/v1/partner/tickets',
  )
  return data.tickets
}

export async function fetchAcceptedTickets() {
  const { data } = await api.get<{ tickets: PartnerTicket[] }>(
    '/v1/partner/accepted',
  )
  return data.tickets
}

export async function acceptPartnerTicket(id: number) {
  const { data } = await api.post<{ ticket: PartnerTicket }>(
    `/v1/partner/tickets/${id}/accept`,
    {},
  )
  return data.ticket
}

export async function fetchPartnerThread(id: number) {
  const { data } = await api.get<{
    ticket: PartnerTicket
    messages: TicketChatMessage[]
  }>(`/v1/partner/tickets/${id}/messages`)
  return data
}

export async function sendPartnerMessage(id: number, body: string) {
  const { data } = await api.post<{ message: TicketChatMessage }>(
    `/v1/partner/tickets/${id}/messages`,
    { body },
  )
  return data.message
}

export async function fetchPartnerKnowledge() {
  const { data } = await api.get<{ documents: PartnerDocument[] }>(
    '/v1/partner/knowledge',
  )
  return data.documents
}

export async function updatePartnerProfile(input: {
  first_name: string
  last_name: string
  mobile: string
  specialty: string
  response_hours: number
}) {
  const { data } = await api.put<{ partner: PartnerProfile }>(
    '/v1/partner/profile',
    input,
  )
  return data.partner
}

export async function logoutPartner() {
  try {
    await api.post('/v1/partner/logout')
  } finally {
    clearMemberSession()
  }
}

export function partnerError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, string[]> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Something went wrong. Try again.'
  }
  return 'Something went wrong. Try again.'
}
