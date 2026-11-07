import axios from 'axios'

import { adminApi } from '@/lib/api'

export type PermissionModule = {
  group: string
  key: string
  label: string
}

export type RoleAccount = {
  id: number
  name: string
  email: string
  /** Section D: invited (has not set a password yet) | active; section E adds suspended. */
  status?: 'invited' | 'active' | 'suspended'
  invitation_expires_at?: string | null
  suspended_at?: string | null
}

export type StaffRole = {
  id: number
  name: string
  slug: string
  description: string | null
  is_system: boolean
  permissions: Array<string>
  accounts: Array<RoleAccount>
}

export type RoleInput = {
  name: string
  description: string | null
  permissions: Array<string>
}

export async function fetchRoles() {
  const { data } = await adminApi.get<{
    modules: Array<PermissionModule>
    roles: Array<StaffRole>
  }>('/v1/admin/roles')
  return data
}

export async function saveRole(id: number | null, input: RoleInput) {
  const response = id
    ? await adminApi.put<{ role: StaffRole }>(`/v1/admin/roles/${id}`, input)
    : await adminApi.post<{ role: StaffRole }>(`/v1/admin/roles`, input)
  return response.data.role
}

export async function deleteRole(id: number) {
  await adminApi.delete(`/v1/admin/roles/${id}`)
}

export function roleError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, Array<string>> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Could not save this role.'
  }
  return 'Could not save this role.'
}
