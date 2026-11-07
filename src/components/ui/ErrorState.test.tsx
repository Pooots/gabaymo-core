import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ErrorState } from './ErrorState'
import { axiosError } from '@/test/utils'

describe('ErrorState', () => {
  it('announces the failure and retries', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("shows the API's message for a failed request", () => {
    render(<ErrorState error={axiosError(422, { message: 'The plan is no longer available.' })} />)
    expect(screen.getByText('The plan is no longer available.')).toBeInTheDocument()
  })

  it('uses the offline wording when the request never reached the server', () => {
    const offline = Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined })
    render(<ErrorState error={offline} compact />)
    expect(screen.getByRole('alert')).toHaveTextContent('You are offline')
  })

  it('has no retry button without onRetry', () => {
    render(<ErrorState title="Could not load tickets" />)
    expect(screen.getByText('Could not load tickets')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
