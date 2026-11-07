import type { MessageKey } from '@/i18n'

/** Why a draft needs a reviewer: API reason code → message key. */
export const reasonKeys: Record<string, MessageKey> = {
  insufficient_evidence: 'adminKnowledge.reasonInsufficientEvidence',
  out_of_scope: 'adminKnowledge.reasonOutOfScope',
  no_governing_evidence: 'adminKnowledge.reasonNoGoverningEvidence',
  unknown_source: 'adminKnowledge.reasonUnknownSource',
  source_withdrawn: 'adminKnowledge.reasonSourceWithdrawn',
  source_not_current_version: 'adminKnowledge.reasonNotCurrentVersion',
  source_not_approved: 'adminKnowledge.reasonNotApproved',
  source_unauthorized: 'adminKnowledge.reasonUnauthorized',
  quote_not_found: 'adminKnowledge.reasonQuoteNotFound',
  quote_too_short: 'adminKnowledge.reasonQuoteTooShort',
  uncited_claim: 'adminKnowledge.reasonUncitedClaim',
  unknown_marker: 'adminKnowledge.reasonUnknownMarker',
  no_claims: 'adminKnowledge.reasonNoClaims',
  reference_not_labeled: 'adminKnowledge.reasonReferenceNotLabeled',
  outdated_not_labeled: 'adminKnowledge.reasonOutdatedNotLabeled',
  newer_issuance_not_cited: 'adminKnowledge.reasonNewerNotCited',
  unverified_document_number: 'adminKnowledge.reasonUnverifiedNumber',
  unsupported_claim: 'adminKnowledge.reasonUnsupportedClaim',
  partially_supported_claim: 'adminKnowledge.reasonPartiallySupported',
  interpretation_needs_review: 'adminKnowledge.reasonInterpretation',
  support_check_degraded: 'adminKnowledge.reasonSupportDegraded',
  user_region_unknown: 'adminKnowledge.reasonUserRegionUnknown',
  regional_exceptions_may_apply: 'adminKnowledge.reasonRegionalExceptions',
  source_amended: 'adminKnowledge.reasonSourceAmended',
}

export type StatusTab = 'open' | 'ready_for_review' | 'needs_confirmation' | 'partner_handoff' | 'processing' | 'sent' | 'rejected' | 'failed'

export const statusTabs: Array<{ id: StatusTab; label: MessageKey; keys: Array<string> }> = [
  { id: 'open', label: 'adminKnowledge.tabOpen', keys: ['ready_for_review', 'needs_confirmation', 'partner_handoff'] },
  { id: 'ready_for_review', label: 'adminKnowledge.answerReady', keys: ['ready_for_review'] },
  { id: 'needs_confirmation', label: 'adminKnowledge.answerNeedsConfirmation', keys: ['needs_confirmation'] },
  { id: 'partner_handoff', label: 'adminKnowledge.tabHandoff', keys: ['partner_handoff'] },
  { id: 'processing', label: 'adminKnowledge.answerProcessing', keys: ['processing'] },
  { id: 'sent', label: 'adminKnowledge.answerSent', keys: ['sent', 'approved'] },
  { id: 'rejected', label: 'adminKnowledge.answerRejected', keys: ['rejected'] },
  { id: 'failed', label: 'adminKnowledge.answerFailed', keys: ['failed'] },
]

export type DraftActionName = 'approve' | 'reject' | 'edit' | 'handoff' | 'regenerate' | 'assign'
