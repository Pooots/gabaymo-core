import { ADMIN, idem } from './shared'
import type { Paginated } from './shared'
import { adminApi } from '@/lib/api'

/** Admin knowledge library documents (upload, versions, pages, metadata). */

export type DocumentRow = {
  id: string
  title: string
  document_type: string
  document_type_label: string
  document_number: string | null
  issuing_authority: string | null
  category: string | null
  visibility: string
  owner_partner_id: number | null
  lifecycle_status: string
  legal_status: string
  legal_status_label: string
  applicability_scope: string
  region_codes: Array<string>
  region_names: Array<string>
  is_published: boolean
  published_version_id: string | null
  current_version_id: string | null
  current_version: {
    id: string
    version_number: number
    processing_status: string
    processing_progress: number
    processing_error: string | null
    review_status: string
    publication_status: string
    original_filename: string
    extension: string
    file_size: number
    page_count: number | null
    completeness: number | null
    warnings_count: number
    auto_approval?: AutoApprovalState | null
  } | null
  tags?: Array<string>
  uploaded_by_name: string | null
  created_at: string | null
  updated_at: string | null
}

/** Upload-time "approve when ready": pending, approved, or stopped for a manual review. */
export type AutoApprovalState = {
  status: 'pending' | 'approved' | 'needs_review'
  reasons: Array<string>
  requested_by?: string | null
}

export type AutoApproveRequest = {
  source_authenticity_checked: boolean
  applicability_verified: boolean
  reason?: string | null
}

export type RegionRow = {
  id?: number
  relation: 'issuing_origin' | 'mentioned' | 'applies_to' | 'excluded'
  level: 'national' | 'region' | 'province' | 'city' | 'division' | 'school'
  region_code: string | null
  province_code?: string | null
  division_code?: string | null
  school_id?: string | null
  detected_label?: string | null
  confidence?: number
  method?: string
  evidence_page?: number | null
  evidence_text?: string | null
  review_verified?: boolean
}

export type VersionDetail = {
  id: string
  document_id: string
  version_number: number
  change_type: string
  change_note: string | null
  original_filename: string
  mime_type: string
  extension: string
  file_size: number
  file_hash: string
  metadata: Record<string, string | Array<string> | number | null> & {
    title: string
    document_type: string
    document_number: string | null
    issuing_authority: string | null
    source_url: string | null
    keywords: Array<string>
    applicable_audience: Array<string>
  }
  applicability: {
    scope: string
    verified: boolean
    rows?: Array<RegionRow>
    classification: {
      scope: string
      confidence: number
      summary: string
      warnings: Array<string>
      needs_review: boolean
      /** Number read from a scan or a handwritten/stamped blank; a reviewer must confirm it. */
      document_number_check?: {
        value: string
        reason: 'handwritten' | 'scanned'
        text_layer: string | null
        image_reading: string | null
      } | null
      ai_suggestion?: {
        scope: string
        applies_to_regions: Array<string>
        excluded_regions: Array<string>
        rationale: string
      } | null
    } | null
  }
  signals: {
    document_numbers?: Array<{ page: number; text: string; normalized: string }>
    dates?: Array<{ page: number; text: string }>
    supersession?: Array<{
      page: number
      relation: string
      target_text: string
      snippet: string
    }>
  } | null
  processing: {
    status: string
    progress: number
    error: string | null
    summary: {
      page_count?: number
      readable_pages?: number
      pages_needing_ocr?: number
      completeness?: number
      warnings?: Array<string>
      ocr_pages?: number
    } | null
    jobs?: Array<{
      stage: string
      status: string
      progress: number
      message: string | null
      error: string | null
      finished_at: string | null
    }>
  }
  review: {
    status: string
    note: string | null
    approved_by_name: string | null
    approved_at: string | null
    metadata_revision: number
    fingerprint: string | null
    auto_approval?: AutoApprovalState | null
    history?: Array<{
      decision: string
      note: string | null
      reviewer_name: string | null
      created_at: string | null
      exception_reason: string | null
    }>
  }
  publication: {
    status: string
    published_at: string | null
    error?: { message: string; at: string | null } | null
  }
  uploaded_by_name: string | null
  created_at: string | null
  is_current?: boolean
  is_published?: boolean
}

export type Readiness = { code: string; message: string; blocking: boolean }

export type DocumentDetail = {
  document: DocumentRow
  current_version: VersionDetail | null
  published_version: {
    id: string
    version_number: number
    published_at: string | null
    approved_by_name: string | null
  } | null
  readiness: Array<Readiness>
  relations: {
    newer: Array<{
      document_id: string
      relation: string
      title: string
      document_number: string | null
      effective_date: string | null
      published: boolean
    }>
    older: Array<{
      id: number
      relation: string
      document_id: string
      title: string | null
      document_number: string | null
      effective_date: string | null
    }>
    suggested: Array<{
      page: number
      relation: string
      target_text: string
      snippet: string
      match_document_id: string | null
      match_title: string | null
    }>
  }
}

export type PageRow = {
  page_number: number
  text: string
  extracted_text: string | null
  is_corrected: boolean
  correction_revision: number
  corrected_by_name: string | null
  extraction_method: string
  quality: string
  needs_ocr: boolean
  ocr_confidence: number | null
  warnings: Array<string>
  highlights: {
    document_numbers: Array<string>
    dates: Array<string>
    regions: Array<string>
    effectivity: Array<string>
  }
  search_matches: number
}

export type ChunkRow = {
  id: string
  chunk_index: number
  page_start: number
  page_end: number
  section_heading: string | null
  paragraph_ref: string | null
  text: string
  token_count: number
  index_status: string
}

