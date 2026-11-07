import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import type { TokenUsage } from '@/services/usage'
import { useI18n } from '@/i18n'
import { setMemberUsage, useAskQuestion } from '@/queries/member'
import { aiError } from '@/services/ai'

/**
 * The ask flow: draft, the open conversation, the question in flight and its
 * error. Retrying the same text reuses its idempotency key, so a double
 * submit or a retry after a network error is never charged twice.
 */
export function useAsk() {
  const { t } = useI18n()
  const client = useQueryClient()
  const mutation = useAskQuestion()
  const [draft, setDraft] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [askError, setAskError] = useState('')
  const idempotency = useRef<{ text: string; key: string } | null>(null)
  const asking = mutation.isPending

  async function ask(question: string) {
    const text = question.trim()
    if (!text || asking) return false
    if (idempotency.current?.text !== text) idempotency.current = { text, key: crypto.randomUUID() }
    setAskError('')
    setPendingQuestion(text)
    try {
      const result = await mutation.mutateAsync({ message: text, conversationId: active, idempotencyKey: idempotency.current.key })
      idempotency.current = null
      setDraft('')
      setActive(result.data.conversation_id)
    } catch (caught) {
      if (axios.isAxiosError(caught) && caught.response?.status === 402) {
        const body = caught.response.data as { message?: string; usage?: TokenUsage }
        if (body.usage) setMemberUsage(client, body.usage)
        setAskError(body.message ?? t('ask.limitReached'))
      } else if (
        axios.isAxiosError(caught) &&
        caught.response?.status === 503 &&
        (caught.response.data as { message?: string } | undefined)?.message === 'ai_budget_exceeded'
      ) {
        // gabaymo-ai's spend cap: ws already released the usage hold.
        setAskError(t('conversations.budgetExceeded'))
      } else {
        setAskError(aiError(caught, t('ask.askFailed')))
      }
    } finally {
      setPendingQuestion(null)
    }
    return true
  }

  return { draft, setDraft, active, setActive, pendingQuestion, askError, setAskError, asking, ask }
}
