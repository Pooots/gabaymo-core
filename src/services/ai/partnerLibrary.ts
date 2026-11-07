import type { DocumentDetail, DocumentRow } from './documents'
import { api } from '@/lib/api'

/** Partner portal library. */

export async function fetchPartnerLibrary(q = '') {
  const { data } = await api.get<{ data: Array<DocumentRow> }>(
    '/v1/partner/ai/library',
    { params: { q: q || undefined } },
  )
  return data.data
}

export async function fetchPartnerLibraryDocument(id: string) {
  const { data } = await api.get<{
    data: {
      document: DocumentRow
      version: {
        source_url: string | null
        description: string | null
        effectivity_date: string | null
      }
      newer_issuances: DocumentDetail['relations']['newer']
      pages: Array<{ page_number: number; text: string }>
    }
  }>(`/v1/partner/ai/library/${id}`)
  return data.data
}
