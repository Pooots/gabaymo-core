import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizationsPage } from './OrganizationsPage'
import { adminApi } from '@/lib/api'
import { renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  adminApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  api: { get: vi.fn(), post: vi.fn() },
}))

const organization = {
  id: 7,
  name: 'Rizal Elementary School',
  type: 'school',
  region: null,
  seats: 10,
  seats_used: 2,
  subscription_plan_id: 3,
  plan: 'School Annual',
  period_end: '2027-06-30T23:59:59+08:00',
  active: true,
  members: [
    { id: 1, name: 'Maria Santos', email: 'maria@deped.gov.ph' },
    { id: 2, name: 'Jose Cruz', email: 'jose@deped.gov.ph' },
  ],
  invites: [],
  created_at: '2026-11-01T08:00:00+08:00',
}

const page = (rows: Array<unknown>) => ({ data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 20, total: rows.length } } })

describe('admin organizations', () => {
  beforeEach(() => {
    vi.mocked(adminApi.get).mockReset()
    vi.mocked(adminApi.delete).mockReset()
  })

  it('deletes an organization after confirming', async () => {
    let deleted = false
    vi.mocked(adminApi.get).mockImplementation(() => Promise.resolve(page(deleted ? [] : [organization])))
    vi.mocked(adminApi.delete).mockImplementation(() => {
      deleted = true
      return Promise.resolve({ data: { ok: true, members_detached: 2 } })
    })
    renderWithQuery(<OrganizationsPage />)

    await userEvent.click(await screen.findByText('Rizal Elementary School'))
    await userEvent.click(screen.getByRole('button', { name: 'Delete organization' }))

    const dialog = screen.getByRole('alertdialog', { name: 'Delete Rizal Elementary School?' })
    expect(dialog).toHaveTextContent('Its 2 members go back to their own plan')
    expect(adminApi.delete).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete organization' }))

    expect(await screen.findByText('Rizal Elementary School was deleted.')).toBeInTheDocument()
    expect(adminApi.delete).toHaveBeenCalledWith('/v1/admin/organizations/7')
    expect(screen.queryByRole('dialog', { name: 'Rizal Elementary School' })).not.toBeInTheDocument()
  })

  it('does nothing when the confirmation is cancelled', async () => {
    vi.mocked(adminApi.get).mockResolvedValue(page([organization]))
    renderWithQuery(<OrganizationsPage />)

    await userEvent.click(await screen.findByText('Rizal Elementary School'))
    await userEvent.click(screen.getByRole('button', { name: 'Delete organization' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(adminApi.delete).not.toHaveBeenCalled()
  })
})
