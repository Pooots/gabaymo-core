import { useEffect, useState } from 'react'

import {
  fetchKnowledgeDocuments,
  knowledgeError,
  reviewKnowledgeDocument,
  type KnowledgeDocument,
} from '@/services/knowledge'

const filters = [
  { id: 'pending', label: 'Waiting' },
  { id: 'returned', label: 'Returned' },
  { id: 'approved', label: 'Approved' },
] as const

export function SourceReviewPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('pending')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void fetchKnowledgeDocuments()
      .then(setDocuments)
      .catch(() => setError('Could not load documents for review.'))
      .finally(() => setLoading(false))
  }, [])

  const visible = documents.filter((document) => document.source_status === filter)
  const selected = documents.find((document) => document.id === selectedId) ?? visible[0] ?? null

  async function decide(status: 'approved' | 'returned') {
    if (!selected) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await reviewKnowledgeDocument(selected.id, status, note.trim())
      const rows = await fetchKnowledgeDocuments()
      setDocuments(rows)
      setNote('')
      setSelectedId(null)
      setNotice(status === 'approved' ? 'Source approved.' : 'Document returned.')
    } catch (caught) {
      setError(knowledgeError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Source Review</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
        Check each document before GabayMo is allowed to cite it. Approve the source, or return it with a note.
      </p>

      <div className="mt-5 flex gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id)
              setSelectedId(null)
            }}
            className={`rounded-full px-3 py-1.5 text-xs ${
              filter === item.id
                ? 'bg-[#171717] text-white'
                : 'bg-white text-[#3a3a3a] ring-1 ring-[#e4e1db]'
            }`}
          >
            {item.label}{' '}
            <span className={filter === item.id ? 'text-white/70' : 'text-[#8d8d8d]'}>
              {documents.filter((document) => document.source_status === item.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-3xl border border-[#eceae6] bg-white">
          {loading ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">Loading documents…</p>
          ) : visible.length === 0 ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">Nothing in this queue.</p>
          ) : (
            <ul>
              {visible.map((document) => (
                <li key={document.id} className="border-b border-[#f3f1ed] last:border-0">
                  <button
                    type="button"
                    className={`w-full px-5 py-4 text-left ${
                      selected?.id === document.id ? 'bg-[#f7f6f3]' : 'hover:bg-[#fafaf8]'
                    }`}
                    onClick={() => {
                      setSelectedId(document.id)
                      setNote(document.source_note ?? '')
                      setNotice('')
                    }}
                  >
                    <span className="block text-sm font-medium">{document.title}</span>
                    <span className="mt-1 block text-xs text-[#6d6d6d]">
                      {document.category}
                      {document.reference ? ` · ${document.reference}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-[#eceae6] bg-white p-5 sm:p-6">
          {selected ? (
            <>
              <p className="text-xs font-medium tracking-wide text-[#8d8d8d] uppercase">
                {selected.kind_label}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{selected.title}</h2>
              <p className="mt-2 text-sm text-[#6d6d6d]">{selected.summary}</p>
              <p className="mt-4 max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-[#1c1c1c]">
                {selected.content}
              </p>
              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-[#6d6d6d] uppercase">
                  Review note
                </span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-2xl border border-[#e4e1db] bg-[#fbfcfb] px-3 py-3 text-sm outline-none focus:border-[#0e6b3e]"
                />
              </label>
              {error ? (
                <p className="mt-4 rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">{error}</p>
              ) : null}
              {notice ? (
                <p className="mt-4 rounded-xl bg-[#eef7f1] px-3 py-2 text-sm text-[#0e5c3c]">{notice}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary h-11 px-5"
                  disabled={pending}
                  onClick={() => void decide('approved')}
                >
                  Approve source
                </button>
                <button
                  type="button"
                  className="h-11 rounded-full border border-[#e4e1db] px-5 text-sm font-medium"
                  disabled={pending}
                  onClick={() => void decide('returned')}
                >
                  Return
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6d6d6d]">
              {notice || 'Select a document to review its source.'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
