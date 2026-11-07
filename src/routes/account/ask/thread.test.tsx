import { screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Thread } from './Thread'
import type * as AiModule from '@/services/ai'
import type { QuestionState } from '@/services/ai'
import { clearOfflineConversations, saveOfflineConversation } from '@/lib/offlineAnswers'
import { messagesPollInterval } from '@/queries/member'
import { fetchMessages } from '@/services/ai'
import { renderWithQuery } from '@/test/utils'

vi.mock('@/services/ai', async (importOriginal) => ({
  ...(await importOriginal<typeof AiModule>()),
  fetchMessages: vi.fn(),
}))

function question(answer_state: QuestionState['answer_state'], stage?: 'searching' | 'sending'): QuestionState {
  return {
    id: 'q1',
    conversation_id: 'c1',
    text: 'Q',
    status: 'x',
    answer_state,
    progress: stage ? { stage } : null,
    answer_message_id: null,
    created_at: null,
  }
}

describe('messagesPollInterval', () => {
  it('polls fast while drafting, slowly in review, not at all when done', () => {
    expect(messagesPollInterval([question('drafting')])).toBe(700)
    expect(messagesPollInterval([question('in_review')])).toBe(4000)
    expect(messagesPollInterval([question('in_review', 'sending')])).toBe(700)
    expect(messagesPollInterval([question('sent')])).toBe(false)
    expect(messagesPollInterval(undefined)).toBe(false)
  })
})

describe('Thread offline copy', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => clearOfflineConversations())

  it('shows the saved copy with a banner when loading fails offline', async () => {
    saveOfflineConversation({
      id: 'c1',
      title: 'Leave days',
      messages: [{ id: 1, role: 'user', content: 'How many leave days do I get?', question_id: null, citations: null, created_at: '2026-01-01T00:00:00Z' }],
      questions: [],
    })
    // A network failure: an axios error without a response.
    vi.mocked(fetchMessages).mockRejectedValue(Object.assign(new Error('Network Error'), { isAxiosError: true, toJSON: () => ({}) }))

    renderWithQuery(
      <Thread conversationId="c1" title="Leave days" pendingQuestion={null} error="" asking={false} draft="" setDraft={vi.fn()} onSubmit={vi.fn()} />,
    )

    expect(await screen.findByText('Saved copy — you’re offline')).toBeInTheDocument()
    expect(screen.getByText('How many leave days do I get?')).toBeInTheDocument()
  })
})
