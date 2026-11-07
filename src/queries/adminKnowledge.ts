import { useCallback } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryRoots } from './keys'
import type { QueryClient } from '@tanstack/react-query'
import type { DocumentFilters, DocumentMetadata, Instruction, RegionRow, SearchInput } from '@/services/ai'
import {
  BUSY_STATUSES,
  addRelation,
  correctPage,
  documentAction,
  draftAction,
  fetchChunks,
  fetchDocument,
  fetchDocuments,
  fetchDraft,
  fetchDrafts,
  fetchPages,
  fetchRegions,
  fetchReviewQueue,
  fetchSearchHistory,
  fetchVersions,
  instructionsApi,
  removeRelation,
  reviewDecision,
  runSearch,
  updateApplicability,
  updateMetadata,
  uploadDocument,
  uploadVersion,
} from '@/services/ai'
import { fetchPartners } from '@/services/partners'

/**
 * Admin knowledge area (Knowledge Library, Source Review, Knowledge Search,
 * Service Instructions, AI Review): query keys + hooks. Mutations invalidate
 * the keys they change; busy documents and drafts poll via refetchInterval.
 */
const knowledgeRoot = [...queryRoots.admin, 'knowledge'] as const
const reviewRoot = [...queryRoots.admin, 'aiReview'] as const

export type DraftFilters = { status: string; assigned: string; priority: string; q: string }

export const adminKnowledgeKeys = {
  all: knowledgeRoot,
  regions: () => [...knowledgeRoot, 'regions'] as const,
  documents: () => [...knowledgeRoot, 'documents'] as const,
  documentLists: () => [...knowledgeRoot, 'documents', 'list'] as const,
  documentList: (filters: DocumentFilters) => [...knowledgeRoot, 'documents', 'list', filters] as const,
  document: (id: string) => [...knowledgeRoot, 'documents', 'detail', id] as const,
  pages: (id: string, versionId: string) => [...knowledgeRoot, 'documents', 'detail', id, 'pages', versionId] as const,
  chunks: (id: string, versionId: string) => [...knowledgeRoot, 'documents', 'detail', id, 'chunks', versionId] as const,
  versions: (id: string) => [...knowledgeRoot, 'documents', 'detail', id, 'versions'] as const,
  reviewQueues: () => [...knowledgeRoot, 'reviews'] as const,
  reviewQueue: (tab: string) => [...knowledgeRoot, 'reviews', tab] as const,
  searchHistory: () => [...knowledgeRoot, 'searchHistory'] as const,
  partnerOptions: () => [...knowledgeRoot, 'partnerOptions'] as const,
  drafts: () => [...reviewRoot, 'drafts'] as const,
  draftList: (filters: DraftFilters) => [...reviewRoot, 'drafts', 'list', filters] as const,
  draft: (id: string) => [...reviewRoot, 'drafts', 'detail', id] as const,
  /** Instructions live under the admin or partner root depending on who edits them. */
  instructions: (base: 'admin' | 'partner') => [...(base === 'admin' ? queryRoots.admin : queryRoots.partner), 'instructions'] as const,
  instructionList: (base: 'admin' | 'partner', scope: string, partnerId: number | null) =>
    [...adminKnowledgeKeys.instructions(base), 'list', scope, partnerId] as const,
  instructionEffective: (base: 'admin' | 'partner', partnerId: number | null) =>
    [...adminKnowledgeKeys.instructions(base), 'effective', partnerId] as const,
  instructionVersions: (base: 'admin' | 'partner', id: number) => [...adminKnowledgeKeys.instructions(base), 'versions', id] as const,
}

const isBusy = (status: string | undefined) => status !== undefined && BUSY_STATUSES.includes(status)

/** Everything that shows a document: lists, detail, pages, chunks, versions, review queues. */
function invalidateDocuments(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: adminKnowledgeKeys.documents() }),
    client.invalidateQueries({ queryKey: adminKnowledgeKeys.reviewQueues() }),
  ])
}

// --- Reference data ----------------------------------------------------------

export function useRegions() {
  return useQuery({ queryKey: adminKnowledgeKeys.regions(), queryFn: fetchRegions, staleTime: Infinity })
}

export function usePartnerOptions() {
  return useQuery({ queryKey: adminKnowledgeKeys.partnerOptions(), queryFn: fetchPartners, staleTime: 5 * 60_000 })
}

// --- Documents ---------------------------------------------------------------

