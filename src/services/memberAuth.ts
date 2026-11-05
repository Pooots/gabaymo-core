import axios from 'axios'

import { api } from '@/lib/api'

const USER_KEY = 'gabaymo_user'
/** Pre-Sanctum bearer token. Removed from browsers on load. */
const LEGACY_TOKEN_KEY = 'gabaymo_user_token'

localStorage.removeItem(LEGACY_TOKEN_KEY)

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
  tokens_remaining: number
  portal?: Portal
}

export type MemberRow = MemberProfile & {
  id: number
  school_name?: string | null
  joined_at: string | null
}

type SessionResponse = { portal: Portal; user: MemberProfile }

/**
 * Cached copy of the signed-in profile, for instant UI (header, account page).
 * It is NOT a credential: the httpOnly session cookie is, and the API decides.
 */
export function readMember(): MemberProfile | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MemberProfile
  } catch {
    return null
  }
}

function writeMember(user: MemberProfile, portal?: Portal) {
  const next = { ...user, portal: portal ?? user.portal }
  localStorage.setItem(USER_KEY, JSON.stringify(next))
  sessionCheck = Promise.resolve(next)
  return next
}

export function clearMemberSession() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  sessionCheck = Promise.resolve(null)
}

export function memberHome(
  user: MemberProfile | null = readMember(),
): '/account' | '/partner' {
  const portal = user?.portal ?? user?.account_type ?? 'customer'
  return portal === 'partner' ? '/partner' : '/account'
}

let sessionCheck: Promise<MemberProfile | null> | null = null

/**
 * Who is signed in on the customer/partner session (asks the API once per page
 * load, then reuses the answer). Resolves null when nobody is signed in.
 */
export function loadMemberSession(): Promise<MemberProfile | null> {
  sessionCheck ??= api
    .get<SessionResponse>('/v1/session')
    .then(({ data }) => writeMember(data.user, data.portal))
    .catch((error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearMemberSession()
        return null
      }
      // Network trouble: don't sign the user out, try again next navigation.
      sessionCheck = null
      return readMember()
    })
  return sessionCheck
}

export async function registerMember(input: {
  first_name: string
  last_name: string
  mobile: string
  region: string
  email: string
  password: string
  password_confirmation: string
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
    clearMemberSession()
  }
}

export function memberError(error: unknown) {
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

export async function fetchMembers() {
  const { data } = await api.get<{ members: MemberRow[] }>('/v1/admin/members')
  return data.members
}

export async function fetchMember(id: number) {
  const { data } = await api.get<{ member: MemberRow }>(
    `/v1/admin/members/${id}`,
  )
  return data.member
}

export async function addMemberTokens(id: number, amount: number) {
  const { data } = await api.post<{ member: MemberRow }>(
    `/v1/admin/members/${id}/tokens`,
    { amount },
  )
  return data.member
}
