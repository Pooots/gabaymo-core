import { useEffect, useState } from 'react'
import { ArrowRight, FileText } from 'lucide-react'

import type { MessageKey } from '@/i18n'
import { useI18n } from '@/i18n'

const beats = [520, 700, 380, 980, 720, 2600]

export function AssistantPreview() {
  const { t } = useI18n()
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(5)
      return
    }

    const timer = window.setTimeout(() => {
      setStage((current) => (current + 1) % beats.length)
    }, beats[stage])

    return () => window.clearTimeout(timer)
  }, [stage])

  const show = (step: number) => stage >= step

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="hero-glow pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_30%_20%,rgba(16,140,74,0.18),transparent_58%)]" />
      <article className="assistant-card rounded-[28px] border border-surface/80 bg-surface p-5 shadow-[0_30px_70px_-36px_rgba(18,48,32,0.55)] sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/gabaymo-logo.png"
              alt=""
              className="h-9 w-9 rounded-lg object-cover object-left"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-moss-861">GabayMo</p>
              <p className="flex items-center gap-1.5 text-xs text-moss-555">
                <span className="pulse-dot" />
                {t('home.previewRole')}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-moss-51 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand">
            {t('home.previewSources')}
          </span>
        </header>

        <div
          className={`mt-5 flex justify-end transition duration-500 ${
            show(1) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <p className="max-w-[92%] rounded-2xl rounded-br-md bg-ash-43 px-4 py-3 text-[13.5px] leading-relaxed text-moss-833">
            {t('home.previewQuestion')}
          </p>
        </div>

        <p
          className={`mt-5 text-[11px] font-semibold tracking-[0.16em] text-brand transition duration-500 ${
            show(2) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {t('home.previewAnswerLabel')}
        </p>
        <p
          className={`mt-2 text-[14.5px] leading-relaxed text-moss-833 transition duration-700 ${
            show(3) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {t('home.previewAnswer')}
        </p>

        <div
          className={`mt-4 rounded-2xl border border-line bg-ash-14 p-4 transition duration-700 ${
            show(4) ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="flex gap-3">
            <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-moss-51 text-brand">
              <FileText size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-moss-861">
                DepEd Order No. 13, s. 2016
              </p>
              <p className="mt-0.5 text-xs text-moss-555">
                Implementing Guidelines on the Direct Release of MOOE · {t('home.previewPage')}
              </p>
            </div>
          </div>
          <blockquote className="mt-3 border-l-2 border-moss-637 pl-3 text-[13px] leading-relaxed text-moss-729">
            “…maintenance and other operating expenses shall be used for
            communication services, including internet subscription…”
          </blockquote>
        </div>

        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-moss-571 transition duration-500 ${
            show(5) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-moss-637" />
            {t('home.previewVerified')}
          </span>
          <span>{t('home.previewPageCitation')}</span>
          <span className="font-medium text-brand">{t('home.previewOpen')}</span>
        </div>
      </article>

      <div
        className={`float-chip absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-moss-84 bg-surface px-3.5 py-2.5 shadow-[0_16px_40px_-24px_rgba(16,40,28,0.65)] transition duration-700 sm:-left-6 ${
          show(5) ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-moss-63 text-brand">
          ✦
        </span>
        <span>
          <span className="block text-sm font-semibold text-moss-861">
            {t('home.previewGrounded')}
          </span>
          <span className="block text-xs text-moss-529">
            {t('home.previewIllustrative')}
          </span>
        </span>
      </div>
    </div>
  )
}

const proofs: Array<MessageKey> = ['home.proof1', 'home.proof2', 'home.proof3', 'home.proof4']

export function Hero() {
  const { t } = useI18n()
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:gap-14 lg:pb-28 lg:pt-16">
        <div>
          <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-moss-124 bg-surface/80 px-3 py-1 text-xs font-medium text-brand shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-moss-637" />
            {t('home.heroBadge')}
          </p>
          <h1 className="serif hero-rise hero-delay-1 mt-6 text-[2.45rem] leading-[1.02] font-medium tracking-[-0.035em] text-moss-898 sm:text-[3rem] lg:text-[3.35rem]">
            <span className="block">{t('home.heroLine1')}</span>
            <span className="block italic text-brand">{t('home.heroLine2')}</span>
          </h1>
          <p className="hero-rise hero-delay-2 mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
            {t('home.heroBody')}
          </p>
          <div className="hero-rise hero-delay-3 mt-8 flex flex-wrap gap-3">
            <a href="#how-it-works" className="btn-primary px-5 py-3.5">
              {t('home.heroAsk')}
              <ArrowRight size={16} aria-hidden />
            </a>
            <a href="#features" className="btn-ghost px-5 py-3.5">
              {t('home.heroExplore')}
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <ul className="hero-rise hero-delay-4 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-moss-670">
            {proofs.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-moss-637" />
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-rise hero-delay-2 pb-8">
          <AssistantPreview />
        </div>
      </div>
    </section>
  )
}
