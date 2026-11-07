import { ADMIN, idem } from './shared'
import { adminApi } from '@/lib/api'

/** Admin Knowledge Search (retrieval + answer preview). */

export type Evidence = {
  marker: string
  chunk_id: string
  document_id: string
  document_version_id: string
  title: string
  document_number: string | null
  document_type_label: string
  issuing_authority: string | null
  scope: string
  region_codes: Array<string>
  region_names: Array<string>
  page_start: number
  page_end: number
  section: string | null
  paragraph_ref: string | null
  excerpt?: string
  text: string
  score: number
  role: 'governing' | 'reference' | 'historical'
  role_reason: string
  flags: Array<string>
  legal_status: string
  outdated: boolean
  newer_issuances: Array<{
    document_id: string
    relation: string
    title: string
    document_number: string | null
    in_evidence?: boolean
  }>
  publication_status: string
}

export type Exclusion = {
  chunk_id: string
  document_id: string | null
  title: string | null
  document_number: string | null
  page_start: number | null
  score: number
  reason: string
}

export type Citation = {
  marker: string
  claim_index: number
  document_id: string | null
  page: number | null
  section: string | null
  quoted_text: string | null
  authority_role: string | null
  source_exists: boolean
  approval_verified: boolean
  version_verified: boolean
  literal_match: boolean
  page_verified: boolean
  region_verified: boolean
  support_verdict?: string
  citation_verified?: boolean
  issues: Array<string>
}

/** "A partner's take": practical guidance built from a partner's saved answer. Never cited, never part of the documents answer. */
export type PartnerTake = {
  text: string
  method: 'adapted' | 'verbatim'
  answer_id: string
  partner_id: number
  score: number
  model: string | null
}

/** A partner's saved answer (Train GabayMo) that matched the question. Never a cited source. */
export type PreferredAnswer = {
  marker: string
  answer_id: string
  partner_id: number
  question: string
  answer: string
  score: number
  source_marker: string
}

export type SearchResult = {
  search_id: number
  status?: string
  plan: {
    mode: string
    target_regions: Array<string>
    interpretation: Array<string>
    geo: {
      region_code: string | null
      region_name: string | null
      source: string
    }
  }
  sources: Array<Evidence>
  excluded: Array<Exclusion>
  preferred_answers?: Array<PreferredAnswer>
  partner_take?: PartnerTake | null
  answer?: {
    text: string
    validated_text: string
    claims: Array<{
      text: string
      kind: string
      citations: Array<{ source: string; quote: string; page: number | null }>
      support?: { verdict: string; reason: string } | null
    }>
    citations: Array<Citation>
    issues: Array<{ code: string; severity: string; detail: string }>
    route: {
      status: string
      risk: string
      reasons: Array<string>
      hard_blocked?: boolean
    }
    verified: boolean
    support_method?: string
  } | null
  diagnostics: {
    query_interpretation: Array<string>
    resolved_region: {
      region_code: string | null
      region_name: string | null
      source: string
    }
    search_mode: string
    effective_filters: unknown
    candidates: number
    excluded: number
    returned: number
    governing: number
    retrieval_ms: number
    generation_ms?: number
    embedding_tokens: number
    token_usage?: Record<string, number>
    estimated_cost_usd?: number
    model?: string
  }
}

export type SearchInput = {
  question: string
  mode: string
  region?: string
  partner_id?: number
  document_types?: Array<string>
  regions?: Array<string>
}

export async function runSearch(input: SearchInput, generate: boolean) {
  const { data } = await adminApi.post<{ data: SearchResult }>(
    `${ADMIN}/knowledge/${generate ? 'answer' : 'search'}`,
    input,
    { headers: generate ? idem() : {}, timeout: generate ? 130000 : 30000 },
  )
  return data.data
}

export async function fetchSearchHistory() {
  const { data } = await adminApi.get<{
    data: Array<{
      id: number
      query: string
      search_mode: string
      generated: boolean
      returned: number
      created_at: string | null
      resolved_region: { region_code: string | null } | null
    }>
  }>(`${ADMIN}/knowledge/search-history`)
  return data.data
}
