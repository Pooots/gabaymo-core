import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, Quote, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

import type { MessageKey } from '@/i18n'
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher'
import { ThemeToggle } from '@/components/preferences/ThemeToggle'
import { useI18n } from '@/i18n'

const assurances: Array<{ icon: typeof Quote; label: MessageKey }> = [
  { icon: Quote, label: 'auth.assuranceCited' },
  { icon: BookOpen, label: 'auth.assurancePages' },
  { icon: ShieldCheck, label: 'auth.assuranceTrial' },
]

export function AccountShell({
  eyebrow,
  title,
  text,
  fit = false,
  children,
}: {
  eyebrow: string
  title: string
  text: string
  fit?: boolean
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <main
      className={
        fit
          ? 'min-h-dvh bg-honey-63 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:overflow-hidden'
          : 'min-h-screen bg-honey-63 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]'
      }
    >
      <aside
        className={
          fit
            ? 'relative hidden h-full flex-col justify-between overflow-hidden bg-moss-855 text-white lg:flex lg:px-12 lg:py-8'
            : 'relative flex flex-col justify-between overflow-hidden bg-moss-855 px-6 py-8 text-white sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:px-14 lg:py-12'
        }
      >
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-moss-669/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-moss-886 blur-3xl" />

        <Link
          to="/"
          className="relative inline-flex w-fit rounded-2xl bg-surface px-3 py-2"
          aria-label={t('auth.homeLink')}
        >
          <img src="/gabaymo-logo.png" alt="" className="h-11 w-auto" />
        </Link>

        <div className="relative mt-10 lg:mt-0">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-moss-275">
            {eyebrow}
          </p>
          <h1
            className={
              fit
                ? 'serif mt-3 max-w-md text-4xl leading-[1.05] font-medium tracking-[-0.03em]'
                : 'serif mt-4 max-w-md text-[2.6rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-5xl'
            }
          >
            {t('auth.heroLine1')}{' '}
            <span className="italic text-moss-102">{t('auth.heroLine2')}</span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-moss-127">
            {text}
          </p>

          <article
            className={
              fit
                ? 'mt-6 max-w-md rounded-3xl border border-surface/10 bg-surface/10 p-4 backdrop-blur-sm'
                : 'mt-8 hidden max-w-md rounded-3xl border border-surface/10 bg-surface/10 p-5 backdrop-blur-sm lg:block'
            }
          >
            <p className="text-[11px] font-semibold tracking-[0.16em] text-moss-275">
              {t('auth.sampleEyebrow')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white">
              {t('auth.sampleQuestion')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-moss-127">
              {t('auth.sampleAnswer')}
            </p>
            <p className="mt-4 border-t border-surface/10 pt-3 text-xs text-moss-194">
              DepEd Order No. 13, s. 2016 · {t('auth.samplePage')}
            </p>
          </article>
        </div>

        <ul className="relative mt-8 flex flex-wrap gap-x-5 gap-y-2 lg:mt-0">
          {assurances.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-xs text-moss-127"
            >
              <item.icon size={14} aria-hidden className="text-moss-275" />
              {t(item.label)}
            </li>
          ))}
        </ul>
      </aside>

      <section
        className={
          fit
            ? 'flex min-h-dvh items-center px-5 py-5 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-12'
            : 'flex items-center px-5 py-10 sm:px-10 lg:overflow-y-auto lg:px-16 lg:py-12'
        }
      >
        <div
          className={
            fit
              ? 'mx-auto w-full max-w-[560px]'
              : 'mx-auto w-full max-w-[440px]'
          }
        >
          {fit ? (
            <Link
              to="/"
              className="mb-4 inline-flex lg:hidden"
              aria-label={t('auth.homeLink')}
            >
              <img src="/gabaymo-logo.png" alt="" className="h-10 w-auto" />
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-moss-571"
            >
              <ArrowLeft size={16} aria-hidden />
              {t('auth.backToSite')}
            </Link>
            <span className="flex items-center gap-2">
              <ThemeToggle compact />
              <LanguageSwitcher compact />
            </span>
          </div>
          <h2
            className={
              fit
                ? 'serif mt-4 text-[2rem] leading-none font-medium tracking-[-0.03em] text-moss-898'
                : 'serif mt-8 text-[2.4rem] leading-none font-medium tracking-[-0.03em] text-moss-898'
            }
          >
            {title}
          </h2>
          {children}
        </div>
      </section>
    </main>
  )
}
