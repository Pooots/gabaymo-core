import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import { adminKnowledgeKeys as keys } from './adminKnowledge'

/** Does a filter on `filter` (as used by invalidateQueries) select the query `key`? */
function matches(filter: ReadonlyArray<unknown>, key: ReadonlyArray<unknown>) {
  const client = new QueryClient()
  client.setQueryData(key, true)
  return client.getQueryCache().findAll({ queryKey: filter }).length === 1
}

describe('adminKnowledgeKeys', () => {
  it('roots every knowledge key at the admin area', () => {
    expect(keys.document('d1')[0]).toBe('admin')
    expect(keys.draft('x')[0]).toBe('admin')
    expect(keys.instructions('partner')[0]).toBe('partner')
  })

  it('invalidating documents reaches lists, detail, pages and versions', () => {
    for (const key of [keys.documentList({ page: 2 }), keys.document('d1'), keys.pages('d1', 'v1'), keys.versions('d1')]) {
      expect(matches(keys.documents(), key)).toBe(true)
    }
  })

  it('list-only invalidation (used while polling a busy detail) never refetches the detail', () => {
    expect(matches(keys.documentLists(), keys.documentList({ q: 'mooe' }))).toBe(true)
    expect(matches(keys.documentLists(), keys.document('d1'))).toBe(false)
  })
})
