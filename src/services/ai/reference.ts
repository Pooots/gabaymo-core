import { ADMIN } from './shared'
import { adminApi } from '@/lib/api'

/** Reference data: regions, document types, shelves, lifecycle labels. */

export type Region = {
  code: string
  name: string
  long_name: string
  provinces?: Array<{ code: string; name: string }>
}

let regionCache: Promise<Array<Region>> | null = null
export function fetchRegions() {
  regionCache ??= adminApi
    .get<{ data: Array<Region> }>(`${ADMIN}/geo/regions`)
    .then((r) => r.data.data)
    .catch((e) => {
      regionCache = null
      throw e
    })
  return regionCache
}

export const documentTypes = [
  { value: 'deped_order', label: 'DepEd Order' },
  { value: 'deped_memorandum', label: 'DepEd Memorandum' },
  { value: 'regional_memorandum', label: 'Regional Memorandum' },
  { value: 'division_memorandum', label: 'Division Memorandum' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'official_circular', label: 'Official Circular' },
  { value: 'policy', label: 'Policy' },
  { value: 'administrative_guideline', label: 'Administrative Guideline' },
  { value: 'republic_act', label: 'Republic Act' },
  { value: 'csc_issuance', label: 'CSC issuance' },
  { value: 'court_decision', label: 'Court decision' },
  { value: 'partner_knowledge', label: 'Partner Knowledge' },
  { value: 'other', label: 'Other' },
] as const

export const shelves = [
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

export const lifecycleLabels: Record<string, string> = {
  uploaded: 'Uploaded',
  extracting: 'Extracting',
  extracted: 'Extracted',
  classifying: 'Classifying',
  awaiting_review: 'Awaiting review',
  returned: 'Returned',
  corrected: 'Corrected',
  approved: 'Approved',
  indexing: 'Indexing',
  published: 'Published',
  index_failed: 'Indexing failed',
  rejected: 'Rejected',
  failed: 'Extraction failed',
  quarantined: 'Quarantined',
  archived: 'Archived',
  withdrawn: 'Withdrawn',
}

export function lifecycleTone(
  status: string,
): 'green' | 'amber' | 'red' | 'gray' {
  if (status === 'published') return 'green'
  if (
    ['returned', 'rejected', 'failed', 'quarantined', 'index_failed'].includes(
      status,
    )
  )
    return 'red'
  if (['archived', 'withdrawn'].includes(status)) return 'gray'
  return 'amber'
}

export const BUSY_STATUSES = [
  'uploaded',
  'extracting',
  'extracted',
  'classifying',
  'indexing',
]
