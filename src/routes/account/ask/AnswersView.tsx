import { useState } from 'react'
import { Search, X } from 'lucide-react'

import { formatWhen } from '../format'
import { ConversationMenu } from './ConversationMenu'
import { ErrorState, LoadingState, Pagination } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDebounced } from '@/hooks/useDebounced'
import { useConversationSearch } from '@/queries/member'

/** "Your questions": every past conversation, newest first, with search, rename and delete. */
export function AnswersView({ onOpen, onStart }: { onOpen: (id: string) => void; onStart: () => void }) {
  const { t, intl } = useI18n()
  const [input, setInput] = useState('')
  const search = useDebounced(input.trim())
  const [page, setPage] = useState(1)
  const [lastSearch, setLastSearch] = useState(search)
  if (search !== lastSearch) {
    setLastSearch(search)
    setPage(1)
  }
  const query = useConversationSearch(search, page)
  const conversations = query.data?.data ?? []

  if (query.isSuccess && conversations.length === 0 && search === '' && page === 1) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('ask.answersEyebrow')}</p>
        <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">{t('ask.answersEmptyTitle')}</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t('ask.answersEmptyBody')}</p>
        <button type="button" onClick={onStart} className="btn-primary mt-6">
          {t('ask.askQuestion')}
        </button>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-5">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('ask.answersEyebrow')}</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">{t('ask.answersTitle')}</h1>
      <div role="search" className="mt-5">
        <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm focus-within:border-brand">
          <Search size={16} aria-hidden className="text-moss-433" />
          <span className="sr-only">{t('conversations.searchLabel')}</span>
          <input
            type="search"
            value={input}
            maxLength={200}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('conversations.searchPlaceholder')}
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-moss-433"
          />
          {input ? (
            <button type="button" aria-label={t('conversations.searchClear')} onClick={() => setInput('')} className="text-moss-433">
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </label>
      </div>
      {query.isPending ? (
        <LoadingState className="mt-6" rows={4} />
      ) : query.isError ? (
        <ErrorState className="mt-6" compact error={query.error} retrying={query.isRefetching} onRetry={() => void query.refetch()} />
      ) : conversations.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t('conversations.searchEmpty', { search })}</p>
      ) : (
        <>
          <ul className="mt-6 space-y-3" aria-busy={query.isFetching}>
            {conversations.map((conversation) => (
              <li key={conversation.id} className="flex items-start gap-1 rounded-3xl border border-line bg-surface pr-2 hover:border-moss-220">
                <button type="button" onClick={() => onOpen(conversation.id)} className="min-w-0 flex-1 px-5 py-4 text-left">
                  <p className="text-[15px] leading-relaxed break-words">{conversation.title ?? t('ask.untitled')}</p>
                  <p className="mt-2 text-xs text-moss-555">
                    {t('ask.lastActivity', { when: formatWhen(conversation.last_message_at, intl, true) })}
                  </p>
                </button>
                <span className="pt-3">
                  <ConversationMenu id={conversation.id} title={conversation.title} />
                </span>
              </li>
            ))}
          </ul>
          <Pagination meta={query.data.meta} onPage={setPage} disabled={query.isFetching} />
        </>
      )}
    </div>
  )
}
