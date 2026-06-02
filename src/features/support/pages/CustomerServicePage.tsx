import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlinePaperClip,
  HiOutlinePaperAirplane,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlineUserCircle,
} from 'react-icons/hi2'
import { Badge, Button, Input, PageHeader, RSelect, Shimmer, Textarea, type SelectOption } from '@/components/ui'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import type { SupportPriority, SupportTicket, SupportTicketStatus } from '@/types/api'
import { supportApi } from '../api'

type PendingAttachment = {
  key: string
  name: string
  type: string
  previewUrl: string
}

const categoryOptions: SelectOption<string>[] = [
  { value: 'Payment', label: 'Payment' },
  { value: 'AI Usage', label: 'AI Usage' },
  { value: 'OCR Scan', label: 'OCR Scan' },
  { value: 'Account', label: 'Account' },
  { value: 'Bug Report', label: 'Bug Report' },
  { value: 'Feature Request', label: 'Feature Request' },
]

const priorityOptions: SelectOption<SupportPriority>[] = [
  { value: 'normal', label: 'Normal', description: 'General question or non-blocking issue.' },
  { value: 'high', label: 'High', description: 'Important issue affecting daily usage.' },
  { value: 'urgent', label: 'Urgent', description: 'Payment, access, or critical data issue.' },
]

const statusOptions: SelectOption<SupportTicketStatus | 'all'>[] = [
  { value: 'all', label: 'All tickets' },
  { value: 'open', label: 'Open' },
  { value: 'waiting_user', label: 'Waiting user' },
  { value: 'resolved', label: 'Resolved' },
]

