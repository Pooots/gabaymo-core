import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ForgotPasswordPage, ResetPasswordPage } from './PasswordResetPages'
import { api } from '@/lib/api'
import { axiosError, renderWithQuery } from '@/test/utils'

const search = vi.hoisted(() => ({ current: {} }))

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => search.current,
  useNavigate: () => vi.fn(),
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  adminApi: { post: vi.fn(), get: vi.fn() },
  ensureCsrfCookie: vi.fn(() => Promise.resolve()),
}))

const post = vi.mocked(api.post)

describe('forgot password', () => {
  beforeEach(() => post.mockReset())

  it('sends the email and shows the same answer whether or not it exists', async () => {
    post.mockResolvedValueOnce({ status: 202, data: {} })
    renderWithQuery(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Email'), ' ana@school.ph ')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists for ana@school.ph')
    expect(post).toHaveBeenCalledWith('/v1/password/forgot', { email: 'ana@school.ph' })
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument()
  })

  it('explains throttling', async () => {
    post.mockRejectedValueOnce(axiosError(429, { message: 'Too Many Attempts.' }))
    renderWithQuery(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'ana@school.ph')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
  })
})

describe('reset password', () => {
  beforeEach(() => {
    post.mockReset()
    search.current = { token: 'tok-123', email: 'ana@school.ph' }
  })

  it('checks the passwords before calling the API', async () => {
    renderWithQuery(<ResetPasswordPage />)
    await userEvent.type(screen.getByLabelText('New password'), 'longenough1')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'different12')
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The passwords do not match.')
    expect(post).not.toHaveBeenCalled()
  })

  it('posts token, email and the new password, then offers sign-in', async () => {
    post.mockResolvedValueOnce({ data: { ok: true } })
    renderWithQuery(<ResetPasswordPage />)
    expect(screen.getByText(/ana@school\.ph/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('New password'), 'longenough1')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'longenough1')
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/v1/password/reset', {
        token: 'tok-123',
        email: 'ana@school.ph',
        password: 'longenough1',
        password_confirmation: 'longenough1',
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Your password was reset')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('shows the API error for an expired link', async () => {
    post.mockRejectedValueOnce(
      axiosError(422, { message: 'x', errors: { token: ['This password reset link is invalid or has expired.'] } }),
    )
    renderWithQuery(<ResetPasswordPage />)
    await userEvent.type(screen.getByLabelText('New password'), 'longenough1')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'longenough1')
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired')
  })

  it('says the link is incomplete without a token', () => {
    search.current = { email: 'ana@school.ph' }
    renderWithQuery(<ResetPasswordPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('This reset link is incomplete')
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
  })
})
