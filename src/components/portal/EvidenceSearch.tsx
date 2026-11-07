import { useMemo, useState } from 'react'
import { BookOpen, FileText, Search, SearchX } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'

import { Card, EmptyState, ErrorNote, LoadingState, Select, primaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'

/** The fields evidence search reads from a knowledge document. */
export type SearchableDocument = {
  id: number
  title: string
  category: string
  kind_label: string
  reference: string | null
  summary: string
  content: string
}

type Evidence<T extends SearchableDocument> = {
  document: T
  paragraphs: Array<string>
  matched: Array<string>
  score: number
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'can',
  'does',
  'what',
  'when',
  'how',
  'who',
  'our',
  'with',
  'that',
  'this',
  'from',
  'into',
  'about',
  'school',
  'is',
  'of',
  'to',
  'in',
  'a',
  'an',
  'be',
  'may',
  'we',
  'it',
  'on',
  'or',
  'by',
  'as',
  'at',
  'do',
  'if',
  'ba',
  'ang',
  'ng',
  'sa',
  'na',
])

/**
 * Ask a question, get the approved paragraphs that match it. Word matching for
 * now; the semantic (embedding) search replaces searchEvidence() later.
 */
export function EvidenceSearch<T extends SearchableDocument>({
  documents,
  shelves,
  loading,
  error,
  placeholder,
  emptyTitle,
  emptyText,
}: {
  documents: Array<T>
  shelves: ReadonlyArray<string>
  loading: boolean
  error?: string
  placeholder?: string
  emptyTitle?: string
  emptyText?: string
}) {
  const { t, tn } = useI18n()
  const [query, setQuery] = useState('')
  const [shelf, setShelf] = useState('all')
  const [asked, setAsked] = useState<{ query: string; shelf: string } | null>(
    null,
  )

  const results = useMemo(
    () => (asked ? searchEvidence(documents, asked.query, asked.shelf) : []),
    [asked, documents],
  )

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (query.trim()) setAsked({ query: query.trim(), shelf })
  }

  return (
    <>
      <Card className="p-4">
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={onSubmit}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('adminKnowledge.question')}</span>
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ash-447"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder ?? t('adminKnowledge.evidencePlaceholder')}
              className="h-11 w-full rounded-2xl border border-sand-124 bg-ash-14 pr-3 pl-10 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </label>
          <div className="md:w-60">
            <Select
              aria-label={t('adminKnowledge.fieldShelf')}
              value={shelf}
              onChange={(event) => setShelf(event.target.value)}
            >
              <option value="all">{t('adminKnowledge.allShelves')}</option>
              {shelves.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className={primaryButton}
            disabled={!query.trim() || loading}
          >
            <Search size={16} aria-hidden />
            {t('common.search')}
          </button>
        </form>
      </Card>

      <Card className="mt-4">
        {loading ? (
          <LoadingState className="p-4" label={t('adminKnowledge.libraryLoading')} />
        ) : error ? (
          <div className="px-6 py-10">
            <ErrorNote>{error}</ErrorNote>
          </div>
        ) : !asked ? (
          <EmptyState icon={BookOpen} title={emptyTitle ?? t('adminKnowledge.searchEmptyTitle')}>
            {emptyText ?? t('adminKnowledge.evidenceEmptyText')}
          </EmptyState>
        ) : results.length === 0 ? (
          <EmptyState icon={SearchX} title={t('adminKnowledge.noEvidenceTitle')}>
            {asked.shelf === 'all'
              ? t('adminKnowledge.noEvidenceText', { query: asked.query })
              : t('adminKnowledge.noEvidenceShelfText', { query: asked.query, shelf: asked.shelf })}
          </EmptyState>
        ) : (
          <div>
            <p className="border-b border-sand-73 px-6 py-3 text-xs text-ash-573">
              {tn('adminKnowledge.evidenceCount', results.length, { query: asked.query })}
            </p>
            <ul>
              {results.map((item) => (
                <li
                  key={item.document.id}
                  className="border-b border-sand-59 px-6 py-5 last:border-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-53 text-muted">
                        <FileText size={16} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          {item.document.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-ash-573">
                          {item.document.reference ?? item.document.kind_label}{' '}
                          · {item.document.category}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-moss-53 px-2.5 py-1 text-[11px] font-medium text-brand-strong">
                      {tn('adminKnowledge.matchingWords', item.matched.length)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 sm:pl-12">
                    {item.paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="rounded-2xl border-l-2 border-brand/40 bg-ash-25 px-4 py-3 text-sm leading-relaxed text-ash-773"
                      >
                        {highlight(paragraph, item.matched)}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </>
  )
}

function terms(query: string) {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
    ),
  ]
}

export function searchEvidence<T extends SearchableDocument>(
  documents: Array<T>,
  query: string,
  shelf: string,
): Array<Evidence<T>> {
  const words = terms(query)
  if (words.length === 0) return []

  return documents
    .filter((document) => shelf === 'all' || document.category === shelf)
    .map((document) => {
      const scored = document.content
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => {
          const lower = paragraph.toLowerCase()
          return {
            paragraph,
            hits: words.filter((word) => lower.includes(word)),
          }
        })
        .filter((row) => row.hits.length > 0)
        .sort((a, b) => b.hits.length - a.hits.length)

      const header =
        `${document.title} ${document.reference ?? ''} ${document.summary}`.toLowerCase()
      const matched = words.filter(
        (word) =>
          header.includes(word) ||
          scored.some((row) => row.hits.includes(word)),
      )

      return {
        document,
        paragraphs: scored.slice(0, 3).map((row) => trim(row.paragraph)),
        matched,
        score: matched.length * 10 + (scored[0]?.hits.length ?? 0),
      }
    })
    .filter((item) => item.matched.length > 0)
    .map((item) =>
      item.paragraphs.length > 0
        ? item
        : { ...item, paragraphs: [item.document.summary] },
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

function trim(paragraph: string) {
  return paragraph.length > 600
    ? `${paragraph.slice(0, 600).trimEnd()}…`
    : paragraph
}

export function highlight(text: string, words: Array<string>): ReactNode {
  if (words.length === 0) return text
  const pattern = new RegExp(`(${words.map(escape).join('|')})`, 'gi')
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded bg-moss-100 px-0.5 text-moss-849">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
