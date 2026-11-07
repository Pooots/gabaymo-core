import { QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnswerActions } from './AnswerActions'
import type { ChatMessage } from '@/services/ai'
import type { ThreadData } from '@/queries/member'
import { api } from '@/lib/api'
import { memberKeys } from '@/queries/member'
import { renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  adminApi: { post: vi.fn(), get: vi.fn() },
  ensureCsrfCookie: vi.fn(() => Promise.resolve()),
}))

const post = vi.mocked(api.post)

function answer(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 77,
    role: 'assistant',
    content: 'Teachers get 15 days of vacation service credits [1].\n\nSources:\n[1] DO 13',
    question_id: 'q-1',
    citations: [
      {
        marker: 'S1',
        title: 'Leave guidelines',
        document_number: 'DepEd Order No. 13, s. 2016',
        page: 12,
        section: null,
        quoted_text: null,
        authority_role: 'governing',
        legal_status: 'in_force',
        citation_verified: true,
      },
    ],
    created_at: '2026-11-01T08:00:00+08:00',
    my_feedback: null,
    ...overrides,
  }
}

/** Render with the thread cached, re-rendering from the cache like Thread does. */
function renderActions(message: ChatMessage) {
  const thread: ThreadData = { data: [message], meta: { questions: [] } }
  const view = renderWithQuery(<AnswerActions message={message} conversationId="c-1" question="How many leave days?" />)
  view.client.setQueryData(memberKeys.messages('c-1'), thread)
  const rerenderFromCache = () => {
    const cached = view.client.getQueryData<ThreadData>(memberKeys.messages('c-1'))
    const next = cached?.data[0] ?? message
    view.rerender(
      <QueryClientProvider client={view.client}>
        <AnswerActions message={next} conversationId="c-1" question="How many leave days?" />
      </QueryClientProvider>,
    )
  }
  return { ...view, rerenderFromCache }
}

describe('answer feedback', () => {
  beforeEach(() => post.mockReset())

  it('sends 👍 and marks it pressed', async () => {
    post.mockResolvedValueOnce({ data: { data: { rating: 'up', reason: null, updated_at: '2026-11-07T00:00:00Z' } } })
    const view = renderActions(answer())
    const up = screen.getByRole('button', { name: 'Helpful' })
    expect(up).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(up)
    await waitFor(() => expect(post).toHaveBeenCalledWith('/v1/ai/messages/77/feedback', { rating: 'up' }))
    view.rerenderFromCache()
    expect(screen.getByRole('button', { name: 'Helpful' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Thanks for the feedback.')).toBeInTheDocument()
  })

  it('👎 asks for an optional reason and sends it', async () => {
    post
      .mockResolvedValueOnce({ data: { data: { rating: 'down', reason: null } } })
      .mockResolvedValueOnce({ data: { data: { rating: 'down', reason: 'Outdated order' } } })
    const view = renderActions(answer())
    await userEvent.click(screen.getByRole('button', { name: 'Not helpful' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/v1/ai/messages/77/feedback', { rating: 'down' }))
    view.rerenderFromCache()
    const reason = await screen.findByLabelText('What could be better? (optional)')
    await userEvent.type(reason, 'Outdated order')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() =>
      expect(post).toHaveBeenLastCalledWith('/v1/ai/messages/77/feedback', { rating: 'down', reason: 'Outdated order' }),
    )
    view.rerenderFromCache()
    expect(await screen.findByText('Your note: Outdated order')).toBeInTheDocument()
  })

  it('shows the saved my_feedback (object or bare rating)', () => {
    const { unmount } = renderActions(answer({ my_feedback: { rating: 'down', reason: 'Wrong region', updated_at: null } }))
    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Your note: Wrong region')).toBeInTheDocument()
    unmount()
    renderActions(answer({ my_feedback: 'up' }))
    expect(screen.getByRole('button', { name: 'Helpful' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('copies the answer with its citations', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderActions(answer())
    await userEvent.click(screen.getByRole('button', { name: 'Copy with citations' }))
    expect(writeText).toHaveBeenCalledWith(
      'Teachers get 15 days of vacation service credits [1].\n\nSources:\n[1] DepEd Order No. 13, s. 2016 — Leave guidelines, page 12',
    )
    expect(await screen.findByText('Copied with citations')).toBeInTheDocument()
  })

  it('opens the print view for “Export as PDF”', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    renderActions(answer())
    await userEvent.click(screen.getByRole('button', { name: 'Export as PDF' }))
    await waitFor(() => expect(print).toHaveBeenCalled())
    const sheet = document.getElementById('gabaymo-print')
    expect(sheet).toHaveTextContent('How many leave days?')
    expect(sheet).toHaveTextContent('DepEd Order No. 13, s. 2016')
    expect(sheet).toHaveTextContent('not legal advice')
    expect(document.body).toHaveClass('print-answer')
    window.dispatchEvent(new Event('afterprint'))
    await waitFor(() => expect(document.getElementById('gabaymo-print')).toBeNull())
    print.mockRestore()
  })
})
