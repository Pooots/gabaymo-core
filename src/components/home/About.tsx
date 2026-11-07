import { ShieldCheck } from 'lucide-react'

import { Reveal } from './Reveal'
import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const commitments: Array<MessageKey> = ['home.aboutCommit1', 'home.aboutCommit2', 'home.aboutCommit3', 'home.aboutCommit4']

export function About() {
  const { t } = useI18n()
  return (
    <section id="about" className="px-5 py-8 pb-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">{t('home.aboutEyebrow')}</p>
          <h2 className="serif mt-3 text-4xl leading-[1.08] font-medium tracking-[-0.03em] text-moss-898 sm:text-5xl">{t('home.aboutTitle')}</h2>
          <div className="mt-6 max-w-xl space-y-4 text-[16px] leading-relaxed text-muted">
            <p>{t('home.aboutBody1')}</p>
            <p>{t('home.aboutBody2')}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <article className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_24px_60px_-40px_rgba(16,40,28,0.45)] sm:p-8">
            <div className="flex items-center gap-2 text-brand">
              <ShieldCheck size={18} aria-hidden />
              <h3 className="text-sm font-semibold">{t('home.aboutCardTitle')}</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{t('home.aboutCardBody')}</p>
            <ul className="mt-5 space-y-3 border-t border-moss-76 pt-5 text-sm text-moss-833">
              {commitments.map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss-637" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-2xl bg-ash-37 px-4 py-3 text-xs leading-relaxed text-moss-571">{t('home.aboutDisclaimer')}</p>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
