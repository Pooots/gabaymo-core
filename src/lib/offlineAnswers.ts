import type { ChatMessage, QuestionState } from '@/services/ai'
import { safeStorage } from '@/lib/storage'

/**
 * Small, explicit offline copy of the member's last-opened answers.
 * The service worker never caches API responses; instead, when a member opens
 * a conversation we keep its messages here (newest few only, per browser) so
 * they can still be read without a connection. Cleared on sign-out.
 */
const KEY = 'gabaymo_offline_answers'
const LIMIT = 5

export type OfflineConversation = {
  id: string
  title: string | null
  savedAt: string
  messages: Array<ChatMessage>
  questions: Array<QuestionState>
}

export function readOfflineConversations(): Array<OfflineConversation> {
  const list = safeStorage.getJson<Array<OfflineConversation>>(KEY)
  return Array.isArray(list) ? list : []
}

export function readOfflineConversation(id: string): OfflineConversation | null {
  return readOfflineConversations().find((c) => c.id === id) ?? null
}

export function saveOfflineConversation(entry: Omit<OfflineConversation, 'savedAt'>) {
  const rest = readOfflineConversations().filter((c) => c.id !== entry.id)
  const next = [{ ...entry, savedAt: new Date().toISOString() }, ...rest].slice(0, LIMIT)
  safeStorage.setJson(KEY, next)
}

export function clearOfflineConversations() {
  safeStorage.remove(KEY)
}
