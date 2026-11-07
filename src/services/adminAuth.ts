import { adminApi } from '@/lib/api'
import { createSessionCache } from '@/lib/sessionCache'
import { queryClient } from '@/lib/queryClient'
import { queryRoots } from '@/queries/keys'

export type AdminUser = {
  name: string
  email: string
  role: string
  role_name?: string
  permissions?: Array<string>
  two_factor_enabled?: boolean
}

const session = createSessionCache<AdminUser>({
  storageKey: 'gabaymo_admin',
  legacyKeys: ['gabaymo_admin_token'],
  probe: async () => {
    const { data } = await adminApi.get<{ user: AdminUser }>('/v1/admin/me', {
      skipAuthRedirect: true,
    })
    return data.user
  },
})

/** Cached profile for instant UI. Not a credential: the session cookie is. */
export function readAdminUser(): AdminUser | null {
  return session.read()
}

export function writeAdminUser(user: AdminUser) {
  session.write(user)
}

export function clearAdminSession() {
  session.clear()
}

/** Who is signed in on the admin session (asked once per page load). */
export function loadAdminSession(): Promise<AdminUser | null> {
  return session.load()
}

export type AdminLoginResult = { user: AdminUser } | { two_factor_required: true }

/** Step 1: password. Resolves `{two_factor_required: true}` when a code is needed next. */
export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  const { data } = await adminApi.post<{ user?: AdminUser; two_factor_required?: boolean }>('/v1/admin/login', {
    email,
    password,
  })
  if (data.two_factor_required) return { two_factor_required: true }
  if (!data.user) throw new Error('Unexpected sign-in response')
  writeAdminUser(data.user)
  return { user: data.user }
}

/** Step 2: a 6-digit authenticator code or a one-time recovery code. */
export async function loginAdminTwoFactor(code: string) {
  const { data } = await adminApi.post<{ user: AdminUser }>('/v1/admin/login/two-factor', { code })
  writeAdminUser(data.user)
  return data.user
}

export async function refreshAdminUser() {
  const { data } = await adminApi.get<{ user: AdminUser }>('/v1/admin/me')
  writeAdminUser(data.user)
  return data.user
}

export type TwoFactorSetup = { secret: string; otpauth_url: string; recovery_codes: Array<string> }

/** Starts setup; takes effect only after confirmTwoFactor. */
export async function enableTwoFactor() {
  const { data } = await adminApi.post<TwoFactorSetup>('/v1/admin/me/two-factor')
  return data
}

export async function confirmTwoFactor(code: string) {
  const { data } = await adminApi.post<{ user: AdminUser }>('/v1/admin/me/two-factor/confirm', { code })
  writeAdminUser(data.user)
  return data.user
}

export async function disableTwoFactor(password: string) {
  const { data } = await adminApi.delete<{ user: AdminUser }>('/v1/admin/me/two-factor', { data: { password } })
  writeAdminUser(data.user)
  return data.user
}

/** PUT /v1/admin/me/password (min 10 characters for staff). */
export async function changeAdminPassword(input: {
  current_password: string
  password: string
  password_confirmation: string
}) {
  const { data } = await adminApi.put<{ user: AdminUser }>('/v1/admin/me/password', input)
  writeAdminUser(data.user)
  return data.user
}

export type SignupPoint = {
  date?: string
  label: string
  value: number
  questions?: number
  tokens?: number
}

export type PlanStat = {
  name: string
  price: string
  cadence: string
  token_allowance: number
  allowance_period: 'month' | 'once'
  estimated_questions: number
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
  members_new_7d?: number
  partners: number
  open_tickets: number
  tickets_new_7d?: number
  documents: number
  documents_pending?: number
  payments_total: number
  payments_count?: number
  tokens_used_14d?: number
  questions_14d?: number
  generated_at?: string
  signups: Array<SignupPoint>
  plans: Array<PlanStat>
  activity: Array<ActivityItem>
}

export async function fetchOverview() {
  const { data } = await adminApi.get<OverviewStats>('/v1/admin/overview')
  return data
}

export async function fetchAudit() {
  const { data } = await adminApi.get<{ logs: Array<ActivityItem> }>(
    '/v1/admin/audit',
  )
  return data.logs
}

export async function logoutAdmin() {
  try {
    await adminApi.post('/v1/admin/logout')
  } finally {
    clearAdminSession()
    queryClient.removeQueries({ queryKey: queryRoots.admin })
  }
}
