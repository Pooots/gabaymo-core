import { MessageSquare, Search, Quote, UserRound } from 'lucide-react'

import { Reveal } from './Reveal'

const steps = [
  {
    n: '01',
    icon: MessageSquare,
    title: 'Ask in plain language',
    body: 'Describe the situation the way you would to a colleague — a MOOE expense, a teacher workload concern, a liquidation question.',
  },
  {
    n: '02',
    icon: Search,
    title: 'GabayMo searches the library',
    body: 'Every question runs against the indexed DepEd Orders, Memoranda, Republic Acts, CSC rules and court decisions approved in your library.',
  },
  {
    n: '03',
    icon: Quote,
    title: 'Read it with the citation',
    body: 'Each answer comes with the document title, number, page, provision and the exact excerpt — so you can open the source and verify it.',
  },
  {
    n: '04',
    icon: UserRound,
    title: 'Escalate when it matters',
    body: 'Type /help to open a support ticket and a partner lawyer reviews your concern within the 24-hour response window.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#0e6b3e]">
            HOW IT WORKS
          </p>
          <h2 className="serif mt-3 max-w-xl text-4xl leading-tight font-medium tracking-[-0.03em] text-[#142019] sm:text-5xl">
            From a question to a verifiable answer.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 90}>
              <article className="lift-card h-full rounded-[22px] border border-[#e6eeea] bg-white p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef6f1] text-[#0e6b3e]">
                    <step.icon size={18} />
                  </span>
                  <span className="text-sm text-[#b7c4bc]">{step.n}</span>
                </div>
                <h3 className="mt-6 text-[17px] font-semibold text-[#173026]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5d6b64]">
                  {step.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
