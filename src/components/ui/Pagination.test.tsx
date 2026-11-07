import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pagination, pageWindow } from './Pagination'
import { renderWithQuery } from '@/test/utils'

describe('Pagination', () => {
  it('shows the range and moves between pages', async () => {
    const onPage = vi.fn()
    renderWithQuery(<Pagination meta={{ current_page: 2, last_page: 5, per_page: 20, total: 92 }} onPage={onPage} />)
    expect(screen.getByText('21–40 of 92')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPage).toHaveBeenLastCalledWith(3)
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(onPage).toHaveBeenLastCalledWith(1)
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }))
    expect(onPage).toHaveBeenLastCalledWith(5)
  })

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = renderWithQuery(<Pagination meta={{ current_page: 1, last_page: 3, per_page: 10, total: 25 }} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
    rerender(<Pagination meta={{ current_page: 3, last_page: 3, per_page: 10, total: 25 }} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(screen.getByText('21–25 of 25')).toBeInTheDocument()
  })

  it('shows only the count for one page and nothing for an empty list', () => {
    const { container, rerender } = renderWithQuery(
      <Pagination meta={{ current_page: 1, last_page: 1, per_page: 20, total: 4 }} onPage={vi.fn()} />,
    )
    expect(screen.getByText('1–4 of 4')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    rerender(<Pagination meta={{ current_page: 1, last_page: 1, per_page: 20, total: 0 }} onPage={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('collapses long page lists with gaps', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(6, 20)).toEqual([1, null, 5, 6, 7, null, 20])
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, null, 20])
  })
})
