import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { routeTree } from '.'
import { queryClient } from '@/lib/queryClient'
import { NotFoundPage } from '@/routes/system/NotFoundPage'

describe('router', () => {
  it('renders the 404 page for an unknown URL', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/this-page-does-not-exist'] }),
      defaultNotFoundComponent: NotFoundPage,
    })
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/')
  })
})
