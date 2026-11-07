import { Reveal } from './Reveal'
import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const topics: Array<MessageKey> = [
  'home.topic1',
  'home.topic2',
  'home.topic3',
  'home.topic4',
  'home.topic5',
  'home.topic6',
  'home.topic7',
  'home.topic8',
  'home.topic9',
  'home.topic10',
  'home.topic11',
]

export function Library() {
  const { t } = useI18n()
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-moss-927 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-moss-351 uppercase">{t('home.libraryEyebrow')}</p>
            <h2 className="serif mt-3 text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl">{t('home.libraryTitle')}</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-moss-206">{t('home.libraryBody')}</p>
          </Reveal>
          <Reveal delay={120}>
            <ul className="flex flex-wrap gap-2.5">
              {topics.map((key, index) => (
                <li
                  key={key}
                  className="topic-pill rounded-full border border-surface/15 bg-surface/5 px-4 py-2 text-sm text-moss-81"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {t(key)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
