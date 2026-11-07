import { useRef, useState } from 'react'
import { FlaskConical, GraduationCap, LoaderCircle, Sparkles } from 'lucide-react'

import { QuestionPanel } from './training/QuestionPanel'
import { RecentAnswers, TestTab } from './training/TrainingPanels'
import { VoiceSection } from './training/VoiceSection'
import type { KeyboardEvent } from 'react'
import type { TrainingQuestion } from '@/services/training'
import { Card, PageHeader, primaryButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useTrainingActions, useTrainingAnswers, useTrainingVoice } from '@/queries/partner'
import { trainingError } from '@/services/training'

type Tab = 'voice' | 'test'

const TABS = [
  ['voice', 'partner.tabVoice', GraduationCap],
  ['test', 'partner.tabTest', FlaskConical],
] as const

export function PartnerTraining() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('voice')
  const list = useRef<HTMLDivElement>(null)

  // Left/Right/Home/End move between the two tabs (roving focus).
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex(([id]) => id === tab)
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    const target = next === null ? undefined : TABS[next]
    if (!target || next === null) return
    event.preventDefault()
    setTab(target[0])
    list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <PageHeader eyebrow={t('partner.trainingEyebrow')} title={t('partner.navTrain')} description={t('partner.trainDescription')} />

      <div
        ref={list}
        className="mt-6 inline-flex max-w-full flex-wrap rounded-full bg-sand-92 p-1"
        role="tablist"
        aria-label={t('partner.tabsLabel')}
        onKeyDown={onKeyDown}
      >
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            id={`partner-train-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls="partner-train-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === id ? 'bg-surface text-ash-890 shadow-sm' : 'text-ash-573 hover:text-ash-890'
            }`}
          >
            <Icon size={15} aria-hidden />
            {t(label)}
          </button>
        ))}
      </div>

      <div id="partner-train-panel" role="tabpanel" aria-labelledby={`partner-train-tab-${tab}`} className="mt-4">
        {tab === 'voice' ? <VoiceTab /> : <TestTab />}
      </div>
    </div>
  )
}

function VoiceTab() {
  const { t } = useI18n()
  const voice = useTrainingVoice()
  // Re-reads the list while any answer is still being embedded.
  const answers = useTrainingAnswers()
  const actions = useTrainingActions()
  const [question, setQuestion] = useState<TrainingQuestion | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loading = actions.nextQuestion.isPending
  const saving = actions.save.isPending

  async function generate() {
    setError('')
    try {
      const next = await actions.nextQuestion.mutateAsync()
      setQuestion(next)
      setQuestionText(next.question)
      setAnswerText('')
    } catch (caught) {
      setError(trainingError(caught, t('partner.questionError')))
    }
  }

  async function onSaveAnswer() {
    if (!question || !answerText.trim() || !questionText.trim()) return
    setError('')
    try {
      await actions.save.mutateAsync({ question, questionText, answerText })
    } catch (caught) {
      setError(trainingError(caught, t('partner.saveAnswerError')))
      return
    }
    setNotice(t('partner.savedNotice'))
    await generate()
  }

  const answersCount = voice.data?.answersCount ?? answers.data?.length ?? 0
  const minAnswers = voice.data?.minAnswers ?? 3

  return (
    <div className="space-y-4">
      <VoiceSection voice={voice} answersCount={answersCount} minAnswers={minAnswers} />

      <p className="max-w-4xl text-sm leading-relaxed text-muted">{t('partner.trainIntro')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primaryButton} disabled={loading || saving} onClick={() => void generate()}>
          {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
          {t('partner.newQuestion')}
        </button>
        <span className="rounded-full bg-moss-53 px-3 py-1 text-xs font-medium text-brand-strong">
          {t('partner.answersSaved', { count: answersCount })}
        </span>
        {notice && !error ? (
          <span role="status" className="text-xs text-brand-strong">
            {notice}
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl border border-rust-124 bg-rust-33 px-4 py-3 text-sm text-rust-708">
          {error}
        </p>
      ) : null}

      <Card className="p-5 sm:p-6">
        <QuestionPanel
          question={question}
          questionText={questionText}
          answerText={answerText}
          loading={loading}
          saving={saving}
          onQuestionText={setQuestionText}
          onAnswerText={setAnswerText}
          onGenerate={() => void generate()}
          onSave={() => void onSaveAnswer()}
        />
      </Card>

      <RecentAnswers answers={answers} />
    </div>
  )
}
