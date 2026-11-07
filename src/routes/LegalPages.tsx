import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { Banner } from '@/components/ui'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'
import { ThemeToggle } from '@/components/preferences/ThemeToggle'
import { useI18n } from '@/i18n'

/** Date of the placeholder text below (update with the reviewed version). */
const UPDATED = '2026-11-07'

type Section = { title: MessageKey; body: MessageKey }

function LegalPage({
  title,
  intro,
  sections,
}: {
  title: MessageKey
  intro: MessageKey
  sections: Array<Section>
}) {
  const { t, intl } = useI18n()
  return (
    <main className="min-h-dvh bg-honey-63 px-4 py-10 text-moss-861 sm:px-6">
      <article className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface px-6 py-8 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-moss-571"
          >
            <ArrowLeft size={16} aria-hidden />
            {t('legal.backHome')}
          </Link>
          <span className="flex items-center gap-2">
            <ThemeToggle compact />
            <LanguageSwitcher compact />
          </span>
        </div>
        <h1 className="serif mt-6 text-4xl font-medium tracking-[-0.03em]">
          {t(title)}
        </h1>
        <p className="mt-2 text-xs text-moss-555">
          {t('legal.updated', {
            date: new Date(UPDATED).toLocaleDateString(intl, {
              dateStyle: 'long',
            }),
          })}
        </p>
        <Banner tone="warning" className="mt-5">
          {t('legal.draftNotice')}
        </Banner>
        <p className="mt-6 text-[15px] leading-relaxed">{t(intro)}</p>
        {sections.map((section, index) => (
          <section key={section.title} className="mt-6">
            <h2 className="text-base font-semibold">
              {index + 1}. {t(section.title)}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-moss-833">
              {t(section.body)}
            </p>
          </section>
        ))}
      </article>
    </main>
  )
}

export function TermsPage() {
  return (
    <LegalPage
      title="legal.termsTitle"
      intro="legal.termsIntro"
      sections={[
        { title: 'legal.terms1Title', body: 'legal.terms1Body' },
        { title: 'legal.terms2Title', body: 'legal.terms2Body' },
        { title: 'legal.terms3Title', body: 'legal.terms3Body' },
        { title: 'legal.terms4Title', body: 'legal.terms4Body' },
        { title: 'legal.terms5Title', body: 'legal.terms5Body' },
      ]}
    />
  )
}

export function PrivacyPage() {
  return (
    <LegalPage
      title="legal.privacyTitle"
      intro="legal.privacyIntro"
      sections={[
        { title: 'legal.privacy1Title', body: 'legal.privacy1Body' },
        { title: 'legal.privacy2Title', body: 'legal.privacy2Body' },
        { title: 'legal.privacy3Title', body: 'legal.privacy3Body' },
        { title: 'legal.privacy4Title', body: 'legal.privacy4Body' },
        { title: 'legal.privacy5Title', body: 'legal.privacy5Body' },
      ]}
    />
  )
}
