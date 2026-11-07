import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminLoginPage } from './AdminLoginPage'
import { adminApi } from '@/lib/api'
import { axiosError, renderWithQuery } from '@/test/utils'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useSearch: () => ({}),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('@/lib/api', () => ({
  adminApi: { post: vi.fn(), get: vi.fn() },
  api: { post: vi.fn(), get: vi.fn() },
}))

const post = vi.mocked(adminApi.post)
const user = { name: 'Ana', email: 'ana@gabaymo.com', role: 'admin', permissions: ['overview'] }

async function signIn() {
  await userEvent.type(screen.getByLabelText('Email'), 'ana@gabaymo.com')
  await userEvent.type(screen.getByLabelText('Password', { selector: 'input' }), 'correct horse')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('admin sign-in with two-factor', () => {
  beforeEach(() => {
    post.mockReset()
    navigate.mockReset()
  })

  it('asks for the authenticator code after the password, then signs in', async () => {
    post.mockResolvedValueOnce({ data: { two_factor_required: true } }).mockResolvedValueOnce({ data: { user } })
    renderWithQuery(<AdminLoginPage />)
    await signIn()

    const code = await screen.findByLabelText('Authentication code')
    expect(navigate).not.toHaveBeenCalled()
    await userEvent.type(code, '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/admin' }))
    expect(post).toHaveBeenNthCalledWith(1, '/v1/admin/login', { email: 'ana@gabaymo.com', password: 'correct horse' })
    expect(post).toHaveBeenNthCalledWith(2, '/v1/admin/login/two-factor', { code: '123456' })
  })

  it('rejects a short code without calling the API', async () => {
    post.mockResolvedValueOnce({ data: { two_factor_required: true } })
    renderWithQuery(<AdminLoginPage />)
    await signIn()
    await userEvent.type(await screen.findByLabelText('Authentication code'), '12')
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter the 6-digit code.')
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('accepts a recovery code instead', async () => {
    post.mockResolvedValueOnce({ data: { two_factor_required: true } }).mockResolvedValueOnce({ data: { user } })
    renderWithQuery(<AdminLoginPage />)
    await signIn()
    await userEvent.click(await screen.findByRole('button', { name: 'Use a recovery code' }))
    await userEvent.type(screen.getByLabelText('Recovery code'), 'abcde-fghij')
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/admin' }))
    expect(post).toHaveBeenLastCalledWith('/v1/admin/login/two-factor', { code: 'abcde-fghij' })
  })

  it('shows a wrong code and stays on the code step', async () => {
    post
      .mockResolvedValueOnce({ data: { two_factor_required: true } })
      .mockRejectedValueOnce(axiosError(422, { message: 'That code is not valid.', errors: { code: ['That code is not valid.'] } }))
    renderWithQuery(<AdminLoginPage />)
    await signIn()
    await userEvent.type(await screen.findByLabelText('Authentication code'), '000000')
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not valid. Try again.')
    expect(screen.getByLabelText('Authentication code')).toBeInTheDocument()
  })

  it('explains a locked account (429 account_locked)', async () => {
    post.mockRejectedValueOnce(axiosError(429, { error: 'account_locked', message: 'Too many failed sign-in attempts.' }))
    renderWithQuery(<AdminLoginPage />)
    await signIn()
    expect(await screen.findByRole('alert')).toHaveTextContent('This account is locked')
  })

  it('signs in directly when two-factor is off', async () => {
    post.mockResolvedValueOnce({ data: { user } })
    renderWithQuery(<AdminLoginPage />)
    await signIn()
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/admin' }))
    expect(screen.queryByLabelText('Authentication code')).not.toBeInTheDocument()
  })
})
