import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePencilSquare,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiMicrophone,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineUser,
} from 'react-icons/hi2'
import { aiApi } from '@/features/ai/api'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import { CurrencyInput, RSelect, type SelectOption, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import type { TransactionType } from '@/types/api'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

/* ─────────────────────────── Types ─────────────────────────── */

type AIMode = 'nlp' | 'chatbot'

interface ExtractedTx {
  amount?: number
  type?: TransactionType
  category?: string
  merchant_name?: string
  confidence?: number
  description?: string
}

interface TxForm {
  wallet_id: string
  category_id: string
  amount: number
  type: TransactionType
  merchant_name: string
  description: string
  transaction_date: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'transaction-review' | 'batch-actions'
  extractedData?: ExtractedTx
  form?: TxForm
  /** Set when this message belongs to a multi-transaction batch. */
  batchId?: string
  /** Whether the review card is selected for bulk save (defaults to true). */
  selected?: boolean
  /** True once the underlying transaction has been persisted. */
  saved?: boolean
}

interface ChatSession {
  id: string
  mode: AIMode
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const SESSIONS_KEY_PREFIX = 'saku_ai_sessions_v3:'
const ACTIVE_KEY_PREFIX = 'saku_ai_active_session_v3:'

function sessionsKey(userId: string | null | undefined) {
  return SESSIONS_KEY_PREFIX + (userId || 'anon')
}
function activeKey(userId: string | null | undefined) {
  return ACTIVE_KEY_PREFIX + (userId || 'anon')
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadSessions(userId: string | null | undefined): ChatSession[] {
  try {
    const raw = localStorage.getItem(sessionsKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveSessions(userId: string | null | undefined, sessions: ChatSession[]) {
  try {
    localStorage.setItem(sessionsKey(userId), JSON.stringify(sessions.slice(0, 100)))
  } catch {
    /* quota — ignore */
  }
}

function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'Chat baru'
  const t = firstUser.content.trim().replace(/\s+/g, ' ')
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

function groupSessionsByDate(sessions: ChatSession[]) {
  // Today → "Hari ini". Older days → "Senin, 17 Mei 2026".
  const map = new Map<number, { label: string; items: ChatSession[] }>()
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const now = new Date()
  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  for (const s of sessions) {
    const d = new Date(s.updatedAt)
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const label = key === todayKey
      ? 'Hari ini'
      : `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
    const existing = map.get(key)
    if (existing) existing.items.push(s)
    else map.set(key, { label, items: [s] })
  }
  // newest day first
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, v]) => v)
}

/** Sanitise model output: strip code fences, parse JSON wrappers, return prose. */
function cleanReply(reply: string): string {
  let t = (reply ?? '').trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json|JSON)?\s*\n?/, '')
    t = t.replace(/\n?```\s*$/, '')
    t = t.trim()
  }
  if (t.startsWith('{') && t.endsWith('}')) {
    try {
      const obj = JSON.parse(t) as Record<string, unknown>
      for (const key of ['message', 'reply', 'answer', 'response', 'text']) {
        const v = obj[key]
        if (typeof v === 'string' && v.trim()) return v.trim()
      }
      return 'Maaf, saya belum bisa memberikan jawaban yang tepat. Coba tanyakan ulang.'
    } catch {
      /* fallthrough */
    }
  }
  return t
}

const NLP_EXAMPLES = [
  'beli nasi padang 35rb',
  'gaji freelance 3juta',
  'bayar listrik 450ribu',
  'beli bensin 50k',
  'bonus kantor 5jt',
]

const CHAT_EXAMPLES = [
  'Berapa total pengeluaran bulan ini?',
  'Kategori apa yang paling banyak?',
  'Tips hemat untuk anak kost?',
  'Bandingkan pengeluaran bulan ini vs lalu',
]

/* ─────────────────────────── Speech ─────────────────────────── */

interface SpeechRecognitionLike {
  start: () => void
  stop: () => void
  abort: () => void
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
}

function getSpeechCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | null
}

/* ─────────────────────────── Avatar ─────────────────────────── */

function UserAvatar({ photoUrl, name }: { photoUrl?: string; name?: string }) {
  const initial = (name?.trim()?.[0] ?? 'U').toUpperCase()
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? 'User'}
        className="h-7 w-7 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    )
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
      {initial}
    </div>
  )
}

/* ─────────────────────────── Transaction Review Card ─────────────────────────── */

function TransactionReviewCard({
  message,
  walletOptions,
  categoryOptions,
  onSave,
  onReset,
  onFormChange,
  onToggleSelect,
  isSaving,
}: {
  message: Message
  walletOptions: SelectOption[]
  categoryOptions: (type: TransactionType) => SelectOption[]
  onSave: (form: TxForm) => void
  onReset: () => void
  onFormChange: (form: TxForm) => void
  onToggleSelect?: () => void
  isSaving: boolean
}) {
  const t = useT()
  const form = message.form as TxForm
  const filteredCats = categoryOptions(form.type)
  const conf = message.extractedData?.confidence ?? 0
  const isBatch = !!message.batchId
  const saved = !!message.saved
  const selected = message.selected !== false
  const update = (patch: Partial<TxForm>) => onFormChange({ ...form, ...patch })
  const invalid = !form.wallet_id || !form.category_id || form.amount <= 0

  return (
    <div
      className={cn(
        'relative mt-3 overflow-hidden rounded-xl border bg-white transition',
        saved
          ? 'border-emerald-200 ring-1 ring-emerald-100'
          : isBatch && selected && invalid
            ? 'border-amber-200 ring-1 ring-amber-100'
            : isBatch && selected
              ? 'border-brand-200 ring-1 ring-brand-100'
              : 'border-slate-200',
      )}
    >
      {saved ? (
        <div className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          ✓ Tersimpan
        </div>
      ) : null}

      <div
        className={cn(
          'border-b px-4 py-3',
          saved ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-slate-50',
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isBatch && !saved ? (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onToggleSelect}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  aria-label="Pilih transaksi untuk disimpan"
                />
                <span>{selected ? 'Akan disimpan' : 'Lewati'}</span>
              </label>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Yang AI Tangkap
              </span>
            )}
          </div>
          {!saved ? (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                conf >= 0.8
                  ? 'bg-emerald-50 text-emerald-700'
                  : conf >= 0.5
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700',
              )}
            >
              {(conf * 100).toFixed(0)}% confidence
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          {[
            {
              label: 'Nominal',
              value: `Rp ${(message.extractedData?.amount ?? 0).toLocaleString('id-ID')}`,
            },
            {
              label: 'Tipe',
              value:
                message.extractedData?.type === 'income' ? t.transactions.income : t.transactions.expense,
            },
            { label: 'Kategori', value: message.extractedData?.category ?? '-' },
            { label: 'Merchant', value: message.extractedData?.merchant_name || '-' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="truncate text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={cn('px-4 py-4', saved && 'pointer-events-none opacity-60')}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Review & Konfirmasi
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <RSelect
              label="Tipe"
              value={form.type}
              options={[
                { value: 'expense', label: t.transactions.expense },
                { value: 'income', label: t.transactions.income },
              ]}
              onChange={(v) => update({ type: (v as TransactionType) ?? 'expense' })}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Nominal</label>
              <CurrencyInput
                value={form.amount}
                onChange={(val) => update({ amount: val })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              aria-label="Tanggal Transaksi"
              value={form.transaction_date}
              onChange={(e) => update({ transaction_date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <RSelect
            label="Dompet"
            value={form.wallet_id}
            options={walletOptions}
            onChange={(v) => update({ wallet_id: v ?? '' })}
          />
          <RSelect
            label="Kategori"
            value={form.category_id}
            options={filteredCats}
            onChange={(v) => update({ category_id: v ?? '' })}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Merchant</label>
            <input
              type="text"
              value={form.merchant_name}
              onChange={(e) => update({ merchant_name: e.target.value })}
              placeholder="Nama toko / sumber"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <Textarea
            label="Deskripsi (Opsional)"
            value={form.description || ''}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Catatan tambahan..."
            rows={2}
          />
        </div>

        {!saved ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={onReset}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {isBatch ? 'Hapus dari daftar' : 'Batal'}
            </button>
            {!isBatch ? (
              <button
                onClick={() => onSave(form)}
                disabled={isSaving || invalid}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
              >
                {isSaving ? 'Menyimpan…' : 'Simpan Transaksi'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ─────────────────────────── Batch Actions Card ─────────────────────────── */

function BatchActionsCard({
  batchId,
  messages,
  onBulkSave,
  onBulkCancel,
  onSelectAll,
  isSaving,
}: {
  batchId: string
  messages: Message[]
  onBulkSave: (batchId: string) => void
  onBulkCancel: (batchId: string) => void
  onSelectAll: (batchId: string, value: boolean) => void
  isSaving: boolean
}) {
  const reviews = messages.filter(
    (m) => m.batchId === batchId && m.type === 'transaction-review',
  )
  const remaining = reviews.filter((m) => !m.saved)
  const selectedCount = remaining.filter((m) => m.selected !== false).length
  const savedCount = reviews.length - remaining.length
  const allSelected = remaining.length > 0 && selectedCount === remaining.length
  if (reviews.length === 0) return null

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-linear-to-br from-brand-50 to-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(batchId, e.target.checked)}
              disabled={remaining.length === 0 || isSaving}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              aria-label="Pilih semua transaksi"
            />
            {allSelected ? 'Pilih semua' : 'Pilih semua'}
          </label>
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-brand-700">{selectedCount}</span>{' '}
            dari {remaining.length} dipilih
            {savedCount > 0 ? (
              <span className="ml-2 text-emerald-600">· {savedCount} tersimpan</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulkCancel(batchId)}
            disabled={isSaving || remaining.length === 0}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Batalkan semua
          </button>
          <button
            onClick={() => onBulkSave(batchId)}
            disabled={isSaving || selectedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {isSaving ? 'Menyimpan…' : `Simpan terpilih (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Sidebar ─────────────────────────── */

function ChatSidebar({
  sessions,
  activeId,
  activeMode,
  onSelect,
  onNew,
  onSwitchMode,
  onDelete,
  onClose,
  mobileOpen,
}: {
  sessions: ChatSession[]
  activeId: string | null
  activeMode: AIMode
  onSelect: (id: string) => void
  onNew: (mode: AIMode) => void
  onSwitchMode: (mode: AIMode) => void
  onDelete: (id: string) => void
  onClose: () => void
  mobileOpen: boolean
}) {
  const groups = useMemo(() => groupSessionsByDate(sessions), [sessions])

  return (
    <>
      {mobileOpen ? (
        <button
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          aria-label="Tutup sidebar"
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-slate-50 transition-transform md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">Riwayat Chat</div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-200 md:hidden"
            aria-label="Tutup"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          <button
            onClick={() => onNew(activeMode)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <HiOutlinePencilSquare className="h-4 w-4" /> Chat baru
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSwitchMode('nlp')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition',
                activeMode === 'nlp'
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              <HiOutlineSparkles className="h-4 w-4" /> NLP
            </button>
            <button
              onClick={() => onSwitchMode('chatbot')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition',
                activeMode === 'chatbot'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              <HiOutlineChatBubbleLeftRight className="h-4 w-4" /> Chatbot
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessions.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">
              Belum ada percakapan. Mulai chat baru di atas.
            </p>
          ) : null}

          {groups.map((g) => (
            <SessionGroup
              key={g.label}
              label={g.label}
              items={g.items}
              activeId={activeId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}        </div>
      </aside>
    </>
  )
}

function SessionGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  label: string
  items: ChatSession[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-3">
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((s) => {
          const active = s.id === activeId
          return (
            <li key={s.id}>
              <div
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition',
                  active
                    ? 'bg-white shadow-sm ring-1 ring-brand-200'
                    : 'hover:bg-white',
                )}
              >
                <button
                  onClick={() => onSelect(s.id)}
                  className="flex flex-1 items-center gap-2 truncate text-left"
                >
                  {s.mode === 'nlp' ? (
                    <HiOutlineSparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  ) : (
                    <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  <span
                    className={cn(
                      'truncate',
                      active ? 'font-semibold text-slate-900' : 'text-slate-600',
                    )}
                  >
                    {s.title}
                  </span>
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  className="rounded p-1 text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                  aria-label="Hapus"
                  title="Hapus chat"
                >
                  <HiOutlineTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ─────────────────────────── Main page ─────────────────────────── */

export function FreeTextPage() {
  const t = useT()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  /* Re-load when the signed-in user changes (prevents leak across users) */
  useEffect(() => {
    const loaded = loadSessions(user?.id)
    setSessions(loaded)
    const savedActive = localStorage.getItem(activeKey(user?.id))
    setActiveId(
      savedActive && loaded.some((s) => s.id === savedActive)
        ? savedActive
        : loaded[0]?.id ?? null,
    )
  }, [user?.id])
  const [text, setText] = useState('')
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [listening, setListening] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
  })

  /* Persist sessions */
  useEffect(() => {
    saveSessions(user?.id, sessions)
  }, [sessions, user?.id])
  useEffect(() => {
    if (activeId) localStorage.setItem(activeKey(user?.id), activeId)
  }, [activeId, user?.id])

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  )
  const mode: AIMode = active?.mode ?? 'nlp'
  const messages: Message[] = active?.messages ?? []

  /* Ensure there is at least one session.
   *
   * BUG history-disappears-on-reload: this effect used to have `[]` deps and
   * read `sessions` from the closure. On mount that closure value is the
   * initial empty array, so the effect would always create a fresh session
   * and immediately overwrite whatever the `[user?.id]` loader had just
   * placed into state (race between the two mount-effects). Solution: use
   * functional setState so we always inspect the *current* state, and key
   * the run on `user?.id` so it co-ordinates with the loader.
   */
  useEffect(() => {
    setSessions((prev) => {
      if (prev.length > 0) return prev
      const fresh: ChatSession = {
        id: uid(),
        mode: 'nlp',
        title: 'Chat baru',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setActiveId(fresh.id)
      return [fresh]
    })
  }, [user?.id])

  const updateActive = useCallback(
    (mut: (m: Message[]) => Message[]) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s
          const newMessages = mut(s.messages)
          return {
            ...s,
            messages: newMessages,
            title: deriveTitle(newMessages) || s.title,
            updatedAt: Date.now(),
          }
        }),
      )
    },
    [activeId],
  )

  const handleNew = (m: AIMode) => {
    const fresh: ChatSession = {
      id: uid(),
      mode: m,
      title: 'Chat baru',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSessions((prev) => [fresh, ...prev])
    setActiveId(fresh.id)
    setSidebarOpen(false)
    setText('')
  }

  // Switch to the most recent existing session of the given mode.
  // If none exists, create one. This is bound to the NLP / Chatbot quick-switch
  // buttons in the sidebar so users keep their conversation history when
  // toggling mode — only the explicit "Chat baru" button creates a fresh chat.
  const handleSwitchMode = (m: AIMode) => {
    const latest = [...sessions]
      .filter((s) => s.mode === m)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    if (latest) {
      setActiveId(latest.id)
      setSidebarOpen(false)
      setText('')
      return
    }
    handleNew(m)
  }

  const handleDelete = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (id === activeId) {
        setActiveId(next[0]?.id ?? null)
      }
      return next
    })
  }

  /* scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, activeId])

  /* textarea autosize */
  const adjustTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  /* category lookup */
  const findCategoryId = useCallback(
    (categoryName?: string): string | undefined => {
      if (!categoryName) return undefined
      return categories.data?.find(
        (c) =>
          c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(c.name.toLowerCase()),
      )?.id
    },
    [categories.data],
  )

  /* ─── Mutations ─── */
  const categorizeMutation = useMutation({
    mutationFn: (inputText: string) => aiApi.categorize({ text: inputText }),
    onSuccess: (data, inputText) => {
      // Prefer the multi-transaction array when the model returned one.
      // Fallback to the single top-level fields for older responses.
      const items =
        data.transactions && data.transactions.length > 0
          ? data.transactions
          : data.amount > 0 || data.merchant_name || data.category
            ? [
                {
                  amount: data.amount,
                  merchant_name: data.merchant_name,
                  category: data.category,
                  type: data.type,
                  confidence: data.confidence,
                  description: inputText,
                },
              ]
            : []

      if (items.length === 0) {
        updateActive((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content:
              'Maaf, saya belum berhasil menangkap detail transaksinya. Coba tulis lebih spesifik, misalnya: "beli bubur ayam 14rb" atau pisahkan dengan koma jika banyak transaksi.',
          },
        ])
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const isBatch = items.length > 1
      const batchId = isBatch ? uid() : undefined
      const defaultWallet =
        wallets.data?.find((w) => w.is_default)?.id ?? wallets.data?.[0]?.id ?? ''

      const intro: Message = {
        id: uid(),
        role: 'assistant',
        content: isBatch
          ? `Saya menangkap ${items.length} transaksi. Pilih yang ingin disimpan, lalu klik "Simpan terpilih".`
          : 'Silakan cek dan konfirmasi detailnya di bawah:',
      }
      const reviewMsgs: Message[] = items.map((item) => {
        const form: TxForm = {
          wallet_id: defaultWallet,
          category_id: findCategoryId(item.category) || '',
          amount: item.amount || 0,
          type: (item.type as TransactionType) || 'expense',
          merchant_name: item.merchant_name || '',
          description: item.description || inputText,
          transaction_date: today,
        }
        return {
          id: uid(),
          role: 'assistant',
          content: '',
          type: 'transaction-review',
          extractedData: {
            amount: item.amount,
            merchant_name: item.merchant_name,
            category: item.category,
            type: item.type,
            confidence: item.confidence,
            description: item.description,
          },
          form,
          batchId,
          selected: isBatch ? true : undefined,
        }
      })
      const batchActions: Message[] = isBatch
        ? [
            {
              id: uid(),
              role: 'assistant',
              content: '',
              type: 'batch-actions',
              batchId,
            },
          ]
        : []
      // Render order: intro → review cards → batch actions toolbar (at the bottom).
      updateActive((prev) => [...prev, intro, ...reviewMsgs, ...batchActions])
    },
    onError: (e) => {
      updateActive((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: `Maaf, terjadi kesalahan: ${toErrorMessage(e)}`,
        },
      ])
    },
  })

  const chatMutation = useMutation({
    mutationFn: (msg: string) => {
      // Send the last 6 textual turns so the AI can resolve follow-ups like
      // "buat list" or "format json" against the previous answer.
      const prior = (active?.messages ?? [])
        .filter(
          (m) =>
            (m.role === 'user' || m.role === 'assistant') &&
            m.type !== 'transaction-review' &&
            m.type !== 'batch-actions' &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0,
        )
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      return aiApi.chat({ message: msg, include_context: true, history: prior })
    },
    onSuccess: (data) => {
      updateActive((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: cleanReply(data.reply) },
      ])
    },
    onError: (e) => {
      updateActive((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: `Maaf, terjadi kesalahan: ${toErrorMessage(e)}`,
        },
      ])
    },
  })

  const saveMutation = useMutation({
    mutationFn: ({
      form,
      extractedData,
    }: {
      form: TxForm
      extractedData?: ExtractedTx
      messageId: string
      silent?: boolean
    }) => {
      const dateObj = form.transaction_date.includes('T')
        ? new Date(form.transaction_date)
        : new Date(form.transaction_date + 'T00:00:00')
      return transactionApi.create({
        wallet_id: form.wallet_id,
        category_id: form.category_id,
        amount: Number(form.amount),
        type: form.type,
        transaction_date: dateObj.toISOString(),
        source: 'ai_ocr' as const,
        confidence_score: extractedData?.confidence,
        ...(form.merchant_name && { merchant_name: form.merchant_name }),
        ...(form.description && { description: form.description }),
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      setSavingMessageId(null)
      updateActive((prev) =>
        prev.map((m) => (m.id === vars.messageId ? { ...m, saved: true } : m)),
      )
      if (!vars.silent) {
        toast.success('Transaksi tersimpan!')
        updateActive((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: 'Transaksi berhasil disimpan! Mau catat transaksi lain?',
          },
        ])
      }
    },
    onError: (e) => {
      toast.error(toErrorMessage(e))
      setSavingMessageId(null)
    },
  })

  /* ─── Bulk save (multi-transaction batch) ─── */
  const [bulkSavingBatchId, setBulkSavingBatchId] = useState<string | null>(null)
  const handleBulkSave = useCallback(
    async (batchId: string) => {
      const targets = (active?.messages ?? []).filter(
        (m) =>
          m.batchId === batchId &&
          m.type === 'transaction-review' &&
          m.selected &&
          !m.saved &&
          m.form,
      )
      if (targets.length === 0) {
        toast.error('Pilih minimal satu transaksi yang ingin disimpan.')
        return
      }
      // Validate each card has wallet + category + positive amount.
      const invalid = targets.find(
        (m) =>
          !m.form?.wallet_id ||
          !m.form?.category_id ||
          !m.form?.amount ||
          m.form.amount <= 0,
      )
      if (invalid) {
        toast.error('Lengkapi dompet, kategori, dan nominal pada setiap transaksi terpilih.')
        return
      }

      setBulkSavingBatchId(batchId)
      let ok = 0
      let fail = 0
      for (const msg of targets) {
        try {
          await saveMutation.mutateAsync({
            form: msg.form!,
            extractedData: msg.extractedData,
            messageId: msg.id,
            silent: true,
          })
          ok += 1
        } catch {
          fail += 1
        }
      }
      setBulkSavingBatchId(null)
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      if (ok > 0) toast.success(`${ok} transaksi tersimpan${fail > 0 ? `, ${fail} gagal` : ''}.`)
      else if (fail > 0) toast.error(`${fail} transaksi gagal disimpan.`)
      updateActive((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content:
            fail === 0
              ? `✓ ${ok} transaksi berhasil disimpan. Ada yang lain?`
              : `${ok} tersimpan, ${fail} gagal. Cek kembali kartu yang masih merah.`,
        },
      ])
    },
    [active?.messages, saveMutation, qc, updateActive],
  )

  const handleBulkCancel = useCallback(
    (batchId: string) => {
      updateActive((prev) =>
        prev.filter(
          (m) =>
            !(
              m.batchId === batchId &&
              (m.type === 'transaction-review' || m.type === 'batch-actions') &&
              !m.saved
            ),
        ),
      )
    },
    [updateActive],
  )

  const handleToggleSelect = useCallback(
    (messageId: string) => {
      updateActive((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, selected: !m.selected } : m,
        ),
      )
    },
    [updateActive],
  )

  const handleBatchSelectAll = useCallback(
    (batchId: string, value: boolean) => {
      updateActive((prev) =>
        prev.map((m) =>
          m.batchId === batchId && m.type === 'transaction-review' && !m.saved
            ? { ...m, selected: value }
            : m,
        ),
      )
    },
    [updateActive],
  )

  const handleUpdateForm = useCallback(
    (messageId: string, form: TxForm) => {
      updateActive((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, form } : m)),
      )
    },
    [updateActive],
  )

  const isPending = categorizeMutation.isPending || chatMutation.isPending

  /* ─── Send ─── */
  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isPending || !activeId) return
    updateActive((prev) => [...prev, { id: uid(), role: 'user', content: trimmed }])
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    if (mode === 'nlp') categorizeMutation.mutate(trimmed)
    else chatMutation.mutate(trimmed)
  }

  /* ─── Voice ─── */
  const speechCtor = useMemo(() => getSpeechCtor(), [])
  const startVoice = () => {
    if (!speechCtor) {
      toast.error('Browser ini belum mendukung Speech Recognition.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const rec = new speechCtor()
    rec.lang = 'id-ID'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      setText((finalText + interim).trimStart())
      adjustTextarea()
    }
    rec.onerror = () => {
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        /* ignore */
      }
    },
    [],
  )

  const walletOptions: SelectOption[] = (wallets.data ?? []).map((w) => ({
    value: w.id,
    label: w.name,
  }))
  const categoryOptions = (type: TransactionType): SelectOption[] =>
    (categories.data?.filter((c) => c.type === type) ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    }))

  const examples = mode === 'nlp' ? NLP_EXAMPLES : CHAT_EXAMPLES

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white md:h-[calc(100vh-4.5rem)]">
      <ChatSidebar
        sessions={sessions}
        activeId={activeId}
        activeMode={mode}
        onSelect={(id) => {
          setActiveId(id)
          setSidebarOpen(false)
        }}
        onNew={handleNew}
        onSwitchMode={handleSwitchMode}
        onDelete={handleDelete}
        onClose={() => setSidebarOpen(false)}
        mobileOpen={sidebarOpen}
      />

      {/* Main panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Buka sidebar"
            >
              <HiOutlineBars3 className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900">
                {active?.title ?? t.freeText.title}
              </h1>
              <p className="text-xs text-slate-400">
                {mode === 'nlp' ? 'NLP — pencatatan cepat' : 'Chatbot — tanya jawab'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleNew(mode)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat baru</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  {mode === 'nlp' ? (
                    <HiOutlineSparkles className="h-6 w-6 text-violet-500" />
                  ) : (
                    <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-emerald-500" />
                  )}
                </div>
                <h2 className="mb-1 text-sm font-semibold text-slate-800">
                  {mode === 'nlp'
                    ? 'NLP Mode — Pencatatan Cepat'
                    : 'Chatbot Mode — Tanya Jawab'}
                </h2>
                <p className="mb-6 max-w-sm text-xs leading-relaxed text-slate-400">
                  {mode === 'nlp'
                    ? 'Tulis transaksi dalam bahasa sehari-hari. AI akan mengekstrak nominal, kategori, dan tipe otomatis.'
                    : 'Tanya tentang keuangan kamu — saya akan menjawab dengan ringkas berdasarkan transaksi terakhir.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setText(ex)
                        textareaRef.current?.focus()
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    AI
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-sm lg:max-w-md',
                    msg.role === 'user' ? 'flex flex-col items-end' : '',
                  )}
                >
                  {msg.content ? (
                    <div
                      className={cn(
                        'whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-800',
                      )}
                    >
                      {msg.content}
                    </div>
                  ) : null}

                  {msg.type === 'batch-actions' && msg.batchId && (
                    <BatchActionsCard
                      batchId={msg.batchId}
                      messages={active?.messages ?? []}
                      onBulkSave={handleBulkSave}
                      onBulkCancel={handleBulkCancel}
                      onSelectAll={handleBatchSelectAll}
                      isSaving={bulkSavingBatchId === msg.batchId}
                    />
                  )}

                  {msg.type === 'transaction-review' && msg.extractedData && msg.form && (
                    <TransactionReviewCard
                      message={msg}
                      walletOptions={walletOptions}
                      categoryOptions={categoryOptions}
                      isSaving={
                        (savingMessageId === msg.id && saveMutation.isPending) ||
                        (!!msg.batchId && bulkSavingBatchId === msg.batchId)
                      }
                      onSave={(form) => {
                        setSavingMessageId(msg.id)
                        saveMutation.mutate({
                          form,
                          extractedData: msg.extractedData,
                          messageId: msg.id,
                        })
                      }}
                      onReset={() =>
                        updateActive((prev) => prev.filter((m) => m.id !== msg.id))
                      }
                      onFormChange={(form) => handleUpdateForm(msg.id, form)}
                      onToggleSelect={
                        msg.batchId ? () => handleToggleSelect(msg.id) : undefined
                      }
                    />
                  )}
                </div>

                {msg.role === 'user' && (
                  <UserAvatar photoUrl={user?.photo_url} name={user?.name} />
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  AI
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-4 sm:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  adjustTextarea()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={
                  mode === 'nlp' ? 'Tulis transaksi kamu...' : 'Ketik pesan...'
                }
                rows={1}
                className="max-h-40 min-h-6 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />

              {speechCtor ? (
                <button
                  onClick={startVoice}
                  title={listening ? 'Hentikan rekam' : 'Rekam suara'}
                  aria-label="Voice input"
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition',
                    listening
                      ? 'border-rose-300 bg-rose-50 text-rose-600 animate-pulse'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600',
                  )}
                >
                  <HiMicrophone className="h-4 w-4" />
                </button>
              ) : null}

              <button
                onClick={handleSend}
                disabled={!text.trim() || isPending}
                aria-label="Kirim"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition',
                  text.trim() && !isPending
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400',
                )}
              >
                <HiOutlinePaperAirplane className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <HiOutlineUser className="h-3 w-3" />
              Enter untuk kirim · Shift+Enter baris baru ·{' '}
              {speechCtor ? 'mic untuk suara' : 'mic tidak didukung'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
