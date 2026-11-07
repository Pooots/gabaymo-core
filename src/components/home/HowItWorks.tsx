import { MessageSquare, Quote, Search, UserRound } from 'lucide-react'
import { Reveal } from './Reveal'
import type { LucideIcon } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const steps: Array<{ n: string; icon: LucideIcon; title: MessageKey; body: MessageKey }> = [
  { n: '01', icon: MessageSquare, title: 'home.step1Title', body: 'home.step1Body' },
  { n: '02', icon: Search, title: 'home.step2Title', body: 'home.step2Body' },
  { n: '03', icon: Quote, title: 'home.step3Title', body: 'home.step3Body' },
  { n: '04', icon: UserRound, title: 'home.step4Title', body: 'home.step4Body' },
]

export function HowItWorks() {
  const { t } = useI18n()
  return (
    <section id="how-it-works" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">{t('home.howEyebrow')}</p>
          <h2 className="serif mt-3 max-w-xl text-4xl leading-tight font-medium tracking-[-0.03em] text-moss-898 sm:text-5xl">{t('home.howTitle')}</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 90}>
              <article className="lift-card h-full rounded-[22px] border border-line bg-surface p-6">
                <div className="flex items-start justify-between">
                  <span aria-hidden className="grid h-10 w-10 place-items-center rounded-2xl bg-moss-51 text-brand">
                    <step.icon size={18} />
                  </span>
                  <span className="text-sm text-moss-257">{step.n}</span>
                </div>
                <h3 className="mt-6 text-[17px] font-semibold text-moss-861">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-moss-608">{t(step.body)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
