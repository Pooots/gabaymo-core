import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

/** Pill tabs with roving focus (Left/Right/Home/End). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>
  value: T
  onChange: (next: T) => void
  label?: string
}) {
  const list = useRef<HTMLDivElement>(null)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === value)
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    const tab = next === null ? undefined : tabs[next]
    if (!tab || next === null) return
    event.preventDefault()
    onChange(tab.id)
    list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div ref={list} role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-1 rounded-full bg-sand-53 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${value === tab.id ? 'bg-surface text-ash-890 shadow-sm' : 'text-ash-573 hover:text-ash-890'}`}
        >
          {tab.label}
          {tab.count !== undefined ? <span className="ml-1 text-ash-447">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
