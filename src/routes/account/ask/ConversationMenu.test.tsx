import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConversationMenu } from './ConversationMenu'
import type { ConversationSummary } from '@/services/ai'
import { api } from '@/lib/api'
import { memberKeys } from '@/queries/member'
import { axiosError, renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn(), get: vi.fn(() => Promise.resolve({ data: { data: [] } })), patch: vi.fn(), delete: vi.fn() },
  adminApi: { post: vi.fn(), get: vi.fn() },
  ensureCsrfCookie: vi.fn(() => Promise.resolve()),
}))

const patch = vi.mocked(api.patch)
const remove = vi.mocked(api.delete)
const ID = '7f3c1c1e-1111-4a4a-9b9b-000000000001'
const list: Array<ConversationSummary> = [{ id: ID, title: 'Leave days', last_message_at: null }]

describe('conversation rename and delete', () => {
  beforeEach(() => {
    patch.mockReset()
    remove.mockReset()
  })

  it('renames through a dialog and updates the sidebar list', async () => {
    patch.mockResolvedValueOnce({ data: { data: { id: ID, title: 'Vacation leave', last_message_at: null } } })
    const { client } = renderWithQuery(<ConversationMenu id={ID} title="Leave days" />)
    client.setQueryData(memberKeys.conversations(), list)
    await userEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByLabelText('Title')
    expect(input).toHaveValue('Leave days')
    await userEvent.clear(input)
    await userEvent.type(input, '  Vacation leave ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(patch).toHaveBeenCalledWith(`/v1/ai/conversations/${ID}`, { title: 'Vacation leave' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(client.getQueryData<Array<ConversationSummary>>(memberKeys.conversations())?.[0]?.title).toBe('Vacation leave')
  })

  it('asks before deleting, then removes it', async () => {
    remove.mockResolvedValueOnce({ status: 204, data: '' })
    const onDeleted = vi.fn()
    const { client } = renderWithQuery(<ConversationMenu id={ID} title="Leave days" onDeleted={onDeleted} />)
    client.setQueryData(memberKeys.conversations(), list)
    await userEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('“Leave days” and its answers will be removed')
    expect(remove).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith(`/v1/ai/conversations/${ID}`))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(client.getQueryData<Array<ConversationSummary>>(memberKeys.conversations())).toEqual([])
  })

  it('cancel keeps the conversation; a failed delete says so', async () => {
    remove.mockRejectedValueOnce(axiosError(500, {}))
    renderWithQuery(<ConversationMenu id={ID} title="Leave days" />)
    await userEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(remove).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Conversation actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete this conversation')
  })
})
