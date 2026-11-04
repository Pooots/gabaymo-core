import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { LoaderCircle, Plus, X } from 'lucide-react'

import { MessageScroller } from '@/routes/MessageScroller'
import { memberError } from '@/services/memberAuth'
import {
  createMemberTicket,
  fetchMemberThread,
  fetchMemberTickets,
  sendMemberMessage,
  type MemberTicket,
  type TicketChatMessage,
} from '@/services/tickets'

export function MemberTickets() {
  const [rows, setRows] = useState<MemberTicket[] | null>(null)
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [threadId, setThreadId] = useState<number | null>(null)

  useEffect(() => {
    void fetchMemberTickets()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && !saving) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, saving])

  function close() {
    if (saving) return
    setOpen(false)
    setError('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const ticket = await createMemberTicket({ subject: subject.trim(), body: body.trim() })
      setRows((current) => [ticket, ...(current ?? [])])
      setSubject('')
      setBody('')
      setOpen(false)
    } catch (reason) {
      setError(memberError(reason))
    } finally {
      setSaving(false)
    }
  }

  if (threadId !== null) {
    const selected = rows?.find((ticket) => ticket.id === threadId) ?? null
    return <MemberThread ticketId={threadId} fallback={selected} onBack={() => setThreadId(null)} />
  }

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">TICKETS</p>
          <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">Your tickets</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c6b63]">
            Questions you send to the partner desk. A ticket stays open until a lawyer takes it.
          </p>
        </div>
        <button type="button" className="btn-primary h-11" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add ticket
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-[#e6eeea] bg-white">
        {rows === null ? (
          <p className="px-6 py-14 text-center text-sm text-[#6d6d6d]">Loading your tickets…</p>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-[#6d6d6d]">You have not submitted a ticket.</p>
            <button type="button" className="btn-primary mt-5 h-11" onClick={() => setOpen(true)}>
              <Plus size={16} />
              Add ticket
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#eef2ef] text-[11px] font-semibold tracking-[0.14em] text-[#8a978f]">
              <tr>
                <th className="px-5 py-3 font-semibold">SUBJECT</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">STATUS</th>
                <th className="px-5 py-3 text-right font-semibold">OPENED</th>
                <th className="px-5 py-3 text-right font-semibold">CHAT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[#f3f6f4] last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#142019]">{ticket.subject}</p>
                    <p className="mt-1 line-clamp-2 text-[#5c6b63]">{ticket.body}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#e7f3ec] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#0e6b3e] uppercase sm:hidden">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <span className="rounded-full bg-[#e7f3ec] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#0e6b3e] uppercase">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-xs whitespace-nowrap text-[#8a978f]">
                    {when(ticket.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {ticket.status === 'accepted' ? (
                      <button type="button" className="btn-primary h-9" onClick={() => setThreadId(ticket.id)}>
                        Open chat
                      </button>
                    ) : (
                      <span className="text-xs text-[#8a978f]">Waiting</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-[#142019]/45" aria-label="Close" onClick={close} />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-dialog-title"
            autoComplete="off"
            onSubmit={(event) => void onSubmit(event)}
            className="relative z-10 w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_70px_-36px_rgba(18,48,32,0.55)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="ticket-dialog-title" className="serif text-2xl font-medium tracking-[-0.03em]">
                New ticket
              </h2>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-[#5c6b63] hover:bg-[#f3f6f4]"
                aria-label="Close"
                onClick={close}
              >
                <X size={16} />
              </button>
            </div>
            <label className="mt-5 block text-sm font-medium" htmlFor="ticket-subject">
              Subject
            </label>
            <input
              id="ticket-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={160}
              autoComplete="off"
              placeholder="Which rule needs a lawyer?"
              className="mt-2 h-11 w-full rounded-2xl border border-[#e1ebe4] bg-[#fbfcfb] px-4 text-sm outline-none focus:border-[#0e6b3e]"
            />
            <label className="mt-4 block text-sm font-medium" htmlFor="ticket-body">
              What should the lawyer review?
            </label>
            <textarea
              id="ticket-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={4000}
              rows={5}
              placeholder="Describe the question and what you already checked."
              className="mt-2 w-full resize-none rounded-2xl border border-[#e1ebe4] bg-[#fbfcfb] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#0e6b3e]"
            />
            {error ? <p className="mt-3 text-sm text-[#9b3b3b]">{error}</p> : null}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" className="h-11 rounded-full px-4 text-sm font-medium text-[#5c6b63]" onClick={close}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary h-11">
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                Submit ticket
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function MemberThread({
  ticketId,
  fallback,
  onBack,
}: {
  ticketId: number
  fallback: MemberTicket | null
  onBack: () => void
}) {
  const [ticket, setTicket] = useState<MemberTicket | null>(fallback)
  const [messages, setMessages] = useState<TicketChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const sendingLock = useRef(false)
  const open = ticket?.status === 'accepted'

  useEffect(() => {
    let stop = false
    async function load() {
      try {
        const data = await fetchMemberThread(ticketId)
        if (stop) return
        setTicket(data.ticket)
        setMessages(data.messages)
      } catch (reason) {
        if (!stop) setError(memberError(reason))
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 4000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [ticketId])

  async function onSubmit(event: FormEvent | KeyboardEvent<HTMLTextAreaElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sendingLock.current || !open) return
    sendingLock.current = true
    setSending(true)
    setError('')
    try {
      const message = await sendMemberMessage(ticketId, text)
      setMessages((current) => [...current, message])
      setDraft('')
    } catch (reason) {
      setError(memberError(reason))
    } finally {
      sendingLock.current = false
      setSending(false)
    }
  }

  function onEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    void onSubmit(event)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-[#e7e1d6] px-5 py-4 sm:px-8">
        <button type="button" className="text-sm font-medium text-[#0e6b3e]" onClick={onBack}>
          Your tickets
        </button>
        <h1 className="serif mt-2 text-3xl font-medium tracking-[-0.03em]">
          {ticket?.subject ?? 'Conversation'}
        </h1>
        <p className="mt-1 text-sm text-[#5c6b63]">
          {ticket?.partner_name ? 'With Gabaymo Partner' : 'Waiting for a partner to accept this ticket.'}
        </p>
      </div>
      <MessageScroller watch={`${ticket?.id ?? 0}:${messages.at(-1)?.id ?? 0}`}>
        {ticket ? <Bubble mine name="You" body={ticket.body} time={ticket.created_at} /> : null}
        {messages.map((message) => (
          <Bubble
            key={message.id}
            mine={message.mine}
            name={message.mine ? 'You' : 'Gabaymo Partner'}
            body={message.body}
            time={message.created_at}
          />
        ))}
      </MessageScroller>
      <form onSubmit={(event) => void onSubmit(event)} className="border-t border-[#e7e1d6] px-5 py-4 sm:px-8">
        {error ? <p className="mb-2 text-sm text-[#9b3b3b]">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onEnter}
            rows={2}
            required
            maxLength={4000}
            disabled={!open}
            placeholder={open ? 'Reply to your lawyer' : 'Chat opens after a partner accepts'}
            className="min-h-12 flex-1 resize-none rounded-2xl border border-[#e1ebe4] bg-white px-4 py-3 text-sm outline-none focus:border-[#0e6b3e] disabled:bg-[#f6f4ef]"
          />
          <button type="submit" disabled={sending || !draft.trim() || !open} className="btn-primary h-11">
            {sending ? <LoaderCircle size={16} className="animate-spin" /> : null}
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({ mine, name, body, time }: { mine: boolean; name: string; body: string; time: string | null }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${mine ? 'bg-[#0e6b3e] text-white' : 'bg-white text-[#24312a]'}`}>
        <p className={`text-[11px] font-semibold tracking-[0.12em] ${mine ? 'text-white/70' : 'text-[#0e6b3e]'}`}>{name}</p>
        <p className="mt-1 text-sm leading-relaxed">{body}</p>
        <p className={`mt-2 text-[11px] ${mine ? 'text-white/60' : 'text-[#8a978f]'}`}>{when(time)}</p>
      </div>
    </div>
  )
}

function when(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}
