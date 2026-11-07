import type { ReactNode } from 'react'

/** Page title block: eyebrow, serif title, description, optional action. */
export function PageHeader({
  eyebrow = 'Knowledge & AI',
  title,
  description,
  action,
}: {
  eyebrow?: string | null
  title: string
  description: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-573">{description}</p>
      </div>
      {action}
    </div>
  )
}

/** Simple page frame: title + text, then the content. */
export function Frame({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <h1 className="serif text-4xl font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-573">{text}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}
