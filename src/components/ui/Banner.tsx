import { Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

const bannerTones = {
  info: { box: 'border-moss-128 bg-moss-53 text-moss-794', icon: 'text-brand', Icon: Info },
  warning: { box: 'border-honey-169 bg-honey-47 text-honey-755', icon: 'text-honey-580', Icon: TriangleAlert },
  muted: { box: 'border-sand-86 bg-surface text-ash-639', icon: 'text-ash-447', Icon: Info },
} as const

export function Banner({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: keyof typeof bannerTones
  children: ReactNode
  className?: string
}) {
  const style = bannerTones[tone]
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed ${style.box} ${className}`}>
      <style.Icon size={16} aria-hidden className={`mt-0.5 shrink-0 ${style.icon}`} />
      <div>{children}</div>
    </div>
  )
}
