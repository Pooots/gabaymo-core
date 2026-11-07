import { api } from '@/lib/api'

export type AppNotification = {
  id: number
  type: 'ticket.created' | 'ticket.accepted' | 'ticket.message' | string
  title: string
  body: string | null
  data: { ticket_id?: number; subject?: string }
  read: boolean
  created_at: string | null
}

export type NotificationFeed = {
  channel: string
  unread_count: number
  notifications: Array<AppNotification>
}

/** Fired on window when a realtime notification arrives, so open lists can refresh. */
export const NOTIFICATION_EVENT = 'gabaymo:notification'

export async function fetchNotifications() {
  const { data } = await api.get<NotificationFeed>('/v1/notifications')
  return data
}

export async function markNotificationRead(id: number) {
  await api.post(`/v1/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await api.post('/v1/notifications/read-all')
}

/**
 * The ticket chat currently on screen. A new message for this ticket does
 * not pop a toast: the open chat already shows it.
 */
let viewingTicketId: number | null = null

export function setViewingTicket(id: number | null) {
  viewingTicketId = id
}

export function isViewingTicket(id: number | undefined) {
  return id !== undefined && id === viewingTicketId
}

/** Re-run `refresh` whenever a realtime notification arrives. */
export function onNotification(
  refresh: (notification: AppNotification) => void,
) {
  function handler(event: Event) {
    refresh((event as CustomEvent<AppNotification>).detail)
  }
  window.addEventListener(NOTIFICATION_EVENT, handler)
  return () => window.removeEventListener(NOTIFICATION_EVENT, handler)
}