export type DocumentFilters = {
  q?: string
  status?: string
  region?: string
  document_type?: string
  partner_id?: string
  date_from?: string
  date_to?: string
  sort?: string
  page?: number
  per_page?: number
}

export async function fetchDocuments(filters: DocumentFilters) {
  const params = Object.fromEntries(
    Object.entries(
      filters as Record<string, string | number | undefined>,
    ).filter(([, v]) => v !== '' && v !== undefined),
  )
  const { data } = await adminApi.get<
    Paginated<DocumentRow> & {
      meta: { status_counts?: Record<string, number> }
    }
  >(`${ADMIN}/knowledge/documents`, { params })
  return data
}

export async function fetchDocument(id: string) {
  const { data } = await adminApi.get<{ data: DocumentDetail }>(
    `${ADMIN}/knowledge/documents/${id}`,
  )
  return data.data
}

export async function fetchPages(
  id: string,
  params: { version_id?: string; q?: string } = {},
) {
  const { data } = await adminApi.get<{
    data: { version_id: string; version_number: number; pages: Array<PageRow> }
  }>(`${ADMIN}/knowledge/documents/${id}/pages`, { params })
  return data.data
}

export async function fetchChunks(id: string, versionId?: string) {
  const { data } = await adminApi.get<{ data: { chunks: Array<ChunkRow> } }>(
    `${ADMIN}/knowledge/documents/${id}/chunks`,
    { params: versionId ? { version_id: versionId } : {} },
  )
  return data.data.chunks
}

export async function fetchVersions(id: string) {
  const { data } = await adminApi.get<{ data: Array<VersionDetail> }>(
    `${ADMIN}/knowledge/documents/${id}/versions`,
  )
  return data.data
}

export type DocumentMetadata = {
  title: string
  document_type: string
  document_number?: string | null
  issuing_authority?: string | null
  issuing_office?: string | null
  source_url?: string | null
  category?: string | null
  description?: string | null
  publication_date?: string | null
  effectivity_date?: string | null
  expiration_date?: string | null
  revision_number?: string | null
  keywords?: Array<string>
  applicable_audience?: Array<string>
  visibility?: string
  owner_partner_id?: number | null
  applicability_scope?: string | null
  applicable_region_codes?: Array<string>
}

export async function uploadDocument(
  file: File,
  metadata: DocumentMetadata,
  onProgress?: (percent: number) => void,
  autoApprove?: AutoApproveRequest | null,
) {
  const form = new FormData()
  form.append('file', file)
  form.append('metadata', JSON.stringify(metadata))
  if (autoApprove) form.append('auto_approve', JSON.stringify(autoApprove))
  const { data } = await adminApi.post<{ data: DocumentRow }>(
    `${ADMIN}/knowledge/documents`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data', ...idem() },
      onUploadProgress: (e) =>
        onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    },
  )
  return data.data
}

export async function uploadVersion(id: string, file: File, note: string) {
  const form = new FormData()
  form.append('file', file)
  if (note) form.append('note', note)
  const { data } = await adminApi.post(
    `${ADMIN}/knowledge/documents/${id}/versions`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data', ...idem() } },
  )
  return data
}

export async function updateMetadata(
  id: string,
  metadata: Partial<DocumentMetadata>,
  note: string,
) {
  const { data } = await adminApi.patch(
    `${ADMIN}/knowledge/documents/${id}`,
    { metadata, note: note || null },
    { headers: idem() },
  )
  return data
}

export async function correctPage(
  id: string,
  page: number,
  text: string,
  note: string,
) {
  const { data } = await adminApi.put(
    `${ADMIN}/knowledge/documents/${id}/pages/${page}`,
    { text, note },
    { headers: idem() },
  )
  return data
}

export async function updateApplicability(
  id: string,
  scope: string,
  rows: Array<RegionRow>,
  verified: boolean,
  note: string,
) {
  const { data } = await adminApi.put(
    `${ADMIN}/knowledge/documents/${id}/applicability`,
    {
      scope,
      rows: rows.map((r) => ({
        relation: r.relation,
        level: r.level,
        region_code: r.region_code,
        division_code: r.division_code ?? null,
        school_id: r.school_id ?? null,
        province_code: r.province_code ?? null,
      })),
      verified,
      note: note || null,
    },
    { headers: idem() },
  )
  return data
}

export async function documentAction(
  id: string,
  action: 'reprocess' | 'submit' | 'archive' | 'retry-publish',
  body: Record<string, unknown> = {},
) {
  const { data } = await adminApi.post(
    `${ADMIN}/knowledge/documents/${id}/${action}`,
    body,
    { headers: idem() },
  )
  return data
}

export async function addRelation(
  id: string,
  targetId: string,
  relation: string,
  effectiveDate: string,
  note: string,
) {
  const { data } = await adminApi.post(
    `${ADMIN}/knowledge/documents/${id}/relations`,
    {
      target_document_id: targetId,
      relation,
      effective_date: effectiveDate || null,
      note: note || null,
    },
    { headers: idem() },
  )
  return data
}

export async function removeRelation(id: string, relationId: number) {
  await adminApi.delete(
    `${ADMIN}/knowledge/documents/${id}/relations/${relationId}`,
    { headers: idem() },
  )
}

/** Authorized download through ws (session cookie), returned as a blob URL. */
export async function originalFileUrl(id: string, versionId?: string) {
  const response = await adminApi.get<Blob>(
    `${ADMIN}/knowledge/documents/${id}/download`,
    {
      params: versionId ? { version_id: versionId } : {},
      responseType: 'blob',
    },
  )
  return URL.createObjectURL(response.data)
}
