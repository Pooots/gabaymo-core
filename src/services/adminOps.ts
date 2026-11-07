import type { Page, PageMeta } from '@/lib/pagination'
import type { MemberRow, Subscription } from '@/services/memberAuth'
import type { RoleAccount, StaffRole } from '@/services/roles'
import { adminApi } from '@/lib/api'
import { metaOf, pageQuery } from '@/lib/pagination'

/**
 * Admin operations calls on gabaymo-ws (`/v1/admin/...`): members, partners,
 * staff invites, tickets, payments, access keys, referral codes,
 * organizations, and the AI feedback / analytics passthrough.
 */

type ListParams = { page?: number; per_page?: number; search?: string }

/** Laravel list → `{data, meta}` (older lists also carry legacy keys; ignored). */
async function getPage<T>(url: string, params: Record<string, string | number | boolean | null | undefined>) {
  const { data } = await adminApi.get<{ data?: Array<T>; meta?: Partial<PageMeta> }>(url, { params: pageQuery(params) })
  const rows = data.data ?? []
  return { data: rows, meta: metaOf(data.meta, rows.length) } satisfies Page<T>
}

// ── Members ─────────────────────────────────────────────────────────────

export type AdminMember = MemberRow & {
  subscription?: Subscription | null
  email_verified?: boolean
  suspended?: boolean
  suspended_at?: string | null
  suspension_reason?: string | null
}

export type MemberStatusFilter = '' | 'active' | 'trial' | 'cancelled' | 'expired' | 'suspended'

export function fetchAdminMembers(params: ListParams & { status?: MemberStatusFilter }) {
  return getPage<AdminMember>('/v1/admin/members', params)
}

export async function fetchAdminMember(id: number) {
  const { data } = await adminApi.get<{ member: AdminMember }>(`/v1/admin/members/${id}`)
  return data.member
}

export async function suspendMember(id: number, reason: string) {
  const { data } = await adminApi.post<{ member: AdminMember }>(`/v1/admin/members/${id}/suspend`, { reason })
  return data.member
}

export async function unsuspendMember(id: number) {
  const { data } = await adminApi.post<{ member: AdminMember }>(`/v1/admin/members/${id}/unsuspend`)
  return data.member
}

export async function changeMemberPlan(id: number, input: { subscription_plan_id: number; period_end?: string | null }) {
  const { data } = await adminApi.put<{ member: AdminMember }>(`/v1/admin/members/${id}/plan`, {
    subscription_plan_id: input.subscription_plan_id,
    period_end: input.period_end || undefined,
  })
  return data.member
}

// ── Partners ────────────────────────────────────────────────────────────

export type AccountStatus = 'invited' | 'active' | 'suspended'

export type AdminPartner = {
  id: number
  name: string
  email: string
  mobile: string | null
  specialty: string | null
  practice_areas: Array<string>
  open_tickets: number
  response_hours: number | null
  partner_status: string
  /** Section D: invited | active | suspended (older builds: derive from `suspended`). */
  status?: AccountStatus
  suspended?: boolean
  suspended_at?: string | null
  title?: string | null
  bio?: string | null
  invitation_expires_at?: string | null
}

export function partnerAccountStatus(partner: AdminPartner): AccountStatus {
  if (partner.status) return partner.status
  return partner.suspended ? 'suspended' : 'active'
}

export async function fetchAdminPartners(params: ListParams) {
  const { data } = await adminApi.get<{ data?: Array<AdminPartner>; meta?: Partial<PageMeta>; practice_areas?: Array<string> }>(
    '/v1/admin/partners',
    { params: pageQuery(params) },
  )
  const rows = data.data ?? []
  return { data: rows, meta: metaOf(data.meta, rows.length), practice_areas: data.practice_areas ?? [] }
}

/** ws: name or first/last required; mobile, specialty and title optional (the partner fills the rest on /setup-account). */
export type PartnerInvite = {
  first_name: string
  last_name: string
  email: string
  mobile?: string
  specialty?: string
  title?: string
  response_hours: number
  partner_status: string
  practice_areas: Array<string>
}

/** Creates the partner and emails an invitation (no password is sent). */
export async function invitePartner(input: PartnerInvite) {
  const { data } = await adminApi.post<{ partner: AdminPartner }>('/v1/admin/partners', input)
  return data.partner
}

export async function suspendPartner(id: number, reason: string) {
  const { data } = await adminApi.post<{ partner: AdminPartner }>(`/v1/admin/partners/${id}/suspend`, { reason: reason || null })
  return data.partner
}

export async function unsuspendPartner(id: number) {
  const { data } = await adminApi.post<{ partner: AdminPartner }>(`/v1/admin/partners/${id}/unsuspend`)
  return data.partner
}

