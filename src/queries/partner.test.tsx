import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { partnerKeys, usePartnerRealtime } from './partner'
import { NOTIFICATION_EVENT } from '@/services/notifications'
import { renderWithQuery } from '@/test/utils'

function Realtime() {
  usePartnerRealtime()
  return null
}

function notify(type: string, ticketId?: number) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: { id: 1, type, title: '', body: null, data: ticketId === undefined ? {} : { ticket_id: ticketId }, read: false, created_at: null },
    }),
  )
}

describe('partner realtime', () => {
  it('a new ticket invalidates the inbox and dashboard, not the accepted list', () => {
    const { client } = renderWithQuery(<Realtime />)
    const spy = vi.spyOn(client, 'invalidateQueries')
    act(() => notify('ticket.created'))
    const keys = spy.mock.calls.map(([filters]) => filters?.queryKey)
    expect(keys).toContainEqual(partnerKeys.tickets())
    expect(keys).toContainEqual(partnerKeys.dashboard())
    expect(keys).not.toContainEqual(partnerKeys.accepted())
  })

  it('a message refreshes that ticket thread only', () => {
    const { client } = renderWithQuery(<Realtime />)
    const spy = vi.spyOn(client, 'invalidateQueries')
    act(() => notify('ticket.message', 42))
    expect(spy.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([partnerKeys.thread(42)])
  })
})
