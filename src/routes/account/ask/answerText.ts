import type { ChatMessage } from '@/services/ai'

type Citation = NonNullable<ChatMessage['citations']>[number]

/** The answer without its trailing plain "Sources:" list (shown as chips / a list instead). */
export function answerBody(message: ChatMessage) {
  return message.content.split(/\n\nSources:\n/)[0] ?? ''
}

/** One entry per marker, in order. */
export function uniqueSources(message: ChatMessage): Array<Citation> {
  return [...new Map((message.citations ?? []).map((c) => [c.marker, c])).values()]
}

export function sourceNumber(citation: Citation) {
  return citation.marker.replace(/^S/, '')
}

/** "DepEd Order No. 13, s. 2016 — Guidelines on…, page 12" */
export function sourceLine(citation: Citation, pageLabel: (page: number) => string) {
  const name = [citation.document_number, citation.title].filter(Boolean).join(' — ')
  return `[${sourceNumber(citation)}] ${name || citation.marker}${citation.page ? `, ${pageLabel(citation.page)}` : ''}`
}

/** The answer text plus a numbered source list, for the clipboard. */
export function answerWithCitations(message: ChatMessage, heading: string, pageLabel: (page: number) => string) {
  const sources = uniqueSources(message)
  const body = answerBody(message).trim()
  if (sources.length === 0) return body
  return `${body}\n\n${heading}:\n${sources.map((c) => sourceLine(c, pageLabel)).join('\n')}`
}

/** `my_feedback` comes as `{rating, reason}` from gabaymo-ai, or a bare rating per the contract. */
export function feedbackOf(message: ChatMessage): { rating: 'up' | 'down'; reason: string | null } | null {
  const value = message.my_feedback
  if (!value) return null
  return typeof value === 'string' ? { rating: value, reason: null } : { rating: value.rating, reason: value.reason }
}
