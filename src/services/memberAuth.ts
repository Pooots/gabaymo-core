import axios from 'axios'

import type { TokenUsage } from '@/services/usage'
import { adminApi, api } from '@/lib/api'
import { disconnectEcho } from '@/lib/echo'
import { createSessionCache } from '@/lib/sessionCache'
import { clearOfflineConversations } from '@/lib/offlineAnswers'
import { queryClient } from '@/lib/queryClient'
import { queryRoots } from '@/queries/keys'

export type Portal = 'customer' | 'partner'

export type MemberProfile = {
  name: string
  first_name?: string | null
  last_name?: string | null
  email: string
  mobile?: string | null
  region?: string | null
  specialty?: string | null
  account_type?: Portal | null
  response_hours?: number | null
  plan: string
  plan_price?: number
  plan_cadence?: string | null
  /** Null for partner accounts. */
  usage: TokenUsage | null
  portal?: Portal
  email_verified?: boolean
  /** Emails about new DepEd issuances for the member's region (PUT /v1/me). */
  issuance_alerts?: boolean
  /** Partners only (null for members). */
  practice_areas?: Array<string> | null
  /** Members only (null for partners). */
  subscription?: Subscription | null
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'

export type Subscription = {
  plan: string
  plan_id: number | null
  status: SubscriptionStatus
  current_period_end: string | null
  cancel_at_period_end: boolean
  /** trial | paid | admin | organization | access_key … */
  source?: string
  organization?: { id: number; name: string } | null
}

export type MemberRow = MemberProfile & {
  usage: TokenUsage
  id: number
  school_name?: string | null
  joined_at: string | null
}

type SessionResponse = { portal: Portal; user: MemberProfile }

const session = createSessionCache<MemberProfile>({
  storageKey: 'gabaymo_user',
  legacyKeys: ['gabaymo_user_token'],
  probe: async () => {
    const { data } = await api.get<SessionResponse>('/v1/session', {
      skipAuthRedirect: true,
    })
    return { ...data.user, portal: data.portal }
  },
})

/**
 * Cached copy of the signed-in profile, for instant UI (header, account page).
 * It is NOT a credential: the httpOnly session cookie is, and the API decides.
 */
export function readMember(): MemberProfile | null {
  return session.read()
}

function writeMember(user: MemberProfile, portal?: Portal) {
  return session.write({ ...user, portal: portal ?? user.portal })
}

/** Store a profile returned by a sign-in style call (e.g. accepting an invitation). */
export function rememberMember(user: MemberProfile, portal?: Portal) {
  return writeMember(user, portal)
}

/** Update the cached profile in place (e.g. after a password change or a setting). */
export function patchMemberSession(patch: Partial<MemberProfile>) {
  const current = readMember()
  return current ? writeMember({ ...current, ...patch }) : null
}

export function clearMemberSession() {
  session.clear()
}

export function memberHome(
  user: MemberProfile | null = readMember(),
): '/account' | '/partner' {
  const portal = user?.portal ?? user?.account_type ?? 'customer'
  return portal === 'partner' ? '/partner' : '/account'
}

/**
 * Who is signed in on the customer/partner session (asks the API once per page
 * load, then reuses the answer). Resolves null when nobody is signed in.
 */
export function loadMemberSession(): Promise<MemberProfile | null> {
  return session.load()
}

export async function registerMember(input: {
  first_name: string
  last_name: string
  mobile: string
  region: string
  email: string
  password: string
  password_confirmation: string
  accept_terms: boolean
  referral_code?: string
}) {
  const { data } = await api.post<SessionResponse>('/v1/register', input)
  return writeMember(data.user, data.portal)
}

/** Shared customer + partner sign-in. Use memberHome(user) for the redirect. */
export async function loginMember(email: string, password: string) {
  const { data } = await api.post<SessionResponse>('/v1/login', {
    email,
    password,
  })
  return writeMember(data.user, data.portal)
}

export async function refreshMember() {
  const { data } = await api.get<{ user: MemberProfile }>('/v1/me')
  return writeMember(data.user, 'customer')
}

export async function updateMemberRegion(region: string) {
  const { data } = await api.put<{ user: MemberProfile }>('/v1/me', { region })
  return writeMember(data.user, 'customer')
}

export async function logoutMember() {
  try {
    await api.post('/v1/logout')
  } finally {
    disconnectEcho()
    clearMemberSession()
    clearOfflineConversations()
    queryClient.removeQueries({ queryKey: queryRoots.member })
    queryClient.removeQueries({ queryKey: queryRoots.partner })
  }
}

export function memberError(error: unknown) {
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

export async function fetchMembers() {
  const { data } = await adminApi.get<{ members: Array<MemberRow> }>(
    '/v1/admin/members',
  )
  return data.members
}

export async function fetchMember(id: number) {
  const { data } = await adminApi.get<{ member: MemberRow }>(
    `/v1/admin/members/${id}`,
  )
  return data.member
}

/** Grant extra usage, as a percent of the member's plan allowance. */
export async function grantExtraUsage(
  id: number,
  percent: number,
  note?: string,
) {
  const { data } = await adminApi.post<{ member: MemberRow }>(
    `/v1/admin/members/${id}/tokens`,
    { percent, note: note || undefined },
  )
  return data.member
}
