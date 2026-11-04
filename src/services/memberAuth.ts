import axios from 'axios'

import { api } from '@/lib/api'
import { readAdminToken } from '@/services/adminAuth'

const TOKEN_KEY = 'gabaymo_user_token'
const USER_KEY = 'gabaymo_user'

export type MemberProfile = {
  name: string
  first_name?: string | null
  last_name?: string | null
  email: string
  mobile?: string | null
  region?: string | null
  specialty?: string | null
  type?: string | null
  response_hours?: number | null
  plan: string
  plan_price?: number
  tokens_remaining: number
}

export type MemberRow = MemberProfile & {
  id: number
  joined_at: string | null
}

export function readMemberToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function memberHome(): '/account' | '/partner' {
  return readMember()?.type === 'partners' ? '/partner' : '/account'
}

export function readMember(): MemberProfile | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MemberProfile
  } catch {
    return null
  }
}

function storeSession(token: string, user: MemberProfile) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearMemberSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
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
  const { data } = await api.post<{ token: string; user: MemberProfile }>(
    '/v1/register',
    input,
  )
  storeSession(data.token, data.user)
  return data.user
}

export async function loginMember(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: MemberProfile }>('/v1/login', {
    email,
    password,
  })
  storeSession(data.token, data.user)
  return data.user
}

export async function refreshMember() {
  const token = readMemberToken()
  if (!token) return null
  const { data } = await api.get<{ user: MemberProfile }>('/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  return data.user
}

export async function updateMemberRegion(region: string) {
  const token = readMemberToken()
  const { data } = await api.put<{ user: MemberProfile }>(
    '/v1/me',
    { region },
    { headers: { Authorization: `Bearer ${token ?? ''}` } },
  )
  if (token) storeSession(token, data.user)
  return data.user
}

export async function logoutMember() {
  const token = readMemberToken()
  try {
    if (token) {
      await api.post('/v1/logout', {}, { headers: { Authorization: `Bearer ${token}` } })
    }
  } finally {
    clearMemberSession()
  }
}

export function memberError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const first = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return first || data?.message || 'Something went wrong. Try again.'
  }
  return 'Something went wrong. Try again.'
}

export async function fetchMembers() {
  const { data } = await api.get<{ members: MemberRow[] }>('/v1/admin/members', {
    headers: { Authorization: `Bearer ${readAdminToken() ?? ''}` },
  })
  return data.members
}
