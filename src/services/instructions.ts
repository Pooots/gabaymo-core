import axios from 'axios'

import { adminApi } from '@/lib/api'

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

export async function fetchInstructions() {
  const { data } = await adminApi.get<{
    instructions: Array<ServiceInstruction>
  }>('/v1/admin/service-instructions')
  return data.instructions
}

export async function saveInstruction(
  id: number | null,
  input: InstructionInput,
) {
  const response = id
    ? await adminApi.put<{ instruction: ServiceInstruction }>(
        `/v1/admin/service-instructions/${id}`,
        input,
      )
    : await adminApi.post<{ instruction: ServiceInstruction }>(
        '/v1/admin/service-instructions',
        input,
      )
  return response.data.instruction
}

export function instructionError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, Array<string>> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Could not save this instruction.'
  }
  return 'Could not save this instruction.'
}