export function CustomerServicePage() {
  const location = useLocation()
  const qc = useQueryClient()
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Payment')
  const [priority, setPriority] = useState<SupportPriority>('normal')
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [newAttachment, setNewAttachment] = useState<PendingAttachment | null>(null)
  const [replyAttachment, setReplyAttachment] = useState<PendingAttachment | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'all'>('all')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const ticketsQ = useQuery({
    queryKey: ['support-tickets', isAdmin, statusFilter],
    queryFn: () => supportApi.list({ admin: isAdmin, status: statusFilter }),
  })

  const tickets = ticketsQ.data ?? []
  const active = tickets.find((ticket) => ticket.id === activeId) ?? tickets[0] ?? null
  const openCount = tickets.filter((ticket) => ticket.status === 'open').length
  const waitingCount = tickets.filter((ticket) => ticket.status === 'waiting_user').length
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'resolved').length

  useEffect(() => {
    if (!activeId && tickets[0]) setActiveId(tickets[0].id)
    if (activeId && !tickets.some((ticket) => ticket.id === activeId)) setActiveId(tickets[0]?.id ?? null)
  }, [activeId, tickets])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [active?.id, active?.messages.length])

  const invalidateTickets = () => qc.invalidateQueries({ queryKey: ['support-tickets'] })

  const createTicket = useMutation({
    mutationFn: supportApi.create,
    onSuccess: (ticket) => {
      toast.success('Report sent. Our team will reply from this thread.')
      setSubject('')
      setMessage('')
      setNewAttachment(null)
      setCategory('Payment')
      setPriority('normal')
      setActiveId(ticket.id)
      invalidateTickets()
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const replyTicket = useMutation({
    mutationFn: ({ id, body, attachment }: { id: string; body: string; attachment?: PendingAttachment | null }) => supportApi.reply(id, {
      message: body,
      attachment_key: attachment?.key,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
    }, isAdmin),
    onSuccess: (ticket) => {
      setReply('')
      setReplyAttachment(null)
      setActiveId(ticket.id)
      invalidateTickets()
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicketStatus }) => supportApi.updateStatus(id, status),
    onSuccess: (ticket) => {
      setActiveId(ticket.id)
      invalidateTickets()
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const uploadAttachment = useMutation({
    mutationFn: ({ file }: { file: File; target: 'new' | 'reply' }) => supportApi.uploadAttachment(file, isAdmin),
    onSuccess: (upload, vars) => {
      const attachment: PendingAttachment = {
        key: upload.image,
        name: vars.file.name,
        type: vars.file.type,
        previewUrl: upload.preview_url,
      }
      if (vars.target === 'new') setNewAttachment(attachment)
      else setReplyAttachment(attachment)
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const submitTicket = () => {
    if (!subject.trim() || (!message.trim() && !newAttachment)) {
      toast.error('Please add a subject and a clear issue description.')
      return
    }
    createTicket.mutate({
      subject: subject.trim(),
      category,
      priority,
      message: message.trim(),
      attachment_key: newAttachment?.key,
      attachment_name: newAttachment?.name,
      attachment_type: newAttachment?.type,
    })
  }

  const sendReply = () => {
    if (!active || (!reply.trim() && !replyAttachment)) return
    replyTicket.mutate({ id: active.id, body: reply.trim(), attachment: replyAttachment })
  }

  const handleAttachmentFile = (file: File | undefined | null, target: 'new' | 'reply') => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or smaller.')
      return
    }
    uploadAttachment.mutate({ file, target })
  }

  const headline = useMemo(() => {
    if (isAdmin) return 'Prioritize user reports, reply with context, and resolve issues from one production inbox.'
    return 'Report payment, AI, OCR, account, or product issues directly to the SAKU support team.'
  }, [isAdmin])
  const activeLastMessage = active?.messages.at(-1)

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Service" subtitle={headline} />

      <section className="grid gap-3 md:grid-cols-4">
        <SupportMetric label="Open" value={String(openCount)} Icon={HiOutlineChatBubbleLeftRight} tone="blue" />
        <SupportMetric label="Waiting User" value={String(waitingCount)} Icon={HiOutlineClock} tone="amber" />
        <SupportMetric label="Resolved" value={String(resolvedCount)} Icon={HiOutlineCheckCircle} tone="emerald" />
        <SupportMetric label="Target SLA" value="24h" Icon={HiOutlineSparkles} tone="violet" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-6">
          {!isAdmin ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <HiOutlineDocumentText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">Create Report</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Add context, affected feature, and expected result so support can respond faster.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short subject" maxLength={120} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <RSelect value={category} onChange={(value) => setCategory(value ?? 'Payment')} options={categoryOptions} />
                  <RSelect value={priority} onChange={(value) => setPriority(value ?? 'normal')} options={priorityOptions} />
                </div>
                <Textarea
                  className="min-h-32"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened, which page you opened, and what result you expected."
                />
                <AttachmentPicker
                  attachment={newAttachment}
                  loading={uploadAttachment.isPending}
                  onPick={(file) => handleAttachmentFile(file, 'new')}
                  onClear={() => setNewAttachment(null)}
                />
                <Button
                  className="w-full"
                  loading={createTicket.isPending}
                  onClick={submitTicket}
                  leftIcon={<HiOutlinePaperAirplane className="h-4 w-4" />}
                >
                  Send Report
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-slate-950">{isAdmin ? 'Support Inbox' : 'My Reports'}</h2>
                <button
                  type="button"
                  onClick={() => ticketsQ.refetch()}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  aria-label="Refresh support tickets"
                >
                  <HiOutlineArrowPath className={`h-4 w-4 ${ticketsQ.isFetching ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <RSelect value={statusFilter} onChange={(value) => setStatusFilter(value ?? 'all')} options={statusOptions} />
            </div>

            <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
              {ticketsQ.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => <Shimmer key={index} className="h-20 rounded-xl" />)
              ) : tickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                  <HiOutlineChatBubbleLeftRight className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No tickets yet.</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <TicketButton
                    key={ticket.id}
                    ticket={ticket}
                    active={active?.id === ticket.id}
                    onClick={() => setActiveId(ticket.id)}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {active ? (
            <div className="flex h-[min(780px,calc(100dvh-180px))] min-h-[640px] flex-col max-xl:h-auto max-xl:min-h-[660px]">
              <div className="shrink-0 border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-black text-slate-950">{active.subject}</h2>
                      <StatusBadge status={active.status} />
                      <PriorityBadge priority={active.priority} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {active.id} · {active.user_name || 'User'} · {active.user_email || '-'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Opened {new Date(active.created_at).toLocaleString('id-ID')} · Updated {new Date(active.updated_at).toLocaleString('id-ID')}
                    </p>
                    {activeLastMessage ? (
                      <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                        Last message: {activeLastMessage.body || activeLastMessage.attachment_name || 'Attachment'}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    {isAdmin ? (
                    <div className="min-w-[190px]">
                      <RSelect<SupportTicketStatus>
                        value={active.status}
                        onChange={(value) => value && updateStatus.mutate({ id: active.id, status: value })}
                        options={statusOptions.filter((option) => option.value !== 'all') as SelectOption<SupportTicketStatus>[]}
                        isDisabled={updateStatus.isPending}
                      />
                    </div>
                    ) : null}
                    {isAdmin && active.status !== 'resolved' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                        loading={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: active.id, status: 'resolved' })}
                        leftIcon={<HiOutlineCheckCircle className="h-4 w-4" />}
                      >
                        Mark solved
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-smooth bg-slate-50/70 p-5">
                {active.priority === 'urgent' && active.status !== 'resolved' ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Urgent ticket. Include screenshots, order ID, or transaction IDs when available.</span>
                  </div>
                ) : null}
                {active.messages.map((item) => (
                  <div key={item.id} className={`flex items-end gap-3 ${item.role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    {item.role === 'admin' ? <ChatAvatar role="admin" /> : null}
                    <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${item.role === 'admin' ? 'rounded-bl-md border border-slate-100 bg-white text-slate-800' : 'rounded-br-md bg-brand-600 text-white'}`}>
                      <div className={`mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide ${item.role === 'admin' ? 'text-brand-600' : 'text-white/70'}`}>
                        <span>{item.role === 'admin' ? 'SAKU Support' : active.user_name || 'User'}</span>
                      </div>
                      {item.body ? <p className="whitespace-pre-wrap">{item.body}</p> : null}
                      {item.attachment_url ? (
                        <a href={item.attachment_url} target="_blank" rel="noreferrer" className={`mt-2 block overflow-hidden rounded-xl border ${item.role === 'admin' ? 'border-slate-200 bg-slate-50' : 'border-white/30 bg-white/10'}`}>
                          <img src={item.attachment_url} alt={item.attachment_name || 'Support attachment'} className="max-h-64 w-full object-cover transition duration-200 hover:scale-[1.01]" />
                          <span className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold ${item.role === 'admin' ? 'text-slate-500' : 'text-white/75'}`}>
                            <HiOutlinePaperClip className="h-4 w-4" />
                            {item.attachment_name || 'Attachment'}
                          </span>
                        </a>
                      ) : null}
                      <p className={`mt-2 text-[10px] ${item.role === 'admin' ? 'text-slate-400' : 'text-white/70'}`}>
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {item.role !== 'admin' ? <ChatAvatar role="user" /> : null}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {active.status !== 'resolved' ? (
                <div className="shrink-0 border-t border-slate-100 bg-white/95 p-4 backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Textarea
                        className="min-h-12 resize-none"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder={isAdmin ? 'Write an admin reply...' : 'Add more details or reply to support...'}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            sendReply()
                          }
                        }}
                      />
                      <AttachmentPicker
                        compact
                        attachment={replyAttachment}
                        loading={uploadAttachment.isPending}
                        onPick={(file) => handleAttachmentFile(file, 'reply')}
                        onClear={() => setReplyAttachment(null)}
                      />
                    </div>
                    <Button
                      className="sm:w-auto"
                      loading={replyTicket.isPending}
                      onClick={sendReply}
                      leftIcon={<HiOutlinePaperAirplane className="h-4 w-4" />}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="shrink-0 border-t border-slate-100 bg-emerald-50/80 p-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-sm font-semibold text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
                    <span className="inline-flex items-center gap-2">
                      <HiOutlineCheckCircle className="h-5 w-5" />
                      This issue has been marked as solved.
                    </span>
                  {isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: active.id, status: 'open' })}
                    >
                      Reopen
                    </Button>
                  ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-[560px] place-items-center p-8 text-center">
              <div>
                <HiOutlineChatBubbleLeftRight className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Select a ticket to open the conversation.</p>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}

function AttachmentPicker({
  attachment,
  loading,
  compact,
  onPick,
  onClear,
}: {
  attachment: PendingAttachment | null
  loading?: boolean
  compact?: boolean
  onPick: (file: File | undefined | null) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2">
      {attachment ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <img src={attachment.previewUrl} alt={attachment.name} className="h-12 w-12 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">{attachment.name}</p>
            <p className="text-[11px] text-slate-400">Attached image</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-rose-600"
            aria-label="Remove attachment"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ${compact ? 'py-2' : 'py-3'}`}>
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <HiOutlinePhoto className="h-4 w-4" />
        )}
        {attachment ? 'Replace image' : 'Attach image'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={loading}
          onChange={(event) => {
            onPick(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

function ChatAvatar({ role }: { role: 'admin' | 'user' }) {
  const isAdmin = role === 'admin'
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-sm ${isAdmin ? 'bg-white text-brand-700' : 'bg-slate-900 text-white'}`}>
      {isAdmin ? <HiOutlineUserCircle className="h-5 w-5" /> : <span className="text-xs font-black">U</span>}
    </span>
  )
}

function TicketButton({ ticket, active, onClick }: { ticket: SupportTicket; active: boolean; onClick: () => void }) {
  const lastMessage = ticket.messages.at(-1)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border px-3 py-3 text-left transition ${
        active ? 'border-brand-200 bg-brand-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-1 text-sm font-bold text-slate-900">{ticket.subject}</p>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
        {lastMessage?.body || lastMessage?.attachment_name || 'No message preview'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{ticket.category}</span>
        <PriorityBadge priority={ticket.priority} />
        <span>{ticket.user_name || 'User'}</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-400">
        Updated {new Date(ticket.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
      </p>
    </button>
  )
}

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  const label = status === 'open' ? 'Open' : status === 'waiting_user' ? 'Waiting User' : 'Resolved'
  return <Badge tone={status === 'resolved' ? 'green' : status === 'waiting_user' ? 'amber' : 'blue'}>{label}</Badge>
}

function PriorityBadge({ priority }: { priority: SupportPriority }) {
  return <Badge tone={priority === 'urgent' ? 'red' : priority === 'high' ? 'amber' : 'gray'}>{priority}</Badge>
}

function SupportMetric({ label, value, Icon, tone }: { label: string; value: string; Icon: typeof HiOutlineChatBubbleLeftRight; tone: 'blue' | 'amber' | 'emerald' | 'violet' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black text-slate-950">{value}</p>
    </div>
  )
}

export default CustomerServicePage
