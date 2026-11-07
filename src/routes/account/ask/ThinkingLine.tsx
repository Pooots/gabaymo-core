import { useEffect, useState } from 'react'

import type { MessageKey } from '@/i18n'
import type { QuestionState } from '@/services/ai'
import { useI18n } from '@/i18n'

export type Stage = NonNullable<QuestionState['progress']>['stage']

/** What GabayMo "says" while it works. Lines follow the real stage and rotate within it. */
const THINKING: Record<Stage, Array<MessageKey>> = {
  searching: ['ask.thinkSearching1', 'ask.thinkSearching2', 'ask.thinkSearching3'],
  writing: ['ask.thinkWriting1', 'ask.thinkWriting2', 'ask.thinkWriting3'],
  checking: ['ask.thinkChecking1', 'ask.thinkChecking2'],
  sending: ['ask.thinkSending1'],
}
const SLOW_LINES: Array<MessageKey> = ['ask.thinkSlow1', 'ask.thinkSlow2']
const STAGE_ORDER: Array<Stage> = ['searching', 'writing', 'checking', 'sending']
const LINE_MS = 2800
const SLOW_AFTER_MS = 25_000

/** One status line at a time while GabayMo prepares an answer. */
export function ThinkingLine({ stage }: { stage?: Stage | null }) {
  const { t } = useI18n()
  const [started] = useState(() => Date.now())
  const [tick, setTick] = useState(0)
  const [slow, setSlow] = useState(false)
  // Never step back to an earlier stage, even if a retry reports one.
  const [reached, setReached] = useState<Stage>(stage ?? 'searching')
  if (stage && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(reached)) {
    setReached(stage)
    setTick(0)
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1)
      if (Date.now() - started > SLOW_AFTER_MS) setSlow(true)
    }, LINE_MS)
    return () => window.clearInterval(timer)
  }, [started])

  const lines = slow ? [...THINKING[reached], ...SLOW_LINES] : THINKING[reached]
  // Hold on the last line of a stage instead of looping back to its first ("thinking" twice reads oddly).
  const key = slow ? lines[tick % lines.length] : lines[Math.min(tick, lines.length - 1)]
  const line = key ? t(key) : ''

  return (
    <p className="mt-2 flex items-center gap-2.5 text-[15px] text-moss-833" role="status" aria-live="polite">
      <span className="pulse-dot shrink-0" aria-hidden />
      <span key={line} className="thinking-line">
        {line}
      </span>
    </p>
  )
}
