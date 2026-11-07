import axios from 'axios'

import type { Page, PageParams } from '@/lib/pagination'
import { adminApi, api } from '@/lib/api'
import { pageQuery } from '@/lib/pagination'
import { clearMemberSession } from '@/services/memberAuth'
import { disconnectEcho } from '@/lib/echo'
import { queryClient } from '@/lib/queryClient'
import { queryRoots } from '@/queries/keys'

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
  /** Ticket routing: empty = every area. */
  practice_areas?: Array<string>
  /** Shown on the profile; editable on the partner profile page (section E). */
  title?: string | null
  bio?: string | null
  photo_url?: string | null
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
  // Legacy key of the paginated list; the knowledge-area picker wants everyone (max page size).
  const { data } = await adminApi.get<{ partners: Array<PartnerRow> }>(
    '/v1/admin/partners',
    { params: { per_page: 100 } },
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
  const { data } = await adminApi.post<{ partner: PartnerRow }>(
    '/v1/admin/partners',
    input,
  )
  return data.partner
}

export type PartnerDashboardData = {
  partner: PartnerProfile
  open_tickets: number
  /** Accepted tickets whose reply is past due. */
  overdue_tickets?: number
  instructions: Array<{ id: number; title: string }>
  documents: number
  sources: Array<{ id: number; title: string; reference: string | null }>
}

export async function fetchPartnerDashboard() {
  const { data } = await api.get<PartnerDashboardData>('/v1/partner/dashboard')
  return data
}

export async function fetchPartnerInstructions() {
  const { data } = await api.get<{ instructions: Array<PartnerInstruction> }>(
    '/v1/partner/instructions',
  )
  return data.instructions
}

export type PartnerTicket = {
  id: number
  subject: string
  body: string
  status: string
  practice_area?: string | null
  /** When the partner owes the member a reply. */
  reply_due_at?: string | null
  overdue?: boolean
  accepted_at?: string | null
  closed_at?: string | null
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

/** Open, unassigned tickets in the partner's practice areas (`{data, meta}`). */
export async function fetchPartnerTickets(params: PageParams = {}) {
  const { data } = await api.get<Page<PartnerTicket>>('/v1/partner/tickets', { params: pageQuery(params) })
  return data
}

export async function fetchAcceptedTickets(params: PageParams = {}) {
  const { data } = await api.get<Page<PartnerTicket>>('/v1/partner/accepted', { params: pageQuery(params) })
  return data
}

export async function closePartnerTicket(id: number) {
  const { data } = await api.post<{ ticket: PartnerTicket }>(`/v1/partner/tickets/${id}/close`)
  return data.ticket
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
    messages: Array<TicketChatMessage>
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
  const { data } = await api.get<{ documents: Array<PartnerDocument> }>(
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
  practice_areas?: Array<string>
  title?: string | null
  bio?: string | null
  /** http(s) URL, at most 2048 characters. */
  photo_url?: string | null
}) {
  const { data } = await api.put<{ partner: PartnerProfile }>(
    '/v1/partner/profile',
    input,
  )
  return data.partner
}

/** PUT /v1/partner/password (min 8; other devices are signed out). */
export async function changePartnerPassword(input: {
  current_password: string
  password: string
  password_confirmation: string
}) {
  await api.put('/v1/partner/password', input)
}

export async function logoutPartner() {
  try {
    await api.post('/v1/partner/logout')
  } finally {
    disconnectEcho()
    clearMemberSession()
    queryClient.removeQueries({ queryKey: queryRoots.partner })
  }
}

export function partnerError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, Array<string>> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Something went wrong. Try again.'
  }
  return 'Something went wrong. Try again.'
}
