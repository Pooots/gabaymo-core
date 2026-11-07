import { ADMIN, idem } from './shared'
import { adminApi, api } from '@/lib/api'

/** Service instructions (admin global + partner scoped). */

export type Instruction = {
  id: number
  scope: 'global' | 'partner'
  partner_id: number | null
  title: string
  instruction_body: string
  priority: number
  is_active: boolean
  is_mandatory: boolean
  version: number
  updated_by_name: string | null
  updated_at: string | null
}

export type EffectiveInstructions = {
  tiers: Array<{
    tier: number
    label: string
    items: Array<{
      id: number | null
      title: string
      body: string
      version: number | string
    }>
  }>
  text: string
  hash: string
  partner_id: number | null
}

export function instructionsApi(base: 'admin' | 'partner') {
  const root =
    base === 'admin' ? `${ADMIN}/instructions` : '/v1/partner/ai/instructions'
  const client = base === 'admin' ? adminApi : api
  return {
    async list(params: { scope?: string; partner_id?: number | null } = {}) {
      const { data } = await client.get<{ data: Array<Instruction> }>(root, {
        params: { ...params, partner_id: params.partner_id ?? undefined },
      })
      return data.data
    },
    async create(input: Partial<Instruction>) {
      const { data } = await client.post<{ data: Instruction }>(root, input, {
        headers: idem(),
      })
      return data.data
    },
    async update(
      id: number,
      input: Partial<Instruction> & { expected_version?: number },
    ) {
      const { data } = await client.patch<{ data: Instruction }>(
        `${root}/${id}`,
        input,
        { headers: idem() },
      )
      return data.data
    },
    async archive(id: number) {
      await client.delete(`${root}/${id}`, { headers: idem() })
    },
    async reorder(
      scope: 'global' | 'partner',
      ids: Array<number>,
      partnerId?: number | null,
    ) {
      await client.post(
        `${root}/reorder`,
        { scope, ids, partner_id: partnerId ?? undefined },
        { headers: idem() },
      )
    },
    async effective(partnerId?: number | null) {
      const { data } = await client.get<{ data: EffectiveInstructions }>(
        `${root}/effective`,
        { params: { partner_id: partnerId ?? undefined } },
      )
      return data.data
    },
    async versions(id: number) {
      const { data } = await client.get<{
        data: Array<{
          version: number
          title: string
          instruction_body: string
          change_type: string
          changed_by_name: string | null
          created_at: string
        }>
      }>(`${root}/${id}/versions`)
      return data.data
    },
  }
}
