import axios from 'axios'

import { api } from '@/lib/api'

export const knowledgeCategories = [
  'MOOE and Liquidation',
  'Procurement and Bidding',
  'School Forms and Reports',
  'Teacher Workload',
  'Administrative Responsibilities',
  'Personnel Management',
  'Complaints and Grievances',
  'Child Protection',
  'School Governance',
  'Financial Management',
  'Other DepEd Policies',
] as const

export const knowledgeKinds = [
  { value: 'deped_order', label: 'DepEd Order' },
  { value: 'memorandum', label: 'DepEd Memorandum' },
  { value: 'republic_act', label: 'Republic Act' },
  { value: 'csc', label: 'CSC issuance' },
  { value: 'court', label: 'Court decision' },
  { value: 'other', label: 'Other' },
] as const

export type KnowledgeKind = (typeof knowledgeKinds)[number]['value']
export type KnowledgeCategory = (typeof knowledgeCategories)[number]

export type KnowledgeDocument = {
  id: number
  title: string
  category: KnowledgeCategory
  kind: KnowledgeKind
  kind_label: string
  reference: string | null
  summary: string
  content: string
  active: boolean
  source_status: 'pending' | 'approved' | 'returned'
  source_note: string | null
  updated_at: string | null
}

export type KnowledgeInput = {
  title: string
  category: KnowledgeCategory
  kind: KnowledgeKind
  reference: string | null
  summary: string
  content: string
  active: boolean
}

export async function fetchKnowledgeDocuments() {
  const { data } = await api.get<{ documents: KnowledgeDocument[] }>(
    '/v1/admin/knowledge-documents',
  )
  return data.documents
}

export async function reviewKnowledgeDocument(
  id: number,
  sourceStatus: 'approved' | 'returned',
  sourceNote: string,
) {
  const { data } = await api.put<{ document: KnowledgeDocument }>(
    `/v1/admin/knowledge-documents/${id}/review`,
    { source_status: sourceStatus, source_note: sourceNote || null },
  )
  return data.document
}

export async function saveKnowledgeDocument(
  id: number | null,
  input: KnowledgeInput,
) {
  const response = id
    ? await api.put<{ document: KnowledgeDocument }>(
        `/v1/admin/knowledge-documents/${id}`,
        input,
      )
    : await api.post<{ document: KnowledgeDocument }>(
        '/v1/admin/knowledge-documents',
        input,
      )
  return response.data.document
}

export function knowledgeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { message?: string; errors?: Record<string, string[]> } | undefined
    const first = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined
    return first || data?.message || 'Could not save this document.'
  }
  return 'Could not save this document.'
}
