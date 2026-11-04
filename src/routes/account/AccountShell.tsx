import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, Quote, ShieldCheck } from 'lucide-react'

const assurances = [
  { icon: Quote, label: 'Cited answers' },
  { icon: BookOpen, label: 'Page-level references' },
  { icon: ShieldCheck, label: 'Free trial to start' },
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
  return (
    <main
      className={
        fit
          ? 'h-dvh overflow-hidden bg-[#f4f1ea] lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]'
          : 'min-h-screen bg-[#f4f1ea] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]'
      }
    >
      <aside
        className={
          fit
            ? 'relative hidden h-full flex-col justify-between overflow-hidden bg-[#0b3f2a] text-white lg:flex lg:px-12 lg:py-8'
            : 'relative flex flex-col justify-between overflow-hidden bg-[#0b3f2a] px-6 py-8 text-white sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:px-14 lg:py-12'
        }
      >
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#1f8a52]/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[#083224] blur-3xl" />

        <Link to="/" className="relative inline-flex w-fit rounded-2xl bg-white px-3 py-2" aria-label="GabayMo home">
          <img src="/gabaymo-logo.png" alt="GabayMo" className="h-11 w-auto" />
        </Link>

        <div className="relative mt-10 lg:mt-0">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#9ed4b6]">{eyebrow}</p>
          <h1
            className={
              fit
                ? 'serif mt-3 max-w-md text-4xl leading-[1.05] font-medium tracking-[-0.03em]'
                : 'serif mt-4 max-w-md text-[2.6rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-5xl'
            }
          >
            Know what the rule says,{' '}
            <span className="italic text-[#d7f3e4]">before you act.</span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#d5e8de]">{text}</p>

          <article
            className={
              fit
                ? 'mt-6 max-w-md rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm'
                : 'mt-8 hidden max-w-md rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm lg:block'
            }
          >
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9ed4b6]">A CITED ANSWER</p>
            <p className="mt-3 text-sm leading-relaxed text-white">
              Can MOOE funds pay for the school’s internet subscription?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#d5e8de]">
              Yes, when the expense is in the approved work and financial plan and the documents are complete.
            </p>
            <p className="mt-4 border-t border-white/10 pt-3 text-xs text-[#b7e4cc]">
              DepEd Order No. 13, s. 2016 · Page 12
            </p>
          </article>
        </div>

        <ul className="relative mt-8 flex flex-wrap gap-x-5 gap-y-2 lg:mt-0">
          {assurances.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs text-[#d5e8de]">
              <item.icon size={14} className="text-[#9ed4b6]" />
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      <section
        className={
          fit
            ? 'flex h-full items-center overflow-hidden px-6 py-5 sm:px-10 lg:px-12'
            : 'flex items-center px-5 py-10 sm:px-10 lg:overflow-y-auto lg:px-16 lg:py-12'
        }
      >
        <div className={fit ? 'mx-auto w-full max-w-[560px]' : 'mx-auto w-full max-w-[440px]'}>
          {fit ? (
            <Link to="/" className="mb-4 inline-flex lg:hidden" aria-label="GabayMo home">
              <img src="/gabaymo-logo.png" alt="GabayMo" className="h-10 w-auto" />
            </Link>
          ) : null}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#66756d]">
            <ArrowLeft size={16} />
            Back to site
          </Link>
          <h2
            className={
              fit
                ? 'serif mt-4 text-[2rem] leading-none font-medium tracking-[-0.03em] text-[#142019]'
                : 'serif mt-8 text-[2.4rem] leading-none font-medium tracking-[-0.03em] text-[#142019]'
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
