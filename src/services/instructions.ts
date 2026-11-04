import axios from 'axios'

import { api } from '@/lib/api'
import { readAdminToken } from '@/services/adminAuth'

export type ServiceInstruction = {
  id: number
  title: string
  body: string
  active: boolean
  sort_order: number
}

export type InstructionInput = {
  title: string
  body: string
  active: boolean
  sort_order: number
}

function adminHeaders() {
  return { Authorization: `Bearer ${readAdminToken() ?? ''}` }
}

export async function fetchInstructions() {
  const { data } = await api.get<{ instructions: ServiceInstruction[] }>(
    '/v1/admin/service-instructions',
    { headers: adminHeaders() },
  )
  return data.instructions
}

export async function saveInstruction(id: number | null, input: InstructionInput) {
  const config = { headers: adminHeaders() }
  const response = id
    ? await api.put<{ instruction: ServiceInstruction }>(
        `/v1/admin/service-instructions/${id}`,
        input,
        config,
      )
    : await api.post<{ instruction: ServiceInstruction }>(
        '/v1/admin/service-instructions',
        input,
        config,
      )
  return response.data.instruction
}

export function instructionError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const first = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return first || data?.message || 'Could not save this instruction.'
  }
  return 'Could not save this instruction.'
}