/** Section D: 202 + emailed link `{message, expires_at}`. Older builds answered `{temporary_password}`; that is shown once. */
export type ResetResult = { temporary_password?: string | null; message?: string; expires_at?: string }

export async function resetPartnerPassword(id: number) {
  const { data } = await adminApi.post<ResetResult>(`/v1/admin/partners/${id}/reset-password`)
  return data
}

export async function resendPartnerInvite(id: number) {
  const { data } = await adminApi.post<{ partner?: AdminPartner }>(`/v1/admin/partners/${id}/resend-invite`)
  return data
}

// ── Staff accounts ──────────────────────────────────────────────────────

export async function inviteStaff(roleId: number, input: { name: string; email: string }) {
  const { data } = await adminApi.post<{ role: StaffRole; account?: RoleAccount }>(`/v1/admin/roles/${roleId}/accounts`, input)
  return data
}

export async function resendStaffInvite(roleId: number, adminId: number) {
  const { data } = await adminApi.post<{ account?: RoleAccount }>(`/v1/admin/roles/${roleId}/accounts/${adminId}/resend-invite`)
  return data
}

export async function resetStaffPassword(roleId: number, adminId: number) {
  const { data } = await adminApi.post<ResetResult>(`/v1/admin/roles/${roleId}/accounts/${adminId}/reset-password`)
  return data
}

/** Section E: blocks sign-in and ends the account's sessions. */
export async function suspendStaff(roleId: number, adminId: number) {
  const { data } = await adminApi.post<{ account: RoleAccount }>(`/v1/admin/roles/${roleId}/accounts/${adminId}/suspend`)
  return data.account
}

export async function unsuspendStaff(roleId: number, adminId: number) {
  const { data } = await adminApi.post<{ account: RoleAccount }>(`/v1/admin/roles/${roleId}/accounts/${adminId}/unsuspend`)
  return data.account
}

// ── Tickets ─────────────────────────────────────────────────────────────

export type TicketStatusFilter = '' | 'open' | 'accepted' | 'closed' | 'overdue'

export type AdminTicket = {
  id: number
  subject: string
  body: string
  status: 'open' | 'accepted' | 'closed' | string
  practice_area: string | null
  member: { id: number; name: string; email: string } | null
  partner: { id: number; name: string } | null
  reply_due_at: string | null
  overdue: boolean
  accepted_at: string | null
  closed_at: string | null
  closed_by: string | null
  from_ai_handoff: boolean
  created_at: string | null
}

export type AdminTicketMessage = {
  id: number
  body: string
  sender_name: string | null
  sender_role: 'partner' | 'member'
  created_at: string | null
}

export function fetchAdminTickets(params: ListParams & { status?: TicketStatusFilter; practice_area?: string }) {
  return getPage<AdminTicket>('/v1/admin/tickets', params)
}

export async function fetchAdminTicket(id: number) {
  const { data } = await adminApi.get<{ ticket: AdminTicket; messages: Array<AdminTicketMessage> }>(`/v1/admin/tickets/${id}`)
  return data
}

export async function closeAdminTicket(id: number) {
  const { data } = await adminApi.post<{ ticket: AdminTicket }>(`/v1/admin/tickets/${id}/close`)
  return data.ticket
}

// ── Payments ────────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'disputed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** Amounts are whole pesos. */
export type PaymentsSummary = {
  revenue_month: number
  revenue_total: number
  paid_count: number
  pending_count: number
  failed_count: number
  refunded_count: number
}

export type AdminPayment = {
  id: number
  reference: string
  receipt_number: string | null
  plan: string | null
  amount: number
  currency: string | null
  status: PaymentStatus | string
  paid_at: string | null
  refunded_at: string | null
  refunded_amount: number | null
  period_end: string | null
  created_at: string | null
  member: { id: number; name: string; email: string } | null
  failure_reason: string | null
  disputed_at: string | null
}

export async function fetchPaymentsSummary() {
  const { data } = await adminApi.get<PaymentsSummary>('/v1/admin/payments/summary')
  return data
}

export function fetchAdminPayments(params: ListParams & { status?: string }) {
  return getPage<AdminPayment>('/v1/admin/payments', params)
}

// ── Access keys / referral codes ────────────────────────────────────────

export type CodeStatus = 'active' | 'revoked' | 'used_up_or_expired'

export type AccessKey = {
  id: number
  code: string
  plan_id: number | null
  plan: string | null
  extra_usage_percent: number | null
  duration_days: number | null
  max_uses: number
  uses_count: number
  expires_at: string | null
  revoked_at: string | null
  note: string | null
  status: CodeStatus
  created_at: string | null
}

export type AccessKeyInput = {
  plan_id?: number | null
  extra_usage_percent?: number | null
  duration_days?: number | null
  max_uses: number
  expires_at?: string | null
  note?: string | null
}

