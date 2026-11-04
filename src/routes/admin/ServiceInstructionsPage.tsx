import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import {
  fetchInstructions,
  instructionError,
  saveInstruction,
  type ServiceInstruction,
} from '@/services/instructions'

type Draft = {
  title: string
  body: string
  active: boolean
  sort_order: string
}

const blank: Draft = { title: '', body: '', active: true, sort_order: '1' }

export function ServiceInstructionsPage() {
  const [instructions, setInstructions] = useState<ServiceInstruction[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void fetchInstructions()
      .then((rows) => {
        setInstructions(rows)
        if (rows[0]) {
          setSelectedId(rows[0].id)
          setDraft(toDraft(rows[0]))
        }
      })
      .catch(() => setError('Could not load service instructions.'))
      .finally(() => setLoading(false))
  }, [])

  function selectInstruction(instruction: ServiceInstruction) {
    setSelectedId(instruction.id)
    setDraft(toDraft(instruction))
    setError('')
    setNotice('')
  }

  function startNew() {
    const next = instructions.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1
    setSelectedId(null)
    setDraft({ ...blank, sort_order: String(next) })
    setError('')
    setNotice('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveInstruction(selectedId, {
        title: draft.title.trim(),
        body: draft.body.trim(),
        active: draft.active,
        sort_order: Number(draft.sort_order),
      })
      const rows = await fetchInstructions()
      setInstructions(rows)
      setSelectedId(saved.id)
      setDraft(toDraft(rows.find((item) => item.id === saved.id) ?? saved))
      setNotice(selectedId ? 'Instruction updated.' : 'Instruction added.')
    } catch (caught) {
      setError(instructionError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Service Instructions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
            Rules the assistant must follow when it answers from the knowledge library.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-white"
          onClick={startNew}
        >
          Add instruction
        </button>
      </div>

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <section className="rounded-3xl border border-[#eceae6] bg-white">
          {loading ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">Loading instructions…</p>
          ) : instructions.length === 0 ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">No instructions yet.</p>
          ) : (
            <ul>
              {instructions.map((instruction) => (
                <li key={instruction.id} className="border-b border-[#f3f1ed] last:border-0">
                  <button
                    type="button"
                    className={`w-full px-5 py-4 text-left ${
                      instruction.id === selectedId ? 'bg-[#f7f6f3]' : 'hover:bg-[#fafaf8]'
                    }`}
                    onClick={() => selectInstruction(instruction)}
                  >
                    <span className="block text-sm font-medium">{instruction.title}</span>
                    <span className="mt-1 block text-xs text-[#6d6d6d]">
                      {instruction.active ? 'Active' : 'Paused'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form
          className="rounded-3xl border border-[#eceae6] bg-white p-5 sm:p-6"
          onSubmit={(event) => void onSubmit(event)}
        >
          <h2 className="text-lg font-semibold">
            {selectedId ? 'Edit instruction' : 'New instruction'}
          </h2>
          <div className="mt-5 grid gap-4">
            <Field label="Title">
              <input
                required
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Instruction">
              <textarea
                required
                rows={6}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                className={`${inputClass} h-auto py-3`}
              />
            </Field>
            <Field label="Order">
              <input
                required
                type="number"
                min={0}
                value={draft.sort_order}
                onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            />
            Active
          </label>
          {error ? (
            <p className="mt-4 rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-4 rounded-xl bg-[#eef7f1] px-3 py-2 text-sm text-[#0e5c3c]">{notice}</p>
          ) : null}
          <button type="submit" className="btn-primary mt-5 h-11 px-5" disabled={pending}>
            {pending ? 'Saving…' : selectedId ? 'Save changes' : 'Add instruction'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-2xl border border-[#e4e1db] bg-[#fbfcfb] px-3 text-sm outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-[#6d6d6d] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function toDraft(instruction: ServiceInstruction): Draft {
  return {
    title: instruction.title,
    body: instruction.body,
    active: instruction.active,
    sort_order: String(instruction.sort_order),
  }
}
