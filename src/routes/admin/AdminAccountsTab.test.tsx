import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminAccountsTab } from './AdminAccountsTab'
import type { RoleAccount, StaffRole } from '@/services/roles'
import { adminApi } from '@/lib/api'
import { axiosError, renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  adminApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  api: { get: vi.fn(), post: vi.fn() },
}))

const role = (accounts: Array<RoleAccount>): StaffRole => ({
  id: 4,
  name: 'Support desk',
  slug: 'support-desk',
  description: null,
  is_system: false,
  permissions: ['tickets'],
  accounts,
})

const modules = [{ group: 'Support', key: 'tickets', label: 'Tickets' }]

describe('admin accounts tab: suspension', () => {
  beforeEach(() => {
    vi.mocked(adminApi.post).mockReset()
  })

  it('suspends an active account after confirming', async () => {
    vi.mocked(adminApi.post).mockResolvedValue({ data: { account: { id: 9, name: 'Ana Reyes', email: 'ana@gabaymo.ph', status: 'suspended' } } })
    renderWithQuery(
      <AdminAccountsTab roles={[role([{ id: 9, name: 'Ana Reyes', email: 'ana@gabaymo.ph', status: 'active' }])]} modules={modules} loading={false} onOpenRole={vi.fn()} />,
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Suspend: Ana Reyes' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Suspend Ana Reyes?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Suspend' }))

    expect(adminApi.post).toHaveBeenCalledWith('/v1/admin/roles/4/accounts/9/suspend')
    expect(await screen.findByText('Ana Reyes was suspended.')).toBeInTheDocument()
  })

  it('shows the suspended badge and lifts the suspension without a confirmation', async () => {
    vi.mocked(adminApi.post).mockResolvedValue({ data: { account: { id: 9, name: 'Ana Reyes', email: 'ana@gabaymo.ph', status: 'active' } } })
    renderWithQuery(
      <AdminAccountsTab
        roles={[role([{ id: 9, name: 'Ana Reyes', email: 'ana@gabaymo.ph', status: 'suspended', suspended_at: '2026-11-07T08:00:00+08:00' }])]}
        modules={modules}
        loading={false}
        onOpenRole={vi.fn()}
      />,
    )

    expect(screen.getByText('Suspended')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Lift suspension: Ana Reyes' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(adminApi.post).toHaveBeenCalledWith('/v1/admin/roles/4/accounts/9/unsuspend')
    expect(await screen.findByText('Lifted the suspension of Ana Reyes.')).toBeInTheDocument()
  })

  it('shows the server error (for example the last active administrator) and hides the button for invited accounts', async () => {
    vi.mocked(adminApi.post).mockRejectedValue(axiosError(422, { message: 'You cannot suspend the last active administrator.', error: 'last_super_admin' }))
    renderWithQuery(
      <AdminAccountsTab
        roles={[
          role([
            { id: 9, name: 'Ana Reyes', email: 'ana@gabaymo.ph', status: 'active' },
            { id: 10, name: 'New Hire', email: 'new@gabaymo.ph', status: 'invited' },
          ]),
        ]}
        modules={modules}
        loading={false}
        onOpenRole={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Suspend: New Hire' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Suspend: Ana Reyes' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Suspend' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('You cannot suspend the last active administrator.')
  })
})
