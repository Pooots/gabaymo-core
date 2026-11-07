import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { useConfirm } from './ConfirmDialog'

function Harness() {
  const [confirm, dialog] = useConfirm()
  const [result, setResult] = useState('none')
  return (
    <>
      <button
        type="button"
        onClick={() => {
          void confirm({ title: 'Discard changes?', description: 'Unsaved edits will be lost.', confirmLabel: 'Discard', tone: 'danger' }).then((ok) =>
            setResult(ok ? 'confirmed' : 'cancelled'),
          )
        }}
      >
        Open
      </button>
      <p>result: {result}</p>
      {dialog}
    </>
  )
}

describe('ConfirmDialog / useConfirm', () => {
  it('opens an alertdialog with focus on Cancel and resolves true on confirm', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Discard changes?' })
    expect(dialog).toHaveAccessibleDescription('Unsaved edits will be lost.')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(await screen.findByText('result: confirmed')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('Escape cancels and focus returns to the trigger', async () => {
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(await screen.findByText('result: cancelled')).toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps Tab inside the dialog', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    const discard = screen.getByRole('button', { name: 'Discard' })
    const close = screen.getByRole('button', { name: 'Close' })
    // Order inside the dialog: Close (header), Cancel, Discard.
    act(() => discard.focus())
    await userEvent.tab()
    expect(close).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(discard).toHaveFocus()
    expect(cancel).toBeInTheDocument()
  })
})