/** Library list; polls every 4 s while any listed document is still processing. */
export function useDocuments(filters: DocumentFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: adminKnowledgeKeys.documentList(filters),
    queryFn: () => fetchDocuments(filters),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.data.some((row) => isBusy(row.lifecycle_status)) ? 4000 : false),
    ...options,
  })
}

/** Lifecycle counts across the whole library (one-row list request). */
export function useDocumentStatusCounts() {
  return useQuery({
    queryKey: adminKnowledgeKeys.documentList({ per_page: 1 }),
    queryFn: () => fetchDocuments({ per_page: 1 }),
    select: (data) => data.meta.status_counts ?? {},
  })
}

/** Document detail; polls every 3 s while background jobs run. */
export function useDocument(id: string) {
  return useQuery({
    queryKey: adminKnowledgeKeys.document(id),
    queryFn: () => fetchDocument(id),
    refetchInterval: (query) => (isBusy(query.state.data?.document.lifecycle_status) ? 3000 : false),
  })
}

export function useDocumentPages(id: string, versionId: string) {
  return useQuery({
    queryKey: adminKnowledgeKeys.pages(id, versionId),
    queryFn: async () => (await fetchPages(id, { version_id: versionId })).pages,
  })
}

export function useDocumentChunks(id: string, versionId: string) {
  return useQuery({ queryKey: adminKnowledgeKeys.chunks(id, versionId), queryFn: () => fetchChunks(id, versionId) })
}

export function useDocumentVersions(id: string) {
  return useQuery({ queryKey: adminKnowledgeKeys.versions(id), queryFn: () => fetchVersions(id) })
}

/** Refresh everything that shows documents (after a change or a finished job). */
export function useInvalidateDocuments() {
  const client = useQueryClient()
  return useCallback(() => invalidateDocuments(client).then(() => undefined), [client])
}

/** Refresh only the list views (lists + review queues), not the detail being polled. */
export function useInvalidateDocumentLists() {
  const client = useQueryClient()
  return useCallback(
    () =>
      Promise.all([
        client.invalidateQueries({ queryKey: adminKnowledgeKeys.documentLists() }),
        client.invalidateQueries({ queryKey: adminKnowledgeKeys.reviewQueues() }),
      ]).then(() => undefined),
    [client],
  )
}

export function useUploadDocument() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { file: File; metadata: DocumentMetadata; onProgress: (percent: number) => void }) =>
      uploadDocument(input.file, input.metadata, input.onProgress),
    onSuccess: () => invalidateDocuments(client),
  })
}

export function useDocumentAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; action: 'reprocess' | 'submit' | 'archive' | 'retry-publish'; body?: Record<string, unknown> }) =>
      documentAction(input.id, input.action, input.body ?? {}),
    onSuccess: () => invalidateDocuments(client),
  })
}

export function useUpdateMetadata() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; metadata: Partial<DocumentMetadata>; note: string }) => updateMetadata(input.id, input.metadata, input.note),
    onSuccess: () => invalidateDocuments(client),
  })
}

export function useUploadVersion() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; file: File; note: string }) => uploadVersion(input.id, input.file, input.note),
    onSuccess: () => invalidateDocuments(client),
  })
}

export function useCorrectPage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; page: number; text: string; note: string }) => correctPage(input.id, input.page, input.text, input.note),
    onSuccess: () => invalidateDocuments(client),
  })
}

export function useUpdateApplicability() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; scope: string; rows: Array<RegionRow>; verified: boolean; note: string }) =>
      updateApplicability(input.id, input.scope, input.rows, input.verified, input.note),
    onSuccess: () => invalidateDocuments(client),
  })
}

export function useRelationActions() {
  const client = useQueryClient()
  const onSuccess = () => invalidateDocuments(client)
  return {
    add: useMutation({
      mutationFn: (input: { id: string; targetId: string; relation: string; effective: string }) =>
        addRelation(input.id, input.targetId, input.relation, input.effective, ''),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (input: { id: string; relationId: number }) => removeRelation(input.id, input.relationId),
      onSuccess,
    }),
  }
}

// --- Source Review -----------------------------------------------------------

export function useReviewQueue(tab: string) {
  return useQuery({ queryKey: adminKnowledgeKeys.reviewQueue(tab), queryFn: () => fetchReviewQueue(tab) })
}

