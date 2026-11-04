import { ShieldCheck } from 'lucide-react'

import { Reveal } from './Reveal'

const commitments = [
  'Every claim carries a source or a disclosure',
  'Unsupported questions are declined, not guessed',
  'Library content is approved before it is searchable',
  'Document access respects your data privacy rights',
]

export function About() {
  return (
    <section id="about" className="px-5 py-8 pb-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#0e6b3e]">
            ABOUT US
          </p>
          <h2 className="serif mt-3 text-4xl leading-[1.08] font-medium tracking-[-0.03em] text-[#142019] sm:text-5xl">
            Guidance that respects the weight of the decision.
          </h2>
          <div className="mt-6 max-w-xl space-y-4 text-[16px] leading-relaxed text-[#5c6b63]">
            <p>
              GabayMo was built for the people who sign the documents. School
              heads, principals and administrative officers carry the
              responsibility for every peso released and every policy applied —
              often without immediate access to the orders behind them.
            </p>
            <p>
              We pair a curated library of DepEd issuances, Republic Acts and
              jurisprudence with an assistant that refuses to invent references.
              When the library cannot support an answer, GabayMo says so and
              points you to a partner lawyer.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <article className="rounded-[28px] border border-[#e6eeea] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(16,40,28,0.45)] sm:p-8">
            <div className="flex items-center gap-2 text-[#0e6b3e]">
              <ShieldCheck size={18} />
              <h3 className="text-sm font-semibold">Our accuracy commitment</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#5c6b63]">
              GabayMo never fabricates an order number, a page, or a quotation.
              Answers are limited to the approved documents in the knowledge
              library, and interpretations are always separated from direct
              statements in the source.
            </p>
            <ul className="mt-5 space-y-3 border-t border-[#e8efeb] pt-5 text-sm text-[#24312a]">
              {commitments.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f9a5a]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-2xl bg-[#f4f7f5] px-4 py-3 text-xs leading-relaxed text-[#66756d]">
              GabayMo provides informational guidance and does not replace
              formal legal advice from a qualified professional.
            </p>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
