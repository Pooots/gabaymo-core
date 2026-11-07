import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'
import { answerStatusLabels, documentTypes, lifecycleLabels } from '@/services/ai'

/**
 * Translated labels for status codes and document types that the services
 * describe in English. Unknown codes fall back to the service label, then the code.
 */
const lifecycleKeys: Record<string, MessageKey> = {
  uploaded: 'adminKnowledge.lifecycleUploaded',
  extracting: 'adminKnowledge.lifecycleExtracting',
  extracted: 'adminKnowledge.lifecycleExtracted',
  classifying: 'adminKnowledge.lifecycleClassifying',
  awaiting_review: 'adminKnowledge.lifecycleAwaitingReview',
  returned: 'adminKnowledge.lifecycleReturned',
  corrected: 'adminKnowledge.lifecycleCorrected',
  approved: 'adminKnowledge.lifecycleApproved',
  indexing: 'adminKnowledge.lifecycleIndexing',
  published: 'adminKnowledge.lifecyclePublished',
  index_failed: 'adminKnowledge.lifecycleIndexFailed',
  rejected: 'adminKnowledge.lifecycleRejected',
  failed: 'adminKnowledge.lifecycleFailed',
  quarantined: 'adminKnowledge.lifecycleQuarantined',
  archived: 'adminKnowledge.lifecycleArchived',
  withdrawn: 'adminKnowledge.lifecycleWithdrawn',
}

const typeKeys: Record<string, MessageKey> = {
  deped_order: 'adminKnowledge.typeDepedOrder',
  deped_memorandum: 'adminKnowledge.typeDepedMemorandum',
  regional_memorandum: 'adminKnowledge.typeRegionalMemorandum',
  division_memorandum: 'adminKnowledge.typeDivisionMemorandum',
  advisory: 'adminKnowledge.typeAdvisory',
  official_circular: 'adminKnowledge.typeOfficialCircular',
  policy: 'adminKnowledge.typePolicy',
  administrative_guideline: 'adminKnowledge.typeAdministrativeGuideline',
  republic_act: 'adminKnowledge.typeRepublicAct',
  csc_issuance: 'adminKnowledge.typeCscIssuance',
  court_decision: 'adminKnowledge.typeCourtDecision',
  partner_knowledge: 'adminKnowledge.typePartnerKnowledge',
  other: 'adminKnowledge.typeOther',
}

const legalKeys: Record<string, MessageKey> = {
  amended: 'adminKnowledge.legalAmended',
  superseded: 'adminKnowledge.legalSuperseded',
  revoked: 'adminKnowledge.legalRevoked',
  expired: 'adminKnowledge.legalExpired',
  historical: 'adminKnowledge.legalHistorical',
}

const answerKeys: Record<string, MessageKey> = {
  processing: 'adminKnowledge.answerProcessing',
  ready_for_review: 'adminKnowledge.answerReady',
  needs_confirmation: 'adminKnowledge.answerNeedsConfirmation',
  partner_handoff: 'adminKnowledge.answerPartnerHandoff',
  approved: 'adminKnowledge.answerApproved',
  sent: 'adminKnowledge.answerSent',
  rejected: 'adminKnowledge.answerRejected',
  failed: 'adminKnowledge.answerFailed',
  cancelled: 'adminKnowledge.answerReplaced',
}

const typeFallback: Record<string, string> = Object.fromEntries(documentTypes.map((d) => [d.value, d.label]))

export function useKnowledgeLabels() {
  const { t } = useI18n()
  const pick = (keys: Record<string, MessageKey>, fallback: Record<string, string>, code: string) => {
    const key = keys[code]
    return key ? t(key) : (fallback[code] ?? code)
  }
  return {
    lifecycle: (status: string) => pick(lifecycleKeys, lifecycleLabels, status),
    /** `apiLabel` (the API's own label) is used for types this app does not know. */
    documentType: (type: string, apiLabel?: string) => {
      const key = typeKeys[type]
      return key ? t(key) : (apiLabel ?? typeFallback[type] ?? type)
    },
    legal: (status: string) => pick(legalKeys, {}, status),
    answerStatus: (status: string) => pick(answerKeys, answerStatusLabels, status),
    /** Document types for <select> options, translated. */
    documentTypes: documentTypes.map((d) => ({ value: d.value, label: pick(typeKeys, typeFallback, d.value) })),
  }
}