export function useReviewDecision() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; decision: 'approve' | 'return' | 'reject'; body: Record<string, unknown> }) =>
      reviewDecision(input.id, input.decision, input.body),
    onSuccess: () => invalidateDocuments(client),
  })
}

// --- Knowledge Search --------------------------------------------------------

export function useSearchHistory() {
  return useQuery({ queryKey: adminKnowledgeKeys.searchHistory(), queryFn: fetchSearchHistory })
}

export function useRunSearch() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { search: SearchInput; generate: boolean }) => runSearch(input.search, input.generate),
    // Fire-and-forget: the history list refreshes in the background.
    onSuccess: () => void client.invalidateQueries({ queryKey: adminKnowledgeKeys.searchHistory() }),
  })
}

// --- AI Review queue ---------------------------------------------------------

/** Review queue; refreshes every 10 s while the tab is visible. */
export function useDrafts(filters: DraftFilters) {
  return useQuery({
    queryKey: adminKnowledgeKeys.draftList(filters),
    queryFn: () => fetchDrafts(filters),
    refetchInterval: 10_000,
  })
}

/** One draft; polls every 4 s while it is still being drafted. */
export function useDraft(id: string) {
  return useQuery({
    queryKey: adminKnowledgeKeys.draft(id),
    queryFn: () => fetchDraft(id),
    refetchInterval: (query) => (query.state.data?.answer_status === 'processing' ? 4000 : false),
  })
}

export function useDraftAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'reject' | 'edit' | 'handoff' | 'regenerate' | 'assign'; body: Record<string, unknown> }) =>
      draftAction(input.id, input.action, input.body),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKnowledgeKeys.drafts() }),
  })
}

// --- Service Instructions ----------------------------------------------------

export function useInstructions(base: 'admin' | 'partner', scope: 'global' | 'partner', partnerId: number | null) {
  return useQuery({
    queryKey: adminKnowledgeKeys.instructionList(base, scope, partnerId),
    queryFn: async () => (await instructionsApi(base).list({ scope, partner_id: partnerId })).filter((i) => i.scope === scope),
  })
}

export function useEffectiveInstructions(base: 'admin' | 'partner', partnerId: number | null) {
  return useQuery({
    queryKey: adminKnowledgeKeys.instructionEffective(base, partnerId),
    queryFn: () => instructionsApi(base).effective(partnerId),
  })
}

export function useInstructionVersions(base: 'admin' | 'partner', id: number) {
  return useQuery({ queryKey: adminKnowledgeKeys.instructionVersions(base, id), queryFn: () => instructionsApi(base).versions(id) })
}

export type InstructionDraft = {
  id: number | null
  title: string
  instruction_body: string
  is_active: boolean
  is_mandatory: boolean
}

/** Saves a whole edited list: creates new rows, updates changed ones, then reorders. */
export function useInstructionActions(base: 'admin' | 'partner') {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: adminKnowledgeKeys.instructions(base) })
  return {
    save: useMutation({
      mutationFn: async (input: { scope: 'global' | 'partner'; partnerId: number | null; rows: Array<InstructionDraft>; saved: Array<Instruction> }) => {
        const api = instructionsApi(base)
        const { scope, partnerId, rows, saved } = input
        const ids: Array<number> = []
        for (const row of rows) {
          if (row.id === null) {
            const created = await api.create({
              scope,
              partner_id: partnerId,
              title: row.title.trim(),
              instruction_body: row.instruction_body.trim(),
              is_active: row.is_active,
              is_mandatory: scope === 'global' && row.is_mandatory,
            })
            ids.push(created.id)
            continue
          }
          const original = saved.find((s) => s.id === row.id)
          if (
            original &&
            (original.title !== row.title || original.instruction_body !== row.instruction_body || original.is_active !== row.is_active || original.is_mandatory !== row.is_mandatory)
          ) {
            await api.update(row.id, {
              title: row.title.trim(),
              instruction_body: row.instruction_body.trim(),
              is_active: row.is_active,
              ...(scope === 'global' ? { is_mandatory: row.is_mandatory } : {}),
              expected_version: original.version,
            })
          }
          ids.push(row.id)
        }
        const orderChanged = ids.length > 1 && ids.some((id, i) => saved[i]?.id !== id)
        if (orderChanged) await api.reorder(scope, ids, partnerId)
      },
      onSuccess,
    }),
    archive: useMutation({ mutationFn: (id: number) => instructionsApi(base).archive(id), onSuccess }),
  }
}

