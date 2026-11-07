import { idem } from './shared'
import { api } from '@/lib/api'

/** Member's memory across conversations. */

export type MemoryItem = {
  id: string
  fact: string
  category: 'role' | 'school' | 'location' | 'preference' | 'other'
  created_at: string
}
export type MemoryState = {
  enabled: boolean
  available: boolean
  items: Array<MemoryItem>
}

export async function fetchMemory() {
  const { data } = await api.get<{ data: MemoryState }>('/v1/ai/memory')
  return data.data
}

export async function setMemoryEnabled(enabled: boolean) {
  const { data } = await api.put<{ data: MemoryState }>(
    '/v1/ai/memory/settings',
    { enabled },
    { headers: idem() },
  )
  return data.data
}

export async function deleteMemory(id: string) {
  const { data } = await api.delete<{ data: MemoryState }>(
    `/v1/ai/memory/${id}`,
    { headers: idem() },
  )
  return data.data
}

export async function clearMemory() {
  const { data } = await api.delete<{ data: MemoryState }>('/v1/ai/memory', {
    headers: idem(),
  })
  return data.data
}
