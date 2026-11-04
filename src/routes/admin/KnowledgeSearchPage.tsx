import { useEffect, useMemo, useState } from 'react'

import { fetchKnowledgeDocuments, type KnowledgeDocument } from '@/services/knowledge'

export function KnowledgeSearchPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchKnowledgeDocuments()
      .then(setDocuments)
      .catch(() => setError('Could not load the library.'))
      .finally(() => setLoading(false))
  }, [])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return documents
    return documents.filter((document) =>
      [document.title, document.reference, document.summary, document.content, document.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    )
  }, [documents, query])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Knowledge Search</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6d6d6d]">
        Search titles, references, and the text stored in the library.
      </p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the knowledge library"
        className="mt-6 h-12 w-full rounded-2xl border border-[#e4e1db] bg-white px-4 text-sm outline-none focus:border-[#0e6b3e]"
      />
      {error ? <p className="mt-4 text-sm text-[#9f2d2d]">{error}</p> : null}
      <p className="mt-4 text-xs text-[#8d8d8d]">
        {loading ? 'Loading…' : `${results.length} document${results.length === 1 ? '' : 's'}`}
      </p>
      <ul className="mt-3 space-y-3">
        {results.map((document) => (
          <li key={document.id} className="rounded-3xl border border-[#eceae6] bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{document.title}</h2>
              <span className="text-[11px] text-[#8d8d8d]">
                {document.source_status === 'approved'
                  ? 'Approved'
                  : document.source_status === 'returned'
                    ? 'Returned'
                    : 'Waiting'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6d6d6d]">
              {document.category}
              {document.reference ? ` · ${document.reference}` : ''}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#3a3a3a]">{snippet(document, query)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function snippet(document: KnowledgeDocument, query: string) {
  const source = document.content || document.summary
  const needle = query.trim().toLowerCase()
  if (!needle) return document.summary
  const index = source.toLowerCase().indexOf(needle)
  if (index < 0) return document.summary
  const start = Math.max(0, index - 60)
  const excerpt = source.slice(start, index + needle.length + 90).trim()
  return `${start > 0 ? '…' : ''}${excerpt}${index + needle.length + 90 < source.length ? '…' : ''}`
}
