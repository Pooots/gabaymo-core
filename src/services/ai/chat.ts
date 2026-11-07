import type { TokenUsage } from '@/services/usage'
import { api } from '@/lib/api'

/** Member questions and conversations. */

export type QuestionState = {
  id: string
  conversation_id: string
  text: string
  status: string
  answer_state:
    | 'drafting'
    | 'in_review'
    | 'sent'
    | 'rejected'
    | 'failed'
    | 'needs_region'
    | 'handoff'
    | 'no_answer'
  /** Live progress while the answer is prepared. */
  progress?: {
    stage: 'searching' | 'writing' | 'checking' | 'sending'
    sources?: number
  } | null
  answer_message_id: number | null
  created_at: string | null
}

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant' | 'notice'
  content: string
  question_id: string | null
  citations: Array<{
    marker: string
    title: string | null
    document_number: string | null
    page: number | null
    section: string | null
    quoted_text: string | null
    authority_role: string | null
    legal_status: string | null
    citation_verified: boolean
  }> | null
  meta?: {
    kind?: string
    reviewed_by?: string | null
    partner_take?: { text: string } | null
  } | null
  created_at: string
  /**
   * The member's own rating. gabaymo-ai sends `{rating, reason, updated_at}`;
   * the contract (section C) says a bare "up" | "down", so both are accepted.
   */
  my_feedback?: { rating: 'up' | 'down'; reason: string | null; updated_at?: string | null } | 'up' | 'down' | null
}

export async function askQuestion(
  message: string,
  conversationId: string | null,
  idempotencyKey: string,
) {
  const { data } = await api.post<{ data: QuestionState; usage: TokenUsage }>(
    '/v1/ai/ask',
    { message, conversation_id: conversationId ?? undefined },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return data
}

/** One past question thread in the member's sidebar / activity list. */
export type ConversationSummary = {
  id: string
  title: string | null
  last_message_at: string | null
}

export async function fetchConversations() {
  const { data } = await api.get<{ data: Array<ConversationSummary> }>('/v1/ai/conversations')
  return data.data
}

export async function fetchMessages(conversationId: string) {
  const { data } = await api.get<{
    data: Array<ChatMessage>
    meta: { questions: Array<QuestionState> }
  }>(`/v1/ai/conversations/${conversationId}/messages`)
  return data
}
