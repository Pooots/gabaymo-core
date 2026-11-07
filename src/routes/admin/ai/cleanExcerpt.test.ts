import { describe, expect, it } from 'vitest'
import { cleanExcerpt } from './FeedbackPage'

describe('cleanExcerpt', () => {
  it('drops the sources list and shows markers as numbers', () => {
    const raw = 'Schools may pay up to PHP 2,500.00 [S1, page 2].\n\nSources:\n[S1] Regional Memorandum No. 012, s. 2026'
    expect(cleanExcerpt(raw)).toBe('Schools may pay up to PHP 2,500.00 [1].')
  })

  it('handles a marker cut off by the excerpt length', () => {
    expect(cleanExcerpt('Superintendent [S1, page')).toBe('Superintendent [1]')
  })
})
