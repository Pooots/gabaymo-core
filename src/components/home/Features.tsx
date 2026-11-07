import { BookOpen, Coins, Landmark, MessageCircle, Scale, ShieldCheck } from 'lucide-react'
import { Reveal } from './Reveal'
import type { LucideIcon } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const features: Array<{ icon: LucideIcon; title: MessageKey; body: MessageKey; note?: MessageKey }> = [
  { icon: ShieldCheck, title: 'home.feature1Title', body: 'home.feature1Body', note: 'home.feature1Note' },
  { icon: BookOpen, title: 'home.feature2Title', body: 'home.feature2Body' },
  { icon: Landmark, title: 'home.feature3Title', body: 'home.feature3Body' },
  { icon: Scale, title: 'home.feature4Title', body: 'home.feature4Body' },
  { icon: MessageCircle, title: 'home.feature5Title', body: 'home.feature5Body' },
  { icon: Coins, title: 'home.feature6Title', body: 'home.feature6Body' },
]

export function Features() {
  const { t } = useI18n()
  return (
    <section id="features" className="px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">{t('home.featuresEyebrow')}</p>
          <h2 className="serif mt-3 text-4xl leading-tight font-medium tracking-[-0.03em] text-moss-898 sm:text-5xl">{t('home.featuresTitle')}</h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">{t('home.featuresBody')}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 70}>
              <article className="lift-card h-full rounded-[22px] border border-line bg-surface p-6">
                <span aria-hidden className="grid h-10 w-10 place-items-center rounded-2xl bg-moss-51 text-brand">
                  <feature.icon size={18} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold text-moss-861">{t(feature.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-moss-608">{t(feature.body)}</p>
                {feature.note ? (
                  <p className="mt-4 border-t border-moss-76 pt-4 text-sm leading-relaxed text-moss-482 italic">{t(feature.note)}</p>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
