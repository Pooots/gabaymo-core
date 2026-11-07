import type { notifications as en } from '../en/notifications'

export const notifications: Record<keyof typeof en, string> = {
  bell: 'Mga notification',
  bellUnread: 'Mga notification, {count} hindi pa nababasa',
  title: 'Mga notification',
  markAll: 'Markahang nabasa lahat',
  empty: 'Wala pang notification.',
  unread: 'Hindi pa nababasa',
  dismiss: 'Isara',
  justNow: 'Ngayon lang',
  minutesAgo: '{count} min ang nakalipas',
  hoursAgo: '{count} oras ang nakalipas',
}
