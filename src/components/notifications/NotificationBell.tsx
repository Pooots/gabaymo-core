import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, MessageSquareText, Ticket, UserRoundCheck, X } from 'lucide-react'

import type { AppNotification } from '@/services/notifications'
import { ErrorState, Skeleton } from '@/components/ui'
import { useDismiss, useMenuKeyboard } from '@/hooks/useDismiss'
import { useI18n } from '@/i18n'
import { getEcho } from '@/lib/echo'
import { addNotificationToFeed, memberKeys, useNotificationActions, useNotifications } from '@/queries/member'
import { NOTIFICATION_EVENT, isViewingTicket, markNotificationRead } from '@/services/notifications'

const TOAST_MS = 6000
const MAX_TOASTS = 3

/**
 * Header bell with unread badge + dropdown, and realtime popups at the upper
 * right. New notifications arrive over Reverb on the user's private channel.
 * Works for members and partners; `onOpen` decides where a click goes.
 */
export function NotificationBell({ onOpen }: { onOpen: (notification: AppNotification) => void }) {
  const { t, intl } = useI18n()
  const client = useQueryClient()
  const feed = useNotifications()
  const { markRead, markAllRead } = useNotificationActions()
  const [open, setOpen] = useState(false)
  const [toasts, setToasts] = useState<Array<AppNotification>>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const onOpenRef = useRef(onOpen)
  useEffect(() => {
    onOpenRef.current = onOpen
  })

  useDismiss(panelRef, open, () => setOpen(false), triggerRef)
  useMenuKeyboard(listRef, open)

  const items = feed.data?.notifications ?? []
  const unread = feed.data?.unread_count ?? 0
  const channel = feed.data?.channel ?? null

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  // Subscribe to the private channel the API names.
  useEffect(() => {
    const echo = getEcho()
    if (!channel || !echo) return
    echo.private(channel).listen('.notification.created', (payload: { notification: AppNotification }) => {
      const notification = payload.notification
      window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: notification }))

      // Chat already on screen: count it as read, no popup.
      if (notification.type === 'ticket.message' && isViewingTicket(notification.data.ticket_id)) {
        addNotificationToFeed(client, { ...notification, read: true }, false)
        void markNotificationRead(notification.id).finally(() => client.invalidateQueries({ queryKey: memberKeys.notifications() }))
        return
      }

      addNotificationToFeed(client, notification, true)
      void client.invalidateQueries({ queryKey: memberKeys.notifications() })
      setToasts((current) => [notification, ...current].slice(0, MAX_TOASTS))
      window.setTimeout(() => dismissToast(notification.id), TOAST_MS)
    })
    return () => getEcho()?.leave(channel)
  }, [channel, client, dismissToast])

  function select(notification: AppNotification) {
    if (!notification.read) markRead.mutate(notification.id)
    dismissToast(notification.id)
    setOpen(false)
    onOpenRef.current(notification)
  }

  function readAll() {
    if (unread === 0) return
    markAllRead.mutate()
  }

  return (
    <>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-label={unread > 0 ? t('notifications.bellUnread', { count: unread }) : t('notifications.bell')}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => {
            // The list shows the same items, so popups would only cover it.
            setToasts([])
            setOpen((value) => !value)
          }}
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-surface/80 bg-surface/80 text-moss-833 shadow-sm backdrop-blur hover:bg-surface"
        >
          <Bell size={16} aria-hidden />
          {unread > 0 ? (
            <span aria-hidden className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rust-601 px-1 text-[10px] leading-none font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </button>

        {open ? (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={t('notifications.title')}
            className="fixed top-14 right-2 left-2 z-50 overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_18px_50px_rgba(20,32,25,0.16)] sm:absolute sm:top-11 sm:right-0 sm:left-auto sm:w-[360px]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-ash-59 px-4 py-3">
              <p className="text-sm font-semibold text-moss-898">{t('notifications.title')}</p>
              <button
                type="button"
                onClick={readAll}
                disabled={unread === 0}
                className="flex items-center gap-1 text-xs font-medium text-brand disabled:text-moss-341"
              >
                <CheckCheck size={14} aria-hidden />
                {t('notifications.markAll')}
              </button>
            </div>
            {feed.isPending ? (
              <div role="status" aria-busy="true" className="space-y-3 px-4 py-4">
                <span className="sr-only">{t('common.loading')}</span>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : feed.isError ? (
              <ErrorState compact className="m-3" error={feed.error} retrying={feed.isRefetching} onRetry={() => void feed.refetch()} />
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ash-573">{t('notifications.empty')}</p>
            ) : (
              <ul ref={listRef} role="menu" aria-label={t('notifications.title')} className="max-h-[min(420px,70dvh)] overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} role="none" className="border-b border-ash-41 last:border-0">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => select(item)}
                      className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-ash-27 focus-visible:bg-ash-27 focus-visible:outline-none ${item.read ? '' : 'bg-moss-41'}`}
                    >
                      <NotificationIcon type={item.type} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={`text-sm leading-snug break-words text-moss-898 ${item.read ? '' : 'font-semibold'}`}>{item.title}</span>
                          {item.read ? null : (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand">
                              <span className="sr-only">{t('notifications.unread')}</span>
                            </span>
                          )}
                        </span>
                        {item.body ? <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{item.body}</span> : null}
                        <span className="mt-1 block text-[11px] text-moss-433">{ago(item.created_at, t, intl)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {/* Realtime popups, upper right below the header. */}
      <div aria-live="polite" className="pointer-events-none fixed top-16 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="notification-toast pointer-events-auto flex gap-3 rounded-3xl border border-line bg-surface p-4 shadow-[0_18px_50px_rgba(20,32,25,0.18)]"
          >
            <button type="button" onClick={() => select(toast)} className="flex min-w-0 flex-1 gap-3 text-left">
              <NotificationIcon type={toast.type} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug font-semibold break-words text-moss-898">{toast.title}</span>
                {toast.body ? <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{toast.body}</span> : null}
              </span>
            </button>
            <button
              type="button"
              aria-label={t('notifications.dismiss')}
              onClick={() => dismissToast(toast.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-moss-433 hover:bg-ash-41"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

function NotificationIcon({ type }: { type: string }) {
  const Icon = type === 'ticket.accepted' ? UserRoundCheck : type === 'ticket.message' ? MessageSquareText : Ticket
  return (
    <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss-71 text-brand">
      <Icon size={16} />
    </span>
  )
}

function ago(value: string | null, t: ReturnType<typeof useI18n>['t'], intl: string) {
  if (!value) return ''
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return t('notifications.justNow')
  if (seconds < 3600) return t('notifications.minutesAgo', { count: Math.floor(seconds / 60) })
  if (seconds < 86400) return t('notifications.hoursAgo', { count: Math.floor(seconds / 3600) })
  return new Date(value).toLocaleString(intl, { dateStyle: 'medium', timeStyle: 'short' })
}
