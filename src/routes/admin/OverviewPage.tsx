import { useEffect, useState } from 'react'

import {
  fetchOverview,
  type ActivityItem,
  type OverviewStats,
  type PlanStat,
  type SignupPoint,
} from '@/services/adminAuth'

const empty: OverviewStats = {
  members: 0,
  partners: 0,
  open_tickets: 0,
  documents: 0,
  payments_total: 0,
  signups: [],
  plans: [
    { name: 'Free Trial', price: '₱0', cadence: 'forever', tokens: 20, subscribers: 0 },
    { name: 'Monthly', price: '₱499', cadence: 'per month', tokens: 300, subscribers: 0 },
    { name: 'Yearly', price: '₱4,990', cadence: 'per year', tokens: 3600, subscribers: 0 },
  ],
  activity: [],
}

export function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats>(empty)
  const today = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  useEffect(() => {
    void fetchOverview()
      .then(setStats)
      .catch(() => undefined)
  }, [])

  const cards = [
    { label: 'Members', value: String(stats.members), note: 'School accounts' },
    { label: 'Open tickets', value: String(stats.open_tickets), note: 'Waiting on a partner' },
    { label: 'Documents', value: String(stats.documents), note: 'Approved sources' },
    {
      label: 'Collected',
      value: peso(stats.payments_total),
      note: 'Membership payments',
    },
  ]

  return (
    <div className="mx-auto flex h-full max-w-[1180px] flex-col xl:min-h-0 xl:overflow-hidden">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="serif text-[1.65rem] leading-none font-medium tracking-[-0.03em]">
          Overview
        </h1>
        <p className="text-sm text-[#6d6d6d]">{today}</p>
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-[#eceae6] bg-white px-4 py-3"
          >
            <p className="text-xs text-[#6d6d6d]">{card.label}</p>
            <p className="peso mt-1.5 text-[1.7rem] leading-none tracking-[-0.03em]">
              {card.value}
            </p>
            <p className="mt-1.5 text-[11px] text-[#8d8d8d]">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.72fr)] xl:grid-rows-2">
        <article className="flex flex-col rounded-2xl border border-[#eceae6] bg-white p-4 xl:min-h-0">
          <h2 className="text-[15px] font-semibold">Token allowance by plan</h2>
          <p className="mt-0.5 text-xs text-[#6d6d6d]">
            Questions included on each published membership.
          </p>
          <AllowanceChart plans={stats.plans} />
        </article>

        <article className="flex flex-col rounded-2xl border border-[#eceae6] bg-white p-4 xl:min-h-0">
          <h2 className="text-[15px] font-semibold">Plans</h2>
          <p className="mt-0.5 text-xs text-[#6d6d6d]">Subscribers on each plan.</p>
          <ul className="mt-3 flex flex-1 flex-col justify-center gap-2">
            {stats.plans.map((plan) => (
              <li
                key={plan.name}
                className="flex items-center justify-between rounded-xl bg-[#f7f6f3] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{plan.name}</p>
                  <p className="peso text-[11px] text-[#6d6d6d]">
                    {plan.price} {plan.cadence}
                  </p>
                </div>
                <p className="peso text-xl leading-none">{plan.subscribers}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="flex flex-col rounded-2xl border border-[#eceae6] bg-white p-4 xl:min-h-0">
          <h2 className="text-[15px] font-semibold">New members</h2>
          <p className="mt-0.5 text-xs text-[#6d6d6d]">The last 14 days.</p>
          <SignupChart points={stats.signups} />
        </article>

        <article className="flex flex-col rounded-2xl border border-[#eceae6] bg-white p-4 xl:min-h-0 xl:overflow-hidden">
          <h2 className="text-[15px] font-semibold">Recent activity</h2>
          <ActivityList items={stats.activity.slice(0, 4)} />
        </article>
      </div>
    </div>
  )
}

function peso(amount: number) {
  return `₱${amount.toLocaleString('en-PH')}`
}

function AllowanceChart({ plans }: { plans: PlanStat[] }) {
  const max = Math.max(1, ...plans.map((plan) => plan.tokens))
  const tones = ['bg-[#d7efe3]', 'bg-[#3f9a68]', 'bg-[#0e5c3c]']

  return (
    <div
      className="mt-3 grid h-40 items-end gap-4 xl:h-auto xl:min-h-0 xl:flex-1"
      style={{ gridTemplateColumns: `repeat(${Math.max(plans.length, 1)}, minmax(0, 1fr))` }}
    >
      {plans.map((plan, index) => (
        <div key={plan.name} className="flex h-full min-h-0 flex-col">
          <p className="peso mb-1 text-center text-xs font-medium">
            {plan.tokens.toLocaleString('en-PH')}
          </p>
          <div className="flex min-h-0 flex-1 items-end border-b border-[#eceae6]">
            <div
              className={`w-full rounded-t-lg ${tones[index] ?? tones[0]}`}
              style={{
                height: `${Math.round(Math.pow(plan.tokens / max, 0.45) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-center text-[11px] text-[#6d6d6d]">{plan.name}</p>
        </div>
      ))}
    </div>
  )
}

function SignupChart({ points }: { points: SignupPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="mt-6 text-sm text-[#6d6d6d]">No signup history yet.</p>
    )
  }

  const width = 640
  const height = 180
  const padX = 16
  const padTop = 12
  const padBottom = 22
  const max = Math.max(1, ...points.map((point) => point.value))
  const step = (width - padX * 2) / Math.max(1, points.length - 1)
  const coords = points.map((point, index) => ({
    ...point,
    x: padX + index * step,
    y: height - padBottom - (point.value / max) * (height - padTop - padBottom),
  }))
  const line = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const last = coords[coords.length - 1]
  const area = `${line} L ${last?.x ?? padX} ${height - padBottom} L ${padX} ${height - padBottom} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 h-40 w-full xl:h-auto xl:min-h-0 xl:flex-1"
    >
      {[0, 1, 2].map((row) => (
        <line
          key={row}
          x1={padX}
          x2={width - padX}
          y1={padTop + row * ((height - padTop - padBottom) / 2)}
          y2={padTop + row * ((height - padTop - padBottom) / 2)}
          stroke="#eceae6"
        />
      ))}
      <path d={area} fill="#0e6b3e" opacity="0.12" />
      <path d={line} fill="none" stroke="#0e5c3c" strokeWidth="2.5" />
      {coords.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} r="2.5" fill="#0e5c3c" />
      ))}
      {coords
        .filter((_, index) => index % 3 === 0)
        .map((point) => (
          <text
            key={`${point.label}-label`}
            x={point.x}
            y={height - 4}
            textAnchor="middle"
            fontSize="11"
            fill="#8d8d8d"
          >
            {point.label}
          </text>
        ))}
    </svg>
  )
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-4 text-sm leading-relaxed text-[#6d6d6d]">
        Sign-ins and record changes will show up here.
      </p>
    )
  }

  return (
    <ul className="mt-3 flex flex-1 flex-col justify-center">
      {items.map((item) => (
        <li key={item.id} className="border-b border-[#f0eeea] py-2 last:border-0">
          <p className="text-sm leading-snug font-medium">{item.summary}</p>
          <p className="mt-0.5 text-[11px] text-[#8d8d8d]">
            {item.at
              ? new Intl.DateTimeFormat('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(item.at))
              : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}
