import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import {
  fetchKnowledgeDocuments,
  knowledgeCategories,
  knowledgeError,
  knowledgeKinds,
  saveKnowledgeDocument,
  type KnowledgeCategory,
  type KnowledgeDocument,
  type KnowledgeKind,
} from '@/services/knowledge'

type Draft = {
  title: string
  category: KnowledgeCategory
  kind: KnowledgeKind
  reference: string
  summary: string
  content: string
  active: boolean
}

const blank: Draft = {
  title: '',
  category: 'MOOE and Liquidation',
  kind: 'deped_order',
  reference: '',
  summary: '',
  content: '',
  active: true,
}

export function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [category, setCategory] = useState<KnowledgeCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void fetchKnowledgeDocuments()
      .then(setDocuments)
      .catch(() => setError('Could not load the knowledge base.'))
      .finally(() => setLoading(false))
  }, [])

  const visible = documents.filter(
    (document) => category === 'all' || document.category === category,
  )

  function selectDocument(document: KnowledgeDocument) {
    setSelectedId(document.id)
    setDraft(toDraft(document))
    setError('')
    setNotice('')
  }

  function startNew() {
    setSelectedId(null)
    setDraft({
      ...blank,
      category: category === 'all' ? blank.category : category,
    })
    setError('')
    setNotice('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveKnowledgeDocument(selectedId, {
        title: draft.title.trim(),
        category: draft.category,
        kind: draft.kind,
        reference: draft.reference.trim() || null,
        summary: draft.summary.trim(),
        content: draft.content.trim(),
        active: draft.active,
      })
      const rows = await fetchKnowledgeDocuments()
      setDocuments(rows)
      setSelectedId(saved.id)
      setDraft(toDraft(rows.find((document) => document.id === saved.id) ?? saved))
      setNotice(selectedId ? 'Document updated.' : 'Document added.')
    } catch (caught) {
      setError(knowledgeError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Knowledge Library</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
            Add and update the orders, memoranda, and decisions. A saved document waits in Source Review before it can be cited.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-white"
          onClick={startNew}
        >
          Add document
        </button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip
          label="All"
          count={documents.length}
          selected={category === 'all'}
          onClick={() => setCategory('all')}
        />
        {knowledgeCategories.map((item) => (
          <CategoryChip
            key={item}
            label={item}
            count={documents.filter((document) => document.category === item).length}
            selected={category === item}
            onClick={() => setCategory(item)}
          />
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <section className="rounded-3xl border border-[#eceae6] bg-white">
          {loading ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">Loading documents…</p>
          ) : visible.length === 0 ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">
              No documents in this shelf yet.
            </p>
          ) : (
            <ul>
              {visible.map((document) => {
                const selected = document.id === selectedId
                return (
                  <li key={document.id} className="border-b border-[#f3f1ed] last:border-0">
                    <button
                      type="button"
                      className={`flex w-full items-start justify-between gap-3 px-5 py-4 text-left ${
                        selected ? 'bg-[#f7f6f3]' : 'hover:bg-[#fafaf8]'
                      }`}
                      onClick={() => selectDocument(document)}
                    >
                      <span>
                        <span className="block text-sm font-medium">{document.title}</span>
                        <span className="mt-1 block text-xs text-[#6d6d6d]">
                          {document.kind_label}
                          {document.reference ? ` · ${document.reference}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[11px] text-[#8d8d8d]">
                        {sourceLabel(document.source_status)}
                        <span className="mt-1 block">
                          {document.active ? 'Published' : 'Hidden'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <form
          className="rounded-3xl border border-[#eceae6] bg-white p-5 sm:p-6"
          onSubmit={(event) => void onSubmit(event)}
        >
          <h2 className="text-lg font-semibold">
            {selectedId ? 'Edit document' : 'New document'}
          </h2>
          {selectedId ? (
            <p className="mt-1 text-xs text-[#6d6d6d]">
              {sourceLabel(documents.find((item) => item.id === selectedId)?.source_status ?? 'pending')}
              {documents.find((item) => item.id === selectedId)?.source_note
                ? ` · ${documents.find((item) => item.id === selectedId)?.source_note}`
                : ''}
            </p>
          ) : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <input
                required
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Shelf">
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value as KnowledgeCategory })
                }
                className={inputClass}
              >
                {knowledgeCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Document type">
              <select
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as KnowledgeKind })
                }
                className={inputClass}
              >
                {knowledgeKinds.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reference" className="sm:col-span-2">
              <input
                value={draft.reference}
                placeholder="DepEd Order No. 008, s. 2019"
                onChange={(event) => setDraft({ ...draft, reference: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Summary" className="sm:col-span-2">
              <textarea
                required
                rows={2}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
            <Field label="Knowledge text" className="sm:col-span-2">
              <textarea
                required
                rows={8}
                value={draft.content}
                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            />
            Published for answers
          </label>

          {error ? (
            <p className="mt-4 rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-4 rounded-xl bg-[#eef7f1] px-3 py-2 text-sm text-[#0e5c3c]">{notice}</p>
          ) : null}

          <button
            type="submit"
            className="btn-primary mt-5 h-11 justify-center px-5"
            disabled={pending}
          >
            {pending ? 'Saving…' : selectedId ? 'Save changes' : 'Add document'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-2xl border border-[#e4e1db] bg-[#fbfcfb] px-3 text-sm outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10'

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-[#6d6d6d] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function CategoryChip({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
        selected ? 'bg-[#171717] text-white' : 'bg-white text-[#3a3a3a] ring-1 ring-[#e4e1db]'
      }`}
    >
      {label}
      <span className={selected ? 'text-white/70' : 'text-[#8d8d8d]'}> {count}</span>
    </button>
  )
}

function sourceLabel(status: KnowledgeDocument['source_status']) {
  if (status === 'approved') return 'Source approved'
  if (status === 'returned') return 'Returned'
  return 'Waiting for review'
}

function toDraft(document: KnowledgeDocument): Draft {
  return {
    title: document.title,
    category: document.category,
    kind: document.kind,
    reference: document.reference ?? '',
    summary: document.summary,
    content: document.content,
    active: document.active,
  }
}
