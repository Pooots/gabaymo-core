import type { ConversationSummary } from '@/services/ai'
import type { MemberProfile, Subscription } from '@/services/memberAuth'
import type { Page, PageParams } from '@/lib/pagination'
import { api, ensureCsrfCookie } from '@/lib/api'
import { pageQuery } from '@/lib/pagination'

/**
 * Member self-service against gabaymo-ws (docs/IMPROVEMENTS-CONTRACT.md B–D):
 * passwords, verification, sessions, data export/deletion, membership,
 * payments, codes, reminders, conversation management and invitations.
 */

// ── Passwords (public) ──────────────────────────────────────────────

/** Always 202, whether or not the email exists (no enumeration). */
export async function requestPasswordReset(email: string) {
  await ensureCsrfCookie()
  await api.post('/v1/password/forgot', { email })
}

export async function resetPassword(input: { token: string; email: string; password: string; password_confirmation: string }) {
  await ensureCsrfCookie()
  const { data } = await api.post<{ ok: boolean; message?: string }>('/v1/password/reset', input)
  return data
}

// ── Account ─────────────────────────────────────────────────────────

export async function sendVerificationEmail() {
  await api.post('/v1/email/verification-notification')
}

export async function changeMemberPassword(input: { current_password: string; password: string; password_confirmation: string }) {
  await api.put('/v1/me/password', input)
}

/** Signs out every device, this one included. */
export async function logoutAllDevices() {
  await api.post('/v1/logout-all')
}

/** The JSON export (profile, payments, tickets, notifications, reminders, AI conversations). */
export async function exportMyData() {
  const { data } = await api.get<unknown>('/v1/me/export')
  return data
}

/** Anonymise + delete the account (204). Needs the current password. */
export async function deleteAccount(password: string) {
  await api.delete('/v1/me', { data: { password } })
}

export async function setIssuanceAlerts(enabled: boolean) {
  const { data } = await api.put<{ user: MemberProfile }>('/v1/me', { issuance_alerts: enabled })
  return data.user
}

// ── Membership and payments ────────────────────────────────────────

export async function cancelSubscription() {
  const { data } = await api.post<{ subscription: Subscription }>('/v1/subscription/cancel')
  return data.subscription
}

export async function resumeSubscription() {
  const { data } = await api.post<{ subscription: Subscription }>('/v1/subscription/resume')
  return data.subscription
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed'

export type MemberPayment = {
  id: number
  reference: string
  receipt_number: string | null
  plan: string | null
  /** Pesos. */
  amount: number
  currency: string
  status: PaymentStatus
  paid_at: string | null
  refunded_at: string | null
  refunded_amount: number | null
  period_end: string | null
  created_at: string | null
}

export async function fetchPayments(params: PageParams = {}) {
  const { data } = await api.get<Page<MemberPayment>>('/v1/payments', { params: pageQuery(params) })
  return data
}

/** Redeem an access key: grants a plan for N days or extra usage. */
export async function redeemAccessKey(code: string) {
  const { data } = await api.post<{ ok: boolean; user: MemberProfile }>('/v1/redeem', { code: code.trim() })
  return data.user
}

// ── Reminders ───────────────────────────────────────────────────────

export type Reminder = {
  id: number
  title: string
  due_at: string
  notes: string | null
  conversation_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type ReminderInput = { title: string; due_at: string; notes?: string | null; conversation_id?: string | null }

export async function fetchReminders(params: PageParams & { upcoming?: boolean } = {}) {
  const { data } = await api.get<Page<Reminder>>('/v1/reminders', { params: pageQuery(params) })
  return data
}

export async function createReminder(input: ReminderInput) {
  const { data } = await api.post<{ data: Reminder }>('/v1/reminders', input)
  return data.data
}

export async function updateReminder(id: number, input: Partial<ReminderInput>) {
  const { data } = await api.patch<{ data: Reminder }>(`/v1/reminders/${id}`, input)
  return data.data
}

export async function deleteReminder(id: number) {
  await api.delete(`/v1/reminders/${id}`)
}

// ── Conversations ───────────────────────────────────────────────────

/** History search over titles and question text (paginated). */
export async function searchConversations(params: PageParams = {}) {
  const { data } = await api.get<Page<ConversationSummary>>('/v1/ai/conversations', { params: pageQuery(params) })
  return data
}

export async function renameConversation(id: string, title: string) {
  const { data } = await api.patch<{ data: ConversationSummary }>(`/v1/ai/conversations/${id}`, { title: title.trim() })
  return data.data
}

export async function deleteConversation(id: string) {
  await api.delete(`/v1/ai/conversations/${id}`)
}

export type FeedbackRating = 'up' | 'down'

export type MessageFeedback = { rating: FeedbackRating; reason: string | null; updated_at?: string | null }

export async function sendAnswerFeedback(messageId: number, rating: FeedbackRating, reason?: string) {
  const body: { rating: FeedbackRating; reason?: string } = { rating }
  if (reason?.trim()) body.reason = reason.trim()
  const { data } = await api.post<{ data: MessageFeedback }>(`/v1/ai/messages/${messageId}/feedback`, body)
  return data.data
}

// ── Invitations (/setup-account, public) ───────────────────────────

export type Invitation = {
  email: string
  name: string | null
  account_type: 'partner' | 'admin'
  purpose: 'setup' | 'reset'
  role: { slug: string; name: string } | null
  invited_by: string | null
  expires_at: string | null
  fields_required: Array<string>
  fields_optional: Array<string>
  practice_area_options: Array<string> | null
  prefill: { phone: string | null; title: string | null; bio: string | null; practice_areas: Array<string> | null } | null
}

export async function fetchInvitation(token: string, email: string) {
  const { data } = await api.get<Invitation>(`/v1/invitations/${encodeURIComponent(token)}`, {
    params: { email },
    skipAuthRedirect: true,
  })
  return data
}

export type AcceptInvitationInput = {
  token: string
  email: string
  password: string
  password_confirmation: string
  name?: string
  practice_areas?: Array<string>
  phone?: string
  title?: string
  bio?: string
}

export type AcceptInvitationResult =
  | { signed_in: true; account_type: 'partner'; portal?: 'partner'; user: MemberProfile }
  | { signed_in: true; account_type: 'admin'; user: { name: string; email: string; role: string; role_name?: string; permissions?: Array<string> } }
  | { signed_in: false; account_type: 'partner' | 'admin' }

export async function acceptInvitation(input: AcceptInvitationInput) {
  await ensureCsrfCookie()
  const { data } = await api.post<AcceptInvitationResult>('/v1/invitations/accept', input, { skipAuthRedirect: true })
  return data
}
