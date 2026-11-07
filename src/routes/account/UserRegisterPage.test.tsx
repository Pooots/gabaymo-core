import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserRegisterPage } from './UserRegisterPage'
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions'
import { api } from '@/lib/api'
import { renderWithQuery } from '@/test/utils'

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

const post = vi.mocked(api.post)
const region = PHILIPPINE_REGIONS[0] as string

async function fillForm() {
  await userEvent.type(screen.getByLabelText('First name'), 'Ana')
  await userEvent.type(screen.getByLabelText('Last name'), 'Cruz')
  await userEvent.type(screen.getByLabelText('Mobile number'), '09171234567')
  await userEvent.selectOptions(screen.getByLabelText('Region'), region)
  await userEvent.type(screen.getByLabelText('Email address'), 'ana@school.ph')
  await userEvent.type(screen.getByLabelText('Password', { selector: 'input' }), 'longenough1')
  await userEvent.type(screen.getByLabelText('Confirm password'), 'longenough1')
}

/** Submit without the browser's own `required` check (jsdom may or may not run it). */
function submit() {
  const form = screen.getByRole('button', { name: 'Create account' }).closest('form') as HTMLFormElement
  form.noValidate = true
  form.requestSubmit()
}

describe('register: terms and referral code', () => {
  beforeEach(() => {
    post.mockReset()
    navigate.mockReset()
    search.current = {}
  })

  it('requires accepting the Terms and Privacy Policy', async () => {
    renderWithQuery(<UserRegisterPage />)
    await fillForm()
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Please accept the Terms of Service and Privacy Policy.')
    expect(post).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('sends accept_terms and the referral code prefilled from ?ref=', async () => {
    search.current = { ref: 'teach-2026' }
    post.mockResolvedValueOnce({ data: { portal: 'customer', user: { name: 'Ana Cruz', email: 'ana@school.ph', plan: 'Free Trial', usage: null } } })
    renderWithQuery(<UserRegisterPage />)
    expect(screen.getByLabelText(/Referral code/)).toHaveValue('TEACH-2026')
    await fillForm()
    await userEvent.click(screen.getByRole('checkbox'))
    submit()
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post).toHaveBeenCalledWith(
      '/v1/register',
      expect.objectContaining({ accept_terms: true, referral_code: 'TEACH-2026', email: 'ana@school.ph', region }),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/account' }))
  })

  it('leaves out an empty referral code', async () => {
    post.mockResolvedValueOnce({ data: { portal: 'customer', user: { name: 'Ana Cruz', email: 'ana@school.ph', plan: 'Free Trial', usage: null } } })
    renderWithQuery(<UserRegisterPage />)
    await fillForm()
    await userEvent.click(screen.getByRole('checkbox'))
    submit()
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty('referral_code')
  })
})
