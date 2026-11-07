import { formatWhen } from '../format'
import { AnswerActions } from './AnswerActions'
import { answerBody, uniqueSources } from './answerText'
import { useTypewriter } from './useTypewriter'
import type { MessageKey } from '@/i18n'
import type { ChatMessage } from '@/services/ai'
import { PartnerTakeCard } from '@/components/answers/PartnerTakeCard'
import { RichText } from '@/components/answers/RichText'
import { useI18n } from '@/i18n'

/** Replies that come from GabayMo itself, not from a document search. */
const DIRECT_LABELS: Partial<Record<string, { label: MessageKey; footer: MessageKey }>> = {
  about: { label: 'ask.directAboutLabel', footer: 'ask.directAboutFooter' },
  conversation: { label: 'ask.directConversationLabel', footer: 'ask.directConversationFooter' },
  off_topic: { label: 'ask.directOffTopicLabel', footer: 'ask.directOffTopicFooter' },
}

export function AnswerBubble({
  message,
  animate = false,
  onGrow,
  conversationId = null,
  question = null,
  onAddReminder,
}: {
  message: ChatMessage
  animate?: boolean
  onGrow?: () => void
  conversationId?: string | null
  /** The member's question this answers (for the PDF export). */
  question?: string | null
  onAddReminder?: () => void
}) {
  const { t, intl } = useI18n()
  // The documents answer ends with a plain "Sources:" list; show sources as chips instead.
  const body = answerBody(message)
  const sources = uniqueSources(message)
  const takeText = message.meta?.partner_take?.text ?? ''
  const typed = useTypewriter(body, animate, onGrow)
  // "A partner's take" is typed after the documents answer.
  const typedTake = useTypewriter(takeText, animate, onGrow, typed.done)
  const take = takeText && typed.done ? typedTake.visible : ''
  const direct = DIRECT_LABELS[message.meta?.kind ?? '']

  return (
    <div className="max-w-[92%] min-w-0 space-y-3">
      <div className="flex gap-3">
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-moss-71 text-[11px] font-semibold text-brand" aria-hidden>
          G
        </span>
        <article className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-sand-72 px-4 py-3 break-words">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-sea-539 uppercase">
            {direct ? t(direct.label) : t('ask.fromDocuments')}
          </p>
          <RichText text={typed.visible} markers="numbers" className="mt-1.5 text-[15px] leading-relaxed text-moss-863" />
          {!typed.done ? (
            <button
              type="button"
              onClick={() => {
                typed.finish()
                typedTake.finish()
              }}
              className="mt-1 text-xs font-medium text-brand hover:underline"
            >
              {t('ask.showFull')}
            </button>
          ) : null}
          {typed.done && sources.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sources.map((c) => {
                const outdated = Boolean(c.legal_status && c.legal_status !== 'in_force')
                return (
                  <span
                    key={c.marker}
                    title={[
                      c.quoted_text ? `“${c.quoted_text}”` : null,
                      c.page ? t('ask.sourcePage', { page: c.page }) : null,
                      c.section,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    className={`max-w-full rounded-md px-2 py-0.5 text-xs break-words ${outdated ? 'bg-rust-33 text-rust-620' : 'bg-sea-57 text-sea-565'}`}
                  >
                    [{c.marker.replace(/^S/, '')}] {c.document_number || c.title}
                    {c.page ? `, ${t('ask.sourcePageShort', { page: c.page })}` : ''}
                    {c.authority_role && c.authority_role !== 'governing' ? ` · ${t('ask.referenceOnly')}` : ''}
                    {outdated && c.legal_status ? ` · ${c.legal_status.replace(/_/g, ' ')}` : ''}
                  </span>
                )
              })}
            </div>
          ) : null}
          {typed.done ? (
            <p className="mt-2 text-[11px] text-moss-433">
              {direct
                ? t(direct.footer)
                : message.meta?.reviewed_by === 'auto'
                  ? t('ask.checkedAuto')
                  : t('ask.checkedReviewer')}{' '}
              · {formatWhen(message.created_at, intl, true)}
            </p>
          ) : null}
        </article>
      </div>
      {take ? <PartnerTakeCard text={take} /> : null}
      {typed.done ? (
        <AnswerActions message={message} conversationId={conversationId} question={question} onAddReminder={onAddReminder} />
      ) : null}
    </div>
  )
}
