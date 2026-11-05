import axios from 'axios'

import { api } from '@/lib/api'

export type PermissionModule = {
  group: string
  key: string
  label: string
}

export type RoleAccount = {
  id: number
  name: string
  email: string
}

export type StaffRole = {
  id: number
  name: string
  slug: string
  description: string | null
  is_system: boolean
  permissions: string[]
  accounts: RoleAccount[]
}

export type RoleInput = {
  name: string
  description: string | null
  permissions: string[]
}

export async function fetchRoles() {
  const { data } = await api.get<{
    modules: PermissionModule[]
    roles: StaffRole[]
  }>('/v1/admin/roles')
  return data
}

export async function saveRole(id: number | null, input: RoleInput) {
  const response = id
    ? await api.put<{ role: StaffRole }>(`/v1/admin/roles/${id}`, input)
    : await api.post<{ role: StaffRole }>(`/v1/admin/roles`, input)
  return response.data.role
}

export async function deleteRole(id: number) {
  await api.delete(`/v1/admin/roles/${id}`)
}

export async function addRoleAccount(
  id: number,
  account: { name: string; email: string; password: string },
) {
  const { data } = await api.post<{ role: StaffRole }>(
    `/v1/admin/roles/${id}/accounts`,
    account,
  )
  return data.role
}

export function roleError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, string[]> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Could not save this role.'
  }
  return 'Could not save this role.'
}
