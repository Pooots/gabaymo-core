import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SetupAccountPage } from './SetupAccountPage'
import type { Invitation } from '@/services/account'
import { api } from '@/lib/api'
import { readAdminUser } from '@/services/adminAuth'
import { readMember } from '@/services/memberAuth'
import { axiosError, renderWithQuery } from '@/test/utils'

const navigate = vi.fn()
const search = vi.hoisted(() => ({ current: {} }))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useSearch: () => search.current,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  adminApi: { post: vi.fn(), get: vi.fn() },
  ensureCsrfCookie: vi.fn(() => Promise.resolve()),
}))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)

const partnerInvite: Invitation = {
  email: 'atty@school.ph',
  name: 'Jose Rizal',
  account_type: 'partner',
  purpose: 'setup',
  role: null,
  invited_by: 'Ana Admin',
  expires_at: '2026-11-10T08:00:00+08:00',
  fields_required: ['name', 'password', 'practice_areas'],
  fields_optional: ['phone', 'title', 'bio'],
  practice_area_options: ['leave', 'discipline', 'other'],
  prefill: { phone: null, title: null, bio: null, practice_areas: [] },
}

async function fillPasswords(value: string) {
  await userEvent.type(screen.getByLabelText('Password'), value)
  await userEvent.type(screen.getByLabelText('Confirm password'), value)
}

describe('/setup-account', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    navigate.mockReset()
    search.current = { token: 'inv-token', email: 'atty@school.ph' }
  })

  it('a valid partner invitation needs practice areas, then signs in to the partner portal', async () => {
    get.mockResolvedValueOnce({ data: partnerInvite })
    post.mockResolvedValueOnce({
      data: { signed_in: true, account_type: 'partner', portal: 'partner', user: { name: 'Jose Rizal', email: 'atty@school.ph', plan: 'Free Trial', usage: null } },
    })
    renderWithQuery(<SetupAccountPage />)

    expect(await screen.findByText(/invited as a partner lawyer by Ana Admin/)).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/v1/invitations/inv-token', expect.objectContaining({ params: { email: 'atty@school.ph' } }))
    expect(screen.getByLabelText('Full name')).toHaveValue('Jose Rizal')
    expect(screen.getByLabelText('Email')).toHaveValue('atty@school.ph')

    await fillPasswords('partnerpass1')
    await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose at least one topic.')
    expect(post).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Leave' }))
    await userEvent.type(screen.getByLabelText(/Title/), 'Atty.')
    await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/v1/invitations/accept',
        {
          token: 'inv-token',
          email: 'atty@school.ph',
          password: 'partnerpass1',
          password_confirmation: 'partnerpass1',
          name: 'Jose Rizal',
          practice_areas: ['leave'],
          title: 'Atty.',
        },
        expect.anything(),
      ),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/partner' }))
    expect(readMember()?.portal).toBe('partner')
  })

  it('shows the invalid-link screen for 410 invitation_invalid', async () => {
    get.mockRejectedValueOnce(axiosError(410, { message: 'gone', error: 'invitation_invalid' }))
    renderWithQuery(<SetupAccountPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('This link no longer works')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('says the link is incomplete without token or email (no API call)', () => {
    search.current = { token: 'inv-token' }
    renderWithQuery(<SetupAccountPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('This link is incomplete')
    expect(get).not.toHaveBeenCalled()
  })

  it('a staff reset link only asks for a password; signed_in false goes to the admin sign-in', async () => {
    get.mockResolvedValueOnce({
      data: {
        ...partnerInvite,
        account_type: 'admin',
        purpose: 'reset',
        role: { slug: 'support', name: 'Support desk' },
        fields_required: ['password'],
        fields_optional: [],
        practice_area_options: null,
        prefill: null,
      },
    })
    post.mockResolvedValueOnce({ data: { signed_in: false, account_type: 'admin' } })
    renderWithQuery(<SetupAccountPage />)
    expect(await screen.findByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await fillPasswords('short')
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Use at least 10 characters.')

    await userEvent.clear(screen.getByLabelText('Password'))
    await userEvent.clear(screen.getByLabelText('Confirm password'))
    await fillPasswords('staffpassword')
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/v1/invitations/accept',
        { token: 'inv-token', email: 'atty@school.ph', password: 'staffpassword', password_confirmation: 'staffpassword' },
        expect.anything(),
      ),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/admin/login', search: { notice: 'password_reset' } }))
  })

  it('a signed-in staff setup lands in the admin console', async () => {
    get.mockResolvedValueOnce({
      data: { ...partnerInvite, account_type: 'admin', fields_required: ['name', 'password'], fields_optional: [], practice_area_options: null, prefill: null },
    })
    post.mockResolvedValueOnce({ data: { signed_in: true, account_type: 'admin', user: { name: 'Jose', email: 'atty@school.ph', role: 'support' } } })
    renderWithQuery(<SetupAccountPage />)
    await screen.findByLabelText('Full name')
    await fillPasswords('staffpassword')
    await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/admin' }))
    expect(readAdminUser()?.email).toBe('atty@school.ph')
  })
})
