import { ChevronRight, Lightbulb, LoaderCircle, Sparkles } from 'lucide-react'

import type { TrainingQuestion } from '@/services/training'
import { EmptyState, inputClass, primaryButton, secondaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'

/** The current training question: passage, GabayMo's draft and the partner's answer. */
export function QuestionPanel({
  question,
  questionText,
  answerText,
  loading,
  saving,
  onQuestionText,
  onAnswerText,
  onGenerate,
  onSave,
}: {
  question: TrainingQuestion | null
  questionText: string
  answerText: string
  loading: boolean
  saving: boolean
  onQuestionText: (value: string) => void
  onAnswerText: (value: string) => void
  onGenerate: () => void
  onSave: () => void
}) {
  const { t } = useI18n()
  const busy = loading || saving

  if (loading && !question) {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-16 text-center text-sm text-ash-573">
        <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden />
        {t('partner.questionLoading')}
      </p>
    )
  }

  if (!question) {
    return (
      <EmptyState
        icon={Sparkles}
        title={t('partner.readyTitle')}
        className="py-14"
        action={
          <button type="button" className={primaryButton} onClick={onGenerate}>
            <Sparkles size={16} aria-hidden />
            {t('partner.firstQuestion')}
          </button>
        }
      >
        {t('partner.readyBody')}
      </EmptyState>
    )
  }

  const { source } = question
  return (
    <div className={busy ? 'pointer-events-none opacity-60' : ''} aria-busy={busy}>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-moss-731">{t('partner.memberQuestion')}</span>
        <textarea
          rows={2}
          value={questionText}
          onChange={(event) => onQuestionText(event.target.value)}
          className={`${inputClass} field-sizing-content h-auto min-h-[4rem] py-3 leading-relaxed`}
        />
      </label>

      <details className="group mt-3" open>
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-brand">
          <ChevronRight size={15} className="shrink-0 transition group-open:rotate-90" aria-hidden />
          <span className="min-w-0 break-words">{t('partner.fromSource', { title: source.title, page: source.page })}</span>
        </summary>
        <blockquote className="mt-2 max-h-72 overflow-y-auto rounded-2xl border-l-2 border-brand/40 bg-ash-25 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-ash-773">
          {source.excerpt}
          <span className="mt-2 block text-xs text-ash-447">
            {source.reference}
            {source.appliesTo ? `${t('partner.separator')}${t('partner.appliesTo', { regions: source.appliesTo })}` : ''}
          </span>
        </blockquote>
        {source.outdated ? (
          <p className="mt-2 text-xs text-rust-620">{t('partner.outdatedIssuance', { status: source.legalStatus })}</p>
        ) : null}
      </details>

      <div className="mt-4 rounded-2xl border border-moss-128 bg-ash-27 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-strong">
            <Lightbulb size={14} aria-hidden /> {t('partner.suggestedAnswer')}
          </span>
          <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => onAnswerText(question.draft)}>
            {t('partner.startFromDraft')}
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-moss-833">{question.draft}</p>
        {question.quote ? (
          <p className={`mt-2 text-xs ${question.quoteVerified ? 'text-muted' : 'text-rust-620'}`}>
            {question.quoteVerified ? t('partner.basedOn', { quote: question.quote }) : t('partner.checkDraft')}
          </p>
        ) : null}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-medium text-moss-731">{t('partner.yourAnswer')}</span>
        <textarea
          rows={6}
          value={answerText}
          onChange={(event) => onAnswerText(event.target.value)}
          placeholder={t('partner.yourAnswerPlaceholder')}
          className={`${inputClass} field-sizing-content h-auto min-h-[9rem] py-3 leading-relaxed`}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryButton}
          disabled={!answerText.trim() || !questionText.trim() || saving}
          onClick={onSave}
        >
          {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
          {t('partner.saveAsAnswer')}
        </button>
        <button type="button" className={secondaryButton} disabled={busy} onClick={onGenerate}>
          {t('partner.skip')}
        </button>
      </div>
    </div>
  )
}
