import {
  BookOpen,
  Coins,
  Landmark,
  MessageCircle,
  Scale,
  ShieldCheck,
} from 'lucide-react'

import { Reveal } from './Reveal'

const features = [
  {
    icon: ShieldCheck,
    title: 'Cited Answers',
    body: 'Every response carries the document title, order or memorandum number, page, provision and supporting excerpt — plus a link to the original file.',
    note: 'If nothing supports the question, GabayMo says so plainly instead of guessing.',
  },
  {
    icon: BookOpen,
    title: 'Built for School Heads',
    body: 'Dedicated categories for MOOE and liquidation, procurement, school forms, teacher workload, child protection and school governance.',
  },
  {
    icon: Landmark,
    title: 'Orders, Memos and Cases',
    body: 'Search across DepEd Orders and Memoranda, Republic Acts, CSC rules, Supreme Court decisions and government circulars.',
  },
  {
    icon: Scale,
    title: 'Learns from Partner Lawyers',
    body: 'Approved lawyer guidance sharpens how GabayMo reasons through real questions — while factual claims stay anchored to verified documents.',
  },
  {
    icon: MessageCircle,
    title: 'Talk to a Partner',
    body: 'Type /help inside the assistant to open a support ticket. A partner lawyer claims it and responds within 24 hours.',
  },
  {
    icon: Coins,
    title: 'Token-Based Membership',
    body: 'One token per question. Paid plans refresh monthly, and the yearly plan gives you two months free.',
  },
]

export function Features() {
  return (
    <section id="features" className="px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#0e6b3e]">
            FEATURES
          </p>
          <h2 className="serif mt-3 text-4xl leading-tight font-medium tracking-[-0.03em] text-[#142019] sm:text-5xl">
            Accuracy you can point to.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#5c6b63]">
            GabayMo is not a search engine that guesses. It is a reading
            companion for the documents that govern your school.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 70}>
              <article className="lift-card h-full rounded-[22px] border border-[#e6eeea] bg-white p-6">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef6f1] text-[#0e6b3e]">
                  <feature.icon size={18} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold text-[#173026]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5d6b64]">
                  {feature.body}
                </p>
                {feature.note ? (
                  <p className="mt-4 border-t border-[#e8efeb] pt-4 text-sm leading-relaxed text-[#7d8b84] italic">
                    {feature.note}
                  </p>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
