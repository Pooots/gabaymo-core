import { Reveal } from './Reveal'

const topics = [
  'MOOE and Liquidation',
  'Procurement and Bidding',
  'School Forms and Reports',
  'Teacher Workload',
  'Administrative Responsibilities',
  'Personnel Management',
  'Complaints and Grievances',
  'Child Protection',
  'School Governance',
  'Financial Management',
  'Other DepEd Policies',
]

export function Library() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#101513] px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#7dcea5]">
              KNOWLEDGE LIBRARY
            </p>
            <h2 className="serif mt-3 text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl">
              A shelf built around your actual work.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#c5d0ca]">
              Documents are organized into the categories school heads search
              for most, and every answer traces back to a page inside them.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex flex-wrap gap-2.5">
              {topics.map((topic, index) => (
                <span
                  key={topic}
                  className="topic-pill rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e7eeea]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
