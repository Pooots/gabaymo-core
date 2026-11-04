export function AiReviewPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="serif text-4xl font-medium tracking-[-0.03em]">AI Review Queue</h1>
        <span className="rounded-full bg-[#efe8d8] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#7a6840]">
          PLANNED
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
        Answers that need a person to check the citation will wait here before they are sent. The queue is not open yet.
      </p>
      <section className="mt-8 rounded-3xl border border-dashed border-[#e4e1db] bg-white px-6 py-12">
        <p className="text-sm font-medium">No items are waiting.</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#6d6d6d]">
          Source Review already covers documents before they enter the library. This queue will cover generated answers once that check is turned on.
        </p>
      </section>
    </div>
  )
}
