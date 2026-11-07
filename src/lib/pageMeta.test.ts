import { describe, expect, it } from 'vitest'

import { pageMetaFor } from './pageMeta'

describe('pageMetaFor', () => {
  it('indexes public pages', () => {
    expect(pageMetaFor('/')).toEqual({
      title: 'common.pageTitleHome',
      index: true,
    })
    expect(pageMetaFor('/register')).toMatchObject({ index: true })
    expect(pageMetaFor('/terms/')).toMatchObject({
      title: 'common.pageTitleTerms',
      index: true,
    })
  })

  it('keeps signed-in areas and one-time links out of search results', () => {
    for (const path of [
      '/account',
      '/admin',
      '/admin/knowledge-library',
      '/partner/tickets',
      '/reset-password',
      '/setup-account',
    ]) {
      expect(pageMetaFor(path).index, path).toBe(false)
    }
    // A path that only starts with a private prefix is not that area.
    expect(pageMetaFor('/administrator')).toEqual({
      title: 'common.pageTitleNotFound',
      index: false,
    })
  })
})
