import { api } from '@/lib/api'

const TOKEN_KEY = 'gabaymo_admin_token'
const USER_KEY = 'gabaymo_admin'

export type AdminUser = {
  name: string
  email: string
  role: string
  role_name?: string
  permissions?: string[]
}

export function readAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

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
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: AdminUser }>(
    '/v1/admin/login',
    { email, password },
  )
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
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

function adminHeaders() {
  return { Authorization: `Bearer ${readAdminToken() ?? ''}` }
}

export async function fetchOverview() {
  const { data } = await api.get<OverviewStats>('/v1/admin/overview', {
    headers: adminHeaders(),
  })
  return data
}

export async function fetchAudit() {
  const { data } = await api.get<{ logs: ActivityItem[] }>('/v1/admin/audit', {
    headers: adminHeaders(),
  })
  return data.logs
}

export async function logoutAdmin() {
  const token = readAdminToken()
  try {
    if (token) {
      await api.post(
        '/v1/admin/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
    }
  } finally {
    clearAdminSession()
  }
}
