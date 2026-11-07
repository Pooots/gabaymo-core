import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PaymentsPage } from './PaymentsPage'
import { adminApi } from '@/lib/api'
import { renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  adminApi: { get: vi.fn(), post: vi.fn() },
  api: { get: vi.fn(), post: vi.fn() },
}))

const summary = {
  revenue_month: 12500,
  revenue_total: 348900,
  paid_count: 1204,
  pending_count: 7,
  failed_count: 31,
  refunded_count: 4,
}

const payment = {
  id: 1,
  reference: 'GM-ABC123',
  receipt_number: 'OR-2026-0001',
  plan: 'Teacher Monthly',
  amount: 299,
  currency: 'PHP',
  status: 'paid',
  paid_at: '2026-11-02T08:00:00+08:00',
  refunded_at: null,
  refunded_amount: 0,
  period_end: null,
  created_at: '2026-11-02T08:00:00+08:00',
  member: { id: 5, name: 'Maria Santos', email: 'maria@deped.gov.ph' },
  failure_reason: null,
  disputed_at: null,
}

describe('admin payments', () => {
  it('renders the summary cards in pesos and counts, plus the list', async () => {
    vi.mocked(adminApi.get).mockImplementation((url: string) =>
      Promise.resolve(
        url === '/v1/admin/payments/summary'
          ? { data: summary }
          : { data: { data: [payment], meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 } } },
      ),
    )
    renderWithQuery(<PaymentsPage />)

    const card = (label: string) => screen.getByText(label, { selector: 'dt' }).closest('div')
    expect(await screen.findByText('₱12,500')).toBeInTheDocument()
    expect(card('Revenue this month')).toHaveTextContent('₱12,500')
    expect(card('Revenue, all time')).toHaveTextContent('₱348,900')
    expect(card('Pending')).toHaveTextContent('7')
    expect(card('Failed')).toHaveTextContent('31')
    expect(card('Refunded')).toHaveTextContent('4')
    expect(screen.getAllByText('1,204')[0]).toBeInTheDocument()

    expect(await screen.findByText('GM-ABC123')).toBeInTheDocument()
    expect(screen.getByText('Receipt OR-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('₱299')).toBeInTheDocument()
    expect(adminApi.get).toHaveBeenCalledWith('/v1/admin/payments', { params: { page: 1 } })
  })
})