export function fetchAccessKeys(params: ListParams) {
  return getPage<AccessKey>('/v1/admin/access-keys', params)
}

export async function createAccessKey(input: AccessKeyInput) {
  const { data } = await adminApi.post<{ access_key: AccessKey }>('/v1/admin/access-keys', input)
  return data.access_key
}

export async function revokeAccessKey(id: number) {
  const { data } = await adminApi.delete<{ access_key: AccessKey }>(`/v1/admin/access-keys/${id}`)
  return data.access_key
}

export type ReferralCode = {
  id: number
  code: string
  owner_user_id: number | null
  owner: { id: number; name: string; email: string } | null
  reward_extra_usage_percent: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  revoked_at: string | null
  status: CodeStatus
  created_at: string | null
}

export type ReferralInput = {
  code?: string | null
  owner_user_id?: number | null
  reward_extra_usage_percent: number
  max_uses?: number | null
  expires_at?: string | null
}

export function fetchReferralCodes(params: ListParams) {
  return getPage<ReferralCode>('/v1/admin/referral-codes', params)
}

export async function createReferralCode(input: ReferralInput) {
  const { data } = await adminApi.post<{ referral_code: ReferralCode }>('/v1/admin/referral-codes', input)
  return data.referral_code
}

export async function revokeReferralCode(id: number) {
  const { data } = await adminApi.delete<{ referral_code: ReferralCode }>(`/v1/admin/referral-codes/${id}`)
  return data.referral_code
}

// ── Organizations ───────────────────────────────────────────────────────

export const ORGANIZATION_TYPES = ['school', 'division', 'other'] as const
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]

export type Organization = {
  id: number
  name: string
  type: OrganizationType
  region: string | null
  seats: number
  seats_used: number
  subscription_plan_id: number
  plan: string | null
  period_end: string | null
  active: boolean
  members: Array<{ id: number; name: string; email: string }>
  invites: Array<string>
  created_at: string | null
}

export type OrganizationInput = {
  name: string
  type: OrganizationType
  region: string | null
  seats: number
  subscription_plan_id: number
  period_end: string
}

export function fetchOrganizations(params: ListParams) {
  return getPage<Organization>('/v1/admin/organizations', params)
}

export async function saveOrganization(id: number | null, input: OrganizationInput) {
  const response = id
    ? await adminApi.put<{ organization: Organization }>(`/v1/admin/organizations/${id}`, input)
    : await adminApi.post<{ organization: Organization }>('/v1/admin/organizations', input)
  return response.data.organization
}

export async function addOrganizationMember(id: number, email: string) {
  const { data } = await adminApi.post<{ status: 'attached' | 'invited'; organization: Organization }>(
    `/v1/admin/organizations/${id}/members`,
    { email },
  )
  return data
}

/** Members fall back to their own plan or the Free Trial; pending invites are dropped. */
export async function deleteOrganization(id: number) {
  const { data } = await adminApi.delete<{ ok: boolean; members_detached: number }>(`/v1/admin/organizations/${id}`)
  return data
}

export async function removeOrganizationMember(id: number, userId: number) {
  const { data } = await adminApi.delete<{ organization: Organization }>(`/v1/admin/organizations/${id}/members/${userId}`)
  return data.organization
}

// ── AI feedback + analytics (gabaymo-ai via the admin passthrough) ──────

export type FeedbackRow = {
  id: number
  message_id: number
  message_excerpt: string
  question: string | null
  question_id: string | null
  draft_id: string | null
  conversation_id: string
  rating: 'up' | 'down'
  reason: string | null
  actor_type: string
  created_at: string | null
  updated_at: string | null
}

export function fetchAiFeedback(params: { page?: number; rating?: '' | 'up' | 'down' }) {
  return getPage<FeedbackRow>('/v1/admin/ai/feedback', params)
}

export type AiAnalytics = {
  days: number
  since: string
  questions_per_day: Array<{ date: string; count: number }>
  top_topics: Array<{ topic: string; count: number }>
  low_confidence_topics: Array<{ topic: string; count: number; total: number; rate: number }>
  feedback: { up: number; down: number }
  review_queue: { pending: number; avg_minutes_to_send: number | null }
  knowledge_searches: number
  cost_per_day: Array<{ date: string; usd: number; tokens: number }>
}

export async function fetchAiAnalytics(days: number) {
  const { data } = await adminApi.get<{ data: AiAnalytics }>('/v1/admin/ai/analytics', { params: { days } })
  return data.data
}

/** The shared practice-area list (ticket routing, analytics topics). */
export const PRACTICE_AREAS = [
  'leave',
  'discipline',
  'appointment_promotion',
  'salary_benefits',
  'child_protection',
  'school_operations',
  'ethics',
  'other',
] as const
