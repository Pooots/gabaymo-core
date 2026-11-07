import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SettingsScreen } from './AccountSettings'
import { renderWithQuery } from '@/test/utils'

describe('reopening a past question', () => {
  it('uses the conversation id, so repeated titles open the right thread', async () => {
    const onOpenConversation = vi.fn()
    renderWithQuery(
      <SettingsScreen
        setting="activity"
        member={null}
        usage={null}
        conversations={[
          { id: 'c-first', title: 'How many leave days do I get?', last_message_at: null },
          { id: 'c-second', title: 'How many leave days do I get?', last_message_at: null },
          { id: 'c-untitled', title: null, last_message_at: null },
        ]}
        onUpgrade={vi.fn()}
        onOpenConversation={onOpenConversation}
        onMember={vi.fn()}
      />,
    )
    const buttons = screen.getAllByRole('button', { name: 'How many leave days do I get?' })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[1] as HTMLElement)
    expect(onOpenConversation).toHaveBeenCalledWith('c-second')
    await userEvent.click(screen.getByRole('button', { name: 'Untitled question' }))
    expect(onOpenConversation).toHaveBeenLastCalledWith('c-untitled')
  })
})
