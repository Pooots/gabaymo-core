import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UploadDialog } from './UploadDialog'
import type * as AdminAuth from '@/services/adminAuth'
import { adminApi } from '@/lib/api'
import { readAdminUser } from '@/services/adminAuth'
import { renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  adminApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  api: { get: vi.fn(), post: vi.fn() },
}))
vi.mock('@/services/adminAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof AdminAuth>()),
  readAdminUser: vi.fn(),
}))

const regions = [{ code: 'VIII', name: 'Eastern Visayas' }] as never

function admin(canSelfApprove: boolean) {
  vi.mocked(readAdminUser).mockReturnValue({
    name: 'Admin',
    email: 'a@test.ph',
    role: 'administrator',
    can_self_approve: canSelfApprove,
  })
}

async function chooseFile() {
  const file = new File(['TEST FIXTURE'], 'DM-090-s2025.pdf', {
    type: 'application/pdf',
  })
  await userEvent.upload(screen.getByLabelText('Choose file'), file)
}

describe('UploadDialog approve on upload', () => {
  beforeEach(() => {
    vi.mocked(adminApi.post).mockReset()
    vi.mocked(adminApi.post).mockResolvedValue({
      data: { data: { id: 'doc-1', title: 'DM-090-s2025' } },
    })
  })

  it('is hidden for admins who cannot self-approve', () => {
    admin(false)
    renderWithQuery(
      <UploadDialog regions={regions} onClose={vi.fn()} onUploaded={vi.fn()} />,
    )
    expect(
      screen.queryByLabelText(/Approve automatically when ready/),
    ).not.toBeInTheDocument()
  })

  it('needs applicability and both confirmations, then sends the request and stays open for the next file', async () => {
    admin(true)
    const onUploaded = vi.fn()
    renderWithQuery(
      <UploadDialog
        regions={regions}
        onClose={vi.fn()}
        onUploaded={onUploaded}
      />,
    )
    await chooseFile()

    await userEvent.click(
      screen.getByLabelText(/Approve automatically when ready/),
    )
    const approve = screen.getByRole('button', { name: 'Upload & approve' })
    expect(approve).toBeDisabled()
    expect(
      screen.getByText(/Choose “National” or specific regions/),
    ).toBeInTheDocument()

    await userEvent.selectOptions(
      screen.getByLabelText(/Known applicability/),
      'national',
    )
    await userEvent.click(
      screen.getByLabelText(
        'I checked this file against the official issuance',
      ),
    )
    expect(approve).toBeDisabled()
    await userEvent.click(
      screen.getByLabelText('The applicability I chose above is correct'),
    )
    expect(approve).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Upload & next' }))

    const form = vi.mocked(adminApi.post).mock.calls[0]?.[1] as FormData
    expect(JSON.parse(String(form.get('auto_approve')))).toEqual({
      source_authenticity_checked: true,
      applicability_verified: true,
      reason: null,
    })
    expect(JSON.parse(String(form.get('metadata')))).toMatchObject({
      applicability_scope: 'national',
    })
    expect(onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'doc-1' }),
      { next: true, autoApproved: true },
    )
    // Ready for the next file; the approval choices are kept.
    expect(
      screen.getByText('Drop a PDF, DOCX, TXT or Markdown file'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Approve automatically when ready/),
    ).toBeChecked()
  })

  it('a plain upload sends no approval request', async () => {
    admin(true)
    renderWithQuery(
      <UploadDialog regions={regions} onClose={vi.fn()} onUploaded={vi.fn()} />,
    )
    await chooseFile()
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))

    const form = vi.mocked(adminApi.post).mock.calls[0]?.[1] as FormData
    expect(form.get('auto_approve')).toBeNull()
  })
})
