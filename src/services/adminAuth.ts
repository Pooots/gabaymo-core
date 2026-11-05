import axios from 'axios'

import { api } from '@/lib/api'

const USER_KEY = 'gabaymo_admin'
/** Pre-Sanctum bearer token. Removed from browsers on load. */
const LEGACY_TOKEN_KEY = 'gabaymo_admin_token'

localStorage.removeItem(LEGACY_TOKEN_KEY)

export type AdminUser = {
  name: string
  email: string
  role: string
  role_name?: string
  permissions?: string[]
}

/** Cached profile for instant UI. Not a credential: the session cookie is. */
export function readAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export function writeAdminUser(user: AdminUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  adminCheck = Promise.resolve(user)
}

export function clearAdminSession() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  adminCheck = Promise.resolve(null)
}

let adminCheck: Promise<AdminUser | null> | null = null

/** Who is signed in on the admin session (asked once per page load). */
export function loadAdminSession(): Promise<AdminUser | null> {
  adminCheck ??= api
    .get<{ user: AdminUser }>('/v1/admin/me')
    .then(({ data }) => {
      writeAdminUser(data.user)
      return data.user
    })
    .catch((error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAdminSession()
        return null
      }
      adminCheck = null
      return readAdminUser()
    })
  return adminCheck
}

export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post<{ user: AdminUser }>('/v1/admin/login', {
    email,
    password,
  })
  writeAdminUser(data.user)
  return data.user
}

export type SignupPoint = { label: string; value: number }

export type PlanStat = {
  name: string
  price: string
  cadence: string
  tokens: number
  subscribers: number
}

export type ActivityItem = {
  id: number
  action: string
  summary: string
  at: string | null
}

export type OverviewStats = {
  members: number
  partners: number
  open_tickets: number
  documents: number
  payments_total: number
  signups: SignupPoint[]
  plans: PlanStat[]
  activity: ActivityItem[]
}

export async function fetchOverview() {
  const { data } = await api.get<OverviewStats>('/v1/admin/overview')
  return data
}

export async function fetchAudit() {
  const { data } = await api.get<{ logs: ActivityItem[] }>('/v1/admin/audit')
  return data.logs
}

export async function logoutAdmin() {
  try {
    await api.post('/v1/admin/logout')
  } finally {
    clearAdminSession()
  }
}
