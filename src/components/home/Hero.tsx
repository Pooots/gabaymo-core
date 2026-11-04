import { useEffect, useState } from 'react'
import { ArrowRight, FileText } from 'lucide-react'

const beats = [520, 700, 380, 980, 720, 2600]

export function AssistantPreview() {
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
      <article className="assistant-card rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_30px_70px_-36px_rgba(18,48,32,0.55)] sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/gabaymo-logo.png"
              alt=""
              className="h-9 w-9 rounded-lg object-cover object-left"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[#173026]">GabayMo</p>
              <p className="flex items-center gap-1.5 text-xs text-[#6b7870]">
                <span className="pulse-dot" />
                Policy assistant
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#eef6f1] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#0e6b3e]">
            3 SOURCES
          </span>
        </header>

        <div
          className={`mt-5 flex justify-end transition duration-500 ${
            show(1) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <p className="max-w-[92%] rounded-2xl rounded-br-md bg-[#f3f5f4] px-4 py-3 text-[13.5px] leading-relaxed text-[#24312a]">
            Can MOOE funds be used to pay for our school’s internet
            subscription?
          </p>
        </div>

        <p
          className={`mt-5 text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e] transition duration-500 ${
            show(2) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ANSWER
        </p>
        <p
          className={`mt-2 text-[14.5px] leading-relaxed text-[#24312a] transition duration-700 ${
            show(3) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          Yes — communication and internet services are chargeable to MOOE,
          provided the expense appears in your approved work and financial plan
          and is supported by complete procurement and liquidation documents.
        </p>

        <div
          className={`mt-4 rounded-2xl border border-[#e6eeea] bg-[#fbfcfb] p-4 transition duration-700 ${
            show(4) ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eef6f1] text-[#0e6b3e]">
              <FileText size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#173026]">
                DepEd Order No. 13, s. 2016
              </p>
              <p className="mt-0.5 text-xs text-[#6b7870]">
                Implementing Guidelines on the Direct Release of MOOE · Page 12
              </p>
            </div>
          </div>
          <blockquote className="mt-3 border-l-2 border-[#1f9a5a] pl-3 text-[13px] leading-relaxed text-[#3d4d45]">
            “…maintenance and other operating expenses shall be used for
            communication services, including internet subscription…”
          </blockquote>
        </div>

        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#66756d] transition duration-500 ${
            show(5) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1f9a5a]" />
            Verified source
          </span>
          <span>Page-level citation</span>
          <span className="font-medium text-[#0e6b3e]">Open document ↗</span>
        </div>
      </article>

      <div
        className={`float-chip absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-[#e5eee8] bg-white px-3.5 py-2.5 shadow-[0_16px_40px_-24px_rgba(16,40,28,0.65)] transition duration-700 sm:-left-6 ${
          show(5) ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f6ee] text-[#0e6b3e]">
          ✦
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#173026]">
            Grounded in your library
          </span>
          <span className="block text-xs text-[#708078]">
            Illustrative preview
          </span>
        </span>
      </div>
    </div>
  )
}

const proofs = [
  'Cited answers',
  'Page-level references',
  'Partner lawyer support',
  'Token-based',
]

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:gap-14 lg:pb-28 lg:pt-16">
        <div>
          <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-[#d7e8dc] bg-white/80 px-3 py-1 text-xs font-medium text-[#0e6b3e] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1f9a5a]" />
            Built for Philippine public school heads
          </p>
          <h1 className="serif hero-rise hero-delay-1 mt-6 text-[2.45rem] leading-[1.02] font-medium tracking-[-0.035em] text-[#142019] sm:text-[3rem] lg:text-[3.35rem]">
            <span className="block">Know what the rule says,</span>
            <span className="block italic text-[#0e6b3e]">before you act.</span>
          </h1>
          <p className="hero-rise hero-delay-2 mt-6 max-w-xl text-[17px] leading-relaxed text-[#5c6b63]">
            Your AI-powered DepEd policy and legal assistant. Find answers
            backed by actual government orders, memoranda, laws, and court
            decisions — with the exact page and provision attached.
          </p>
          <div className="hero-rise hero-delay-3 mt-8 flex flex-wrap gap-3">
            <a href="#how-it-works" className="btn-primary px-5 py-3.5">
              Ask GabayMo
              <ArrowRight size={16} />
            </a>
            <a href="#features" className="btn-ghost px-5 py-3.5">
              Explore Features
              <ArrowRight size={16} />
            </a>
          </div>
          <ul className="hero-rise hero-delay-4 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4d5c54]">
            {proofs.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1f9a5a]" />
                {item}
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
