import axios from 'axios'

import { api } from '@/lib/api'

/**
 * Train GabayMo (partner portal).
 *
 * gabaymo-ai picks a random passage from a published document the partner
 * may see (approved in Source Review and embedded), writes a question a
 * school head might ask about it, and drafts an answer from that passage only.
 * The partner rewrites the answer in their own words. Saved answers live on
 * the server and build the partner's voice profile, which GabayMo then uses
 * as a style instruction for that partner.
 *
 * All calls go through gabaymo-ws (`/v1/partner/ai/training/...`), which signs
 * them with the partner id from the session.
 */

const BASE = '/v1/partner/ai/training'

export type TrainingSource = {
  documentId: string | null
  title: string
  reference: string
  page: number
  excerpt: string
  appliesTo: string | null
  legalStatus: string
  outdated: boolean
}

export type TrainingQuestion = {
  id: string
  question: string
  /** GabayMo's suggested answer, written from the passage only. A guide, not the partner's answer. */
  draft: string
  /** The sentence of the passage the draft relies on. */
  quote: string | null
  /** False when that sentence could not be found word for word in the passage: check the draft. */
  quoteVerified: boolean
  source: TrainingSource
}

export type EmbeddingState = {
  /** pending: being added · embedded: guides member answers · failed: will retry */
  status: 'pending' | 'embedded' | 'failed'
  embeddedAt: string | null
  error: string | null
  /** How many member answers this guided. */
  useCount: number
}

export type SavedAnswer = {
  id: string
  questionId: string | null
  question: string
  draft: string | null
  answer: string
  source: TrainingSource
  savedAt: string
  updatedAt: string | null
  embedding: EmbeddingState
}

export type VoiceProfile = {
  text: string
  updatedAt: string | null
  source: 'answers' | 'edited' | null
  answersCount: number
  minAnswers: number
}

type RawSource = {
  document_id: string | null
  title: string
  reference: string
  page: number
  excerpt: string
  applies_to: string | null
  legal_status: string
  outdated: boolean
}
type RawQuestion = {
  id: string
  question: string
  draft: string
  quote: string | null
  quote_verified: boolean
  source: RawSource
}
type RawAnswer = {
  id: string
  prompt_id: string | null
  question: string
  draft: string | null
  answer: string
  source: RawSource
  saved_at: string
  updated_at: string | null
  embedding?: {
    status: EmbeddingState['status']
    embedded_at: string | null
    error: string | null
    use_count: number
  }
}
type RawVoice = {
  text: string
  source: 'answers' | 'edited' | null
  updated_at: string | null
  answers_count: number
  min_answers: number
}

function source(raw: RawSource): TrainingSource {
  return {
    documentId: raw.document_id,
    title: raw.title,
    reference: raw.reference,
    page: raw.page,
    excerpt: raw.excerpt,
    appliesTo: raw.applies_to,
    legalStatus: raw.legal_status,
    outdated: raw.outdated,
  }
}

function answer(raw: RawAnswer): SavedAnswer {
  return {
    id: raw.id,
    questionId: raw.prompt_id,
    question: raw.question,
    draft: raw.draft,
    answer: raw.answer,
    source: source(raw.source),
    savedAt: raw.saved_at,
    updatedAt: raw.updated_at,
    embedding: {
      status: raw.embedding?.status ?? 'pending',
      embeddedAt: raw.embedding?.embedded_at ?? null,
      error: raw.embedding?.error ?? null,
      useCount: raw.embedding?.use_count ?? 0,
    },
  }
}

function voice(raw: RawVoice): VoiceProfile {
  return {
    text: raw.text,
    updatedAt: raw.updated_at,
    source: raw.source,
    answersCount: raw.answers_count,
    minAnswers: raw.min_answers,
  }
}

function key() {
  return { 'Idempotency-Key': crypto.randomUUID() }
}

/** Writes a new question from a random published passage. Any open question is replaced. */
export async function nextQuestion(): Promise<TrainingQuestion> {
  const { data } = await api.post<{ data: RawQuestion }>(
    `${BASE}/questions`,
    {},
    { headers: key() },
  )
  const q = data.data
  return {
    id: q.id,
    question: q.question,
    draft: q.draft,
    quote: q.quote,
    quoteVerified: q.quote_verified,
    source: source(q.source),
  }
}

export async function listAnswers(): Promise<Array<SavedAnswer>> {
  const { data } = await api.get<{ data: Array<RawAnswer> }>(
    `${BASE}/answers`,
    { params: { per_page: 100 } },
  )
  return data.data.map(answer)
}

export async function saveAnswer(
  question: TrainingQuestion,
  questionText: string,
  answerText: string,
): Promise<SavedAnswer> {
  // gabaymo-ai keeps one answer per question, so a double click or a retry saves once.
  const { data } = await api.post<{ data: RawAnswer }>(
    `${BASE}/answers`,
    {
      prompt_id: question.id,
      question: questionText.trim(),
      answer: answerText.trim(),
    },
    { headers: key() },
  )
  return answer(data.data)
}

/** Saves the new wording. GabayMo removes the old preferred answer and embeds this one. */
export async function updateAnswer(
  id: string,
  text: string,
): Promise<SavedAnswer> {
  const { data } = await api.patch<{ data: RawAnswer }>(
    `${BASE}/answers/${id}`,
    { answer: text.trim() },
    { headers: key() },
  )
  return answer(data.data)
}

export async function deleteAnswer(id: string): Promise<void> {
  await api.delete(`${BASE}/answers/${id}`, { headers: key() })
}

export async function readVoice(): Promise<VoiceProfile> {
  const { data } = await api.get<{ data: RawVoice }>(`${BASE}/voice`)
  return voice(data.data)
}

export async function saveVoice(text: string): Promise<VoiceProfile> {
  const { data } = await api.patch<{ data: RawVoice }>(
    `${BASE}/voice`,
    { text: text.trim() },
    { headers: key() },
  )
  return voice(data.data)
}

/** GabayMo describes the partner's style from their newest saved answers. */
export async function rebuildVoice(): Promise<VoiceProfile> {
  const { data } = await api.post<{ data: RawVoice }>(
    `${BASE}/voice/rebuild`,
    {},
    { headers: key() },
  )
  return voice(data.data)
}

export function trainingError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      { message?: string; errors?: Record<string, Array<string>> } | undefined
    if (error.response?.status === 503)
      return 'GabayMo’s AI service is not reachable right now. Try again in a minute.'
    if (error.response?.status === 429)
      return 'Too many requests. Wait a moment, then try again.'
    const first = body?.errors
      ? Object.values(body.errors).flat()[0]
      : undefined
    return first || body?.message || fallback
  }
  return fallback
}
