import { describe, expect, it } from 'vitest'

import { aiError } from './shared'
import { axiosError } from '@/test/utils'

describe('aiError', () => {
  it('does not repeat a reason that says the same as the message', () => {
    const error = axiosError(403, {
      message:
        'You uploaded this document, so another reviewer must approve it.',
      reasons: ['self_approval_not_allowed'],
    })
    expect(aiError(error)).toBe(
      'You uploaded this document, so another reviewer must approve it.',
    )
  })

  it('still lists reasons that add information', () => {
    const error = axiosError(422, {
      message: 'This version cannot be approved yet.',
      reasons: ['missing_source_url_custom'],
    })
    expect(aiError(error)).toBe(
      'This version cannot be approved yet. (missing source url custom)',
    )
  })
})
