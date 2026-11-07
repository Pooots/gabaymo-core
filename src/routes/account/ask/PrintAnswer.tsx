import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { answerBody, sourceLine, uniqueSources } from './answerText'
import type { ChatMessage } from '@/services/ai'
import { useI18n } from '@/i18n'

export const PRINT_ROOT_ID = 'gabaymo-print'

/**
 * Print-only view of one answer (GabayMo header, question, answer, citations,
 * dates, disclaimer). It is portalled to <body>; while it is mounted the print
 * stylesheet hides everything else, then the browser's print dialog lets the
 * member save it as a PDF. Calls `onDone` after printing.
 */
export function PrintAnswer({ message, question, onDone }: { message: ChatMessage; question: string | null; onDone: () => void }) {
  const { t, intl } = useI18n()
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    document.body.classList.add('print-answer')
    const finish = () => done.current()
    window.addEventListener('afterprint', finish)
    // Let the portal paint before the dialog opens.
    const timer = window.setTimeout(() => {
      window.print()
    }, 50)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', finish)
      document.body.classList.remove('print-answer')
    }
  }, [])

  const sources = uniqueSources(message)
  const answered = new Date(message.created_at).toLocaleString(intl, { dateStyle: 'long', timeStyle: 'short' })
  const printed = new Date().toLocaleString(intl, { dateStyle: 'long', timeStyle: 'short' })

  return createPortal(
    <article id={PRINT_ROOT_ID} className="print-sheet" aria-hidden>
      <header className="print-header">
        <img src="/gabaymo-logo.png" alt="GabayMo" />
        <span>GabayMo</span>
      </header>
      {question ? (
        <section>
          <h2>{t('conversations.printQuestion')}</h2>
          <p className="print-question">{question}</p>
        </section>
      ) : null}
      <section>
        <h2>{t('conversations.printAnswer')}</h2>
        <div className="print-body">{answerBody(message)}</div>
      </section>
      {sources.length > 0 ? (
        <section>
          <h2>{t('conversations.sourcesHeading')}</h2>
          <ol className="print-sources">
            {sources.map((c) => (
              <li key={c.marker}>
                {sourceLine(c, (page) => t('conversations.printPage', { page }))}
                {c.quoted_text ? <q>{c.quoted_text}</q> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <footer className="print-footer">
        <p>{t('conversations.printDate', { date: answered, printed })}</p>
        <p>{t('conversations.printDisclaimer')}</p>
      </footer>
    </article>,
    document.body,
  )
}
