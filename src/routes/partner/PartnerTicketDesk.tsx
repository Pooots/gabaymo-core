import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { LoaderCircle, Search } from 'lucide-react'

import { MessageScroller } from '@/routes/MessageScroller'
import {
  acceptPartnerTicket,
  fetchAcceptedTickets,
  fetchPartnerThread,
  fetchPartnerTickets,
  partnerError,
  sendPartnerMessage,
  type PartnerTicket,
  type TicketChatMessage,
} from '@/services/partners'

export function PartnerTickets() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<PartnerTicket[] | null>(null)
  const [query, setQuery] = useState('')
  const [accepting, setAccepting] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchPartnerTickets()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  const needle = query.trim().toLowerCase()
  const visible = (rows ?? []).filter((ticket) => {
    if (!needle) return true
    return [ticket.subject, ticket.body, ticket.member_name, ticket.member_email, ticket.member_region, ticket.member_plan]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle))
  })

  async function accept(ticket: PartnerTicket) {
    setError('')
    setAccepting(ticket.id)
    try {
      await acceptPartnerTicket(ticket.id)
      setRows((current) => (current ?? []).filter((row) => row.id !== ticket.id))
      void navigate({
        to: '/partner/accepted/$ticketId',
        params: { ticketId: String(ticket.id) },
      })
    } catch (reason) {
      setError(partnerError(reason))
      setAccepting(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">INBOX</p>
          <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">Ticket inbox</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c6b63]">
            Open tickets from members. Accept one to start the conversation.
          </p>
        </div>
        <label className="flex h-11 w-full max-w-xs items-center gap-2 rounded-full border border-[#e6eeea] bg-white px-4 text-sm">
          <Search size={16} className="text-[#8a978f]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search subject or member"
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#8a978f]"
          />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm text-[#9b3b3b]">{error}</p> : null}
      {rows === null ? (
        <p className="mt-8 text-sm text-[#6d6d6d]">Loading tickets…</p>
      ) : visible.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[#e6eeea] bg-white px-6 py-16 text-center text-sm text-[#6d6d6d]">
          {rows.length === 0 ? 'No tickets are waiting.' : 'No tickets match that search.'}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visible.map((ticket) => (
            <article key={ticket.id} className="flex flex-col rounded-3xl border border-[#e6eeea] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0e6b3e] uppercase">Open</p>
                <p className="text-xs text-[#8a978f]">{when(ticket.created_at)}</p>
              </div>
              <h2 className="mt-2 text-lg font-semibold">{ticket.subject}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#3d4c44]">{ticket.body}</p>
              <p className="mt-4 text-sm text-[#5c6b63]">
                {ticket.member_name}
                {ticket.member_region ? ` · ${ticket.member_region}` : ''}
                {ticket.member_plan ? ` · ${ticket.member_plan}` : ''}
              </p>
              <button
                type="button"
                className="btn-primary mt-5 h-10 w-fit"
                disabled={accepting === ticket.id}
                onClick={() => void accept(ticket)}
              >
                {accepting === ticket.id ? <LoaderCircle size={16} className="animate-spin" /> : null}
                Accept
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function PartnerAccepted() {
  const [rows, setRows] = useState<PartnerTicket[] | null>(null)

  useEffect(() => {
    void fetchAcceptedTickets()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0e6b3e]">ACCEPTED</p>
      <h1 className="serif mt-2 text-4xl font-medium tracking-[-0.03em]">Your conversations</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c6b63]">
        Tickets you accepted. Open one to message the member who sent it.
      </p>
      {rows === null ? (
        <p className="mt-8 text-sm text-[#6d6d6d]">Loading accepted tickets…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[#e6eeea] bg-white px-6 py-16 text-center text-sm text-[#6d6d6d]">
          You have not accepted a ticket yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((ticket) => (
            <Link
              key={ticket.id}
              to="/partner/accepted/$ticketId"
              params={{ ticketId: String(ticket.id) }}
              className="rounded-3xl border border-[#e6eeea] bg-white p-5 hover:border-[#b7d7c4]"
            >
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0e6b3e]">ACCEPTED</p>
              <h2 className="mt-2 text-lg font-semibold">{ticket.subject}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-[#5c6b63]">{ticket.body}</p>
              <p className="mt-4 text-sm text-[#3d4c44]">
                {ticket.member_name}
                {ticket.member_region ? ` · ${ticket.member_region}` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function PartnerThread() {
  const { ticketId } = useParams({ strict: false })
  const id = Number(ticketId)
  const [ticket, setTicket] = useState<PartnerTicket | null>(null)
  const [messages, setMessages] = useState<TicketChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const sendingLock = useRef(false)

  useEffect(() => {
    if (!Number.isFinite(id)) return
    let stop = false
    async function load() {
      try {
        const data = await fetchPartnerThread(id)
        if (stop) return
        setTicket(data.ticket)
        setMessages(data.messages)
      } catch (reason) {
        if (!stop) setError(partnerError(reason))
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 4000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [id])

  async function onSubmit(event: FormEvent | KeyboardEvent<HTMLTextAreaElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !Number.isFinite(id) || sendingLock.current) return
    sendingLock.current = true
    setSending(true)
    setError('')
    try {
      const message = await sendPartnerMessage(id, text)
      setMessages((current) => [...current, message])
      setDraft('')
    } catch (reason) {
      setError(partnerError(reason))
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
    <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-[#e7e1d6] px-6 py-4 sm:px-8">
        <Link to="/partner/accepted" className="text-sm font-medium text-[#0e6b3e]">
          Accepted tickets
        </Link>
        <h1 className="serif mt-2 text-3xl font-medium tracking-[-0.03em]">
          {ticket?.subject ?? 'Conversation'}
        </h1>
        <p className="mt-1 text-sm text-[#5c6b63]">
          {ticket
            ? `${ticket.member_name}${ticket.member_region ? ` · ${ticket.member_region}` : ''}${ticket.member_email ? ` · ${ticket.member_email}` : ''}`
            : 'Loading the member…'}
        </p>
      </div>
      <MessageScroller watch={`${ticket?.id ?? 0}:${messages.at(-1)?.id ?? 0}`}>
        {ticket ? (
          <Bubble mine={false} name={ticket.member_name} body={ticket.body} time={ticket.created_at} />
        ) : null}
        {messages.map((message) => (
          <Bubble
            key={message.id}
            mine={message.mine}
            name={message.sender_name}
            body={message.body}
            time={message.created_at}
          />
        ))}
      </MessageScroller>
      <form onSubmit={(event) => void onSubmit(event)} className="border-t border-[#e7e1d6] px-6 py-4 sm:px-8">
        {error ? <p className="mb-2 text-sm text-[#9b3b3b]">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onEnter}
            rows={2}
            required
            maxLength={4000}
            placeholder={`Message ${ticket?.member_name ?? 'the member'}`}
            className="min-h-12 flex-1 resize-none rounded-2xl border border-[#e1ebe4] bg-white px-4 py-3 text-sm outline-none focus:border-[#0e6b3e]"
          />
          <button type="submit" disabled={sending || !draft.trim()} className="btn-primary h-11">
            {sending ? <LoaderCircle size={16} className="animate-spin" /> : null}
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({
  mine,
  name,
  body,
  time,
}: {
  mine: boolean
  name: string
  body: string
  time: string | null
}) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${mine ? 'bg-[#0e6b3e] text-white' : 'bg-white text-[#24312a]'}`}>
        <p className={`text-[11px] font-semibold tracking-[0.12em] ${mine ? 'text-white/70' : 'text-[#0e6b3e]'}`}>
          {name}
        </p>
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
