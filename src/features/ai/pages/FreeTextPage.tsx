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
  HiOutlineCheckCircle,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2'
import {
  RiSparklingLine,
  RiWalletLine,
} from 'react-icons/ri'
import { aiApi, aiLogApi } from '@/features/ai/api'
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
  logIds?: string[]
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function cleanMerchant(value?: string | null): string {
  const merchant = (value ?? '').trim()
  return merchant === '-' ? '' : merchant
}

function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'Chat baru'
  const t = firstUser.content.trim().replace(/\s+/g, ' ')
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

function chatSessionsFromLogs(logs: Awaited<ReturnType<typeof aiLogApi.list>>['data']): ChatSession[] {
  const groups = new Map<string, Awaited<ReturnType<typeof aiLogApi.list>>['data']>()
  logs
    .filter((log) => log.feature === 'chat' && log.status === 'success')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((log) => {
      const raw = log.raw_response ?? {}
      const sessionId = typeof raw.session_id === 'string' && raw.session_id.trim()
        ? raw.session_id.trim()
        : 'legacy-chat-history'
      groups.set(sessionId, [...(groups.get(sessionId) ?? []), log])
    })

  return Array.from(groups.entries()).map(([sessionId, rows]) => {
    const messages: Message[] = rows.flatMap((log) => {
        const raw = log.raw_response ?? {}
        const userMessage = typeof raw.message === 'string' ? raw.message.trim() : ''
        const reply = typeof raw.reply === 'string' ? cleanReply(raw.reply) : ''
        const createdAt = new Date(log.created_at).getTime()
        const out: Message[] = []
        if (userMessage) out.push({ id: `${log.id}-user-${createdAt}`, role: 'user', content: userMessage })
        if (reply) out.push({ id: `${log.id}-assistant-${createdAt}`, role: 'assistant', content: reply })
        return out
      })
    const first = rows[0]
    const latest = rows[rows.length - 1]
    return {
      id: sessionId,
      mode: 'chatbot',
      title: deriveTitle(messages),
      messages,
      createdAt: first ? new Date(first.created_at).getTime() : Date.now(),
      updatedAt: latest ? new Date(latest.updated_at || latest.created_at).getTime() : Date.now(),
      logIds: rows.map((log) => log.id),
    }
  })
}

function nlpSessionsFromLogs(logs: Awaited<ReturnType<typeof aiLogApi.list>>['data']): ChatSession[] {
  const groups = new Map<string, Awaited<ReturnType<typeof aiLogApi.list>>['data']>()
  logs
    .filter((log) => log.feature === 'categorize' && log.status === 'success')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((log) => {
      const raw = log.raw_response ?? {}
      const sessionId = typeof raw.session_id === 'string' && raw.session_id.trim()
        ? raw.session_id.trim()
        : 'legacy-nlp-history'
      groups.set(sessionId, [...(groups.get(sessionId) ?? []), log])
    })

  return Array.from(groups.entries()).map(([sessionId, sorted]) => {
    const messages: Message[] = sorted.flatMap((log) => {
      const raw = log.raw_response ?? {}
      const input = typeof raw.message === 'string' ? raw.message.trim() : ''
      const txs = Array.isArray(raw.transactions) ? raw.transactions : []
      const items = txs.length > 0
        ? txs
        : log.extracted_amount
          ? [{
              amount: log.extracted_amount,
              merchant_name: cleanMerchant(log.extracted_merchant),
              category: log.extracted_category,
              type: raw.type,
              confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
              description: input,
            }]
          : []
      const summary =
        items.length > 1
          ? `Saya menangkap ${items.length} transaksi. Pilih yang ingin disimpan, lalu klik "Simpan terpilih".`
          : items.length === 1
            ? 'Silakan cek dan konfirmasi detailnya di bawah:'
            : 'Catatan ini sudah diproses oleh AI.'
      const createdAt = new Date(log.created_at).getTime()
      const out: Message[] = []
      if (input) out.push({ id: `${log.id}-user-${createdAt}`, role: 'user', content: input })
      out.push({ id: `${log.id}-assistant-${createdAt}`, role: 'assistant', content: summary })

      const batchId = items.length > 1 ? `${log.id}-batch` : undefined
      for (const [index, itemRaw] of items.entries()) {
        const item = itemRaw as Record<string, unknown>
        const amount = Number(item.amount ?? 0)
        const type = item.type === 'income' ? 'income' : 'expense'
        const merchant = cleanMerchant(typeof item.merchant_name === 'string' ? item.merchant_name : '')
        const category = typeof item.category === 'string' ? item.category : ''
        const description = typeof item.description === 'string' ? item.description : input
        const confidence = typeof item.confidence === 'number' ? item.confidence : undefined
        out.push({
          id: `${log.id}-review-${index}-${createdAt}`,
          role: 'assistant',
          content: '',
          type: 'transaction-review',
          extractedData: {
            amount,
            merchant_name: merchant,
            category,
            type,
            confidence,
            description,
          },
          form: {
            wallet_id: '',
            category_id: '',
            amount,
            type,
            merchant_name: merchant,
            description,
            transaction_date: new Date(log.created_at).toISOString().slice(0, 10),
          },
          batchId,
          selected: items.length > 1 ? true : undefined,
        })
      }
      if (batchId) {
        out.push({
          id: `${log.id}-batch-actions-${createdAt}`,
          role: 'assistant',
          content: '',
          type: 'batch-actions',
          batchId,
        })
      }
      return out
    })

    const first = sorted[0]
    const latest = sorted[sorted.length - 1]
    return {
      id: sessionId,
      mode: 'nlp',
      title: deriveTitle(messages),
      messages,
      createdAt: first ? new Date(first.created_at).getTime() : Date.now(),
      updatedAt: latest ? new Date(latest.updated_at || latest.created_at).getTime() : Date.now(),
      logIds: sorted.map((log) => log.id),
    }
  })
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
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .trim()
}

function normalizeCategoryName(value?: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function categoryTokens(value?: string): string[] {
  const n = normalizeCategoryName(value)
  const groups = [
    ['makan', 'minum', 'food', 'drink', 'beverage', 'nasi', 'padang', 'warung', 'resto', 'restaurant', 'kopi', 'coffee', 'cafe'],
    ['transport', 'transportasi', 'gojek', 'grab', 'bensin', 'parkir', 'taxi', 'ojek'],
    ['belanja', 'shopping', 'shop', 'mall', 'tokopedia', 'shopee', 'baju'],
    ['tagihan', 'bill', 'bills', 'listrik', 'wifi', 'internet', 'pulsa', 'vps', 'domain'],
    ['hiburan', 'entertainment', 'netflix', 'spotify', 'game', 'bioskop'],
    ['gaji', 'salary', 'payroll', 'bonus', 'freelance'],
  ]
  return groups.find((group) => group.some((token) => n.includes(token))) ?? []
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
        referrerPolicy="no-referrer"
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

function AIAvatar() {
  return (
    <div className="relative mt-0.5 h-8 w-8 shrink-0">
      <span className="absolute inset-0 rounded-full bg-brand-400/30 animate-ping" />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white shadow-lg shadow-slate-300/50 ring-2 ring-white">
        AI
      </span>
    </div>
  )
}

/* ─────────────────────────── Transaction Review Card ─────────────────────────── */

function getCategoryEmoji(name?: string): string {
  if (!name) return '💰'
  const n = name.toLowerCase()
  if (n.includes('makan') || n.includes('minum') || n.includes('kuliner') || n.includes('food') || n.includes('drink') || n.includes('kopi') || n.includes('coffee') || n.includes('warung') || n.includes('restoran')) return '🍔'
  if (n.includes('trans') || n.includes('ojek') || n.includes('gojek') || n.includes('grab') || n.includes('bensin') || n.includes('mobil') || n.includes('motor') || n.includes('travel') || n.includes('bus') || n.includes('kereta')) return '🚗'
  if (n.includes('belanja') || n.includes('shop') || n.includes('supermarket') || n.includes('mall') || n.includes('baju') || n.includes('pakaian')) return '🛍️'
  if (n.includes('hiburan') || n.includes('nonton') || n.includes('bioskop') || n.includes('game') || n.includes('rekreasi') || n.includes('play')) return '🎮'
  if (n.includes('kesehatan') || n.includes('obat') || n.includes('dokter') || n.includes('rs') || n.includes('sakit') || n.includes('health') || n.includes('medical')) return '🏥'
  if (n.includes('tagihan') || n.includes('listrik') || n.includes('air') || n.includes('wifi') || n.includes('internet') || n.includes('pulsa') || n.includes('bill')) return '⚡'
  if (n.includes('gaji') || n.includes('salary') || n.includes('bonus') || n.includes('pendapatan') || n.includes('income')) return '💵'
  if (n.includes('investasi') || n.includes('saham') || n.includes('reksadana')) return '📈'
  if (n.includes('edukasi') || n.includes('sekolah') || n.includes('kuliah') || n.includes('buku')) return '🎓'
  return '💸'
}

function TransactionReviewCard({
  message,
  walletOptions,
  categoryOptions,
  onSave,
  onFormChange,
  onToggleSelect,
  isSaving,
}: {
  message: Message
  walletOptions: SelectOption[]
  categoryOptions: (type: TransactionType) => SelectOption[]
  onSave: (form: TxForm) => void
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

  const [isEditing, setIsEditing] = useState(false)

  const walletName = walletOptions.find((w) => w.value === form.wallet_id)?.label
  const categoryName = filteredCats.find((c) => c.value === form.category_id)?.label
  const categoryEmoji = getCategoryEmoji(categoryName || message.extractedData?.category)

  if (!isEditing || saved) {
    return (
      <div className={cn('relative mt-3 overflow-hidden rounded-2xl border border-white/80 bg-white/68 shadow-lg shadow-slate-200/35 backdrop-blur-2xl transition duration-300 hover:shadow-xl', saved && 'ring-1 ring-emerald-200')}>
        {saved ? (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
            Tersimpan
          </div>
        ) : null}
        <div className="px-5 pb-4 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <RiSparklingLine className="h-4 w-4 text-blue-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Pratinjau Transaksi
            </p>
            {!saved ? (
              <span
                className={cn(
                  'ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  conf >= 0.8
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : conf >= 0.5
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200',
                )}
              >
                {(conf * 100).toFixed(0)}% akurat
              </span>
            ) : null}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-2xl">
              {categoryEmoji}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {form.description || 'Deskripsi tidak tersedia'}
              </p>
              <p className="truncate text-xs text-slate-400">
                {categoryName || 'Kategori tidak tersedia'}
              </p>
            </div>

            <span
              className={cn(
                'ml-auto text-lg font-extrabold shrink-0',
                form.type === 'income' ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {form.type === 'income' ? '+' : '-'}Rp {form.amount.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <RiWalletLine className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate text-xs font-medium text-slate-600">
                {walletName || 'Pilih Dompet'}
              </span>
            </div>

            <span className="text-xs text-slate-400 shrink-0">
              {form.transaction_date}
            </span>
          </div>
        </div>

        {!saved ? (
          <div className="flex border-t border-slate-200/50 bg-white/30">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex-1 py-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/50"
            >
              Edit Detail
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={isSaving || invalid}
              className="flex-1 py-3 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50/70 disabled:opacity-40"
            >
              {isSaving ? 'Menyimpan…' : 'Konfirmasi'}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  // Edit / Saved Mode
  return (
    <div
      className={cn(
        'relative mt-3 overflow-hidden rounded-3xl border bg-white/40 backdrop-blur-xl transition shadow-md',
        saved
          ? 'border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50/10'
          : isBatch && selected && invalid
            ? 'border-amber-300 ring-1 ring-amber-100'
            : isBatch && selected
              ? 'border-brand-300 ring-1 ring-brand-100'
              : 'border-white/60',
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
          saved ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200/50 bg-slate-50/40',
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {saved ? 'Detail Transaksi' : 'Edit Transaksi'}
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
            { label: 'Merchant', value: cleanMerchant(message.extractedData?.merchant_name) },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="truncate text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={cn('px-4 py-4', saved && 'pointer-events-none opacity-60')}>
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
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nominal</label>
              <CurrencyInput
                value={form.amount}
                onChange={(val) => update({ amount: val })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              aria-label="Tanggal Transaksi"
              value={form.transaction_date}
              onChange={(e) => update({ transaction_date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Merchant</label>
            <input
              type="text"
              value={form.merchant_name}
              onChange={(e) => update({ merchant_name: e.target.value })}
              placeholder="Nama toko / sumber"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
              type="button"
              onClick={() => {
                setIsEditing(false)
              }}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(form)
                setIsEditing(false)
              }}
              disabled={isSaving || invalid}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {isSaving ? 'Menyimpan…' : 'Simpan Transaksi'}
            </button>
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
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/80 bg-white/76 shadow-xl shadow-slate-200/40 backdrop-blur-2xl transition-transform md:static md:inset-auto md:z-auto md:h-full md:translate-x-0 md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/80 px-4 py-3">
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

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const fresh = {
      id: uid(),
      mode: 'nlp' as AIMode,
      title: 'Chat baru',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    return [fresh]
  })

  const [activeId, setActiveId] = useState<string | null>(() => sessions[0]?.id ?? null)

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
  const chatLogs = useQuery({
    queryKey: ['ai-logs', 'chat-history', user?.id],
    queryFn: () => aiLogApi.chatHistory(1, 50),
  })
  const nlpLogs = useQuery({
    queryKey: ['ai-logs', 'nlp-history', user?.id],
    queryFn: () => aiLogApi.nlpHistory(1, 50),
  })

  useEffect(() => {
    const dbSessions = [
      ...(chatLogs.data ? chatSessionsFromLogs(chatLogs.data.data) : []),
      ...(nlpLogs.data ? nlpSessionsFromLogs(nlpLogs.data.data) : []),
    ].filter(Boolean) as ChatSession[]

    const timer = window.setTimeout(() => {
      let shouldActivateDb = false
      setSessions((prev) => {
        const currentSession = prev.find((session) => session.id === activeId)
        shouldActivateDb = dbSessions.length > 0 && (!activeId || !currentSession || currentSession.messages.length === 0)
        const dbIds = new Set(dbSessions.map((session) => session.id))
        const transient = prev.filter((session) => !dbIds.has(session.id) && !session.id.startsWith('legacy-') && !session.id.startsWith('db-'))
        const next = [...dbSessions, ...transient]
        if (next.length > 0) return next.sort((a, b) => b.updatedAt - a.updatedAt)
        return [
          {
            id: uid(),
            mode: 'nlp' as AIMode,
            title: 'Chat baru',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]
      })
      if (shouldActivateDb && dbSessions[0]) setActiveId(dbSessions[0].id)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [chatLogs.data, nlpLogs.data, activeId])

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  )
  const mode: AIMode = active?.mode ?? 'nlp'
  const messages: Message[] = active?.messages ?? []

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

  const showHelp = useCallback(() => {
    const guide =
      mode === 'nlp'
        ? [
            'Panduan NLP:',
            '1. Tulis transaksi seperti chat biasa, contoh: "beli kopi 25rb pakai BCA".',
            '2. Untuk banyak transaksi, pisahkan dengan koma.',
            '3. Dompet otomatis memakai dompet utama, tapi tetap bisa diedit di preview.',
            '4. Cek kategori, nominal, dan tanggal sebelum disimpan.',
          ].join('\n')
        : [
            'Panduan Chatbot:',
            '1. Tanya ringkasan, kategori terbesar, atau perbandingan pengeluaran.',
            '2. Gunakan pertanyaan lanjutan seperti "buat lebih singkat" atau "apa saran hematnya?".',
            '3. Jawaban memakai data transaksi yang tersedia di akunmu dan ditulis tanpa format markdown.',
            '4. Kalau bingung, ketik "help" kapan saja untuk melihat panduan ini.',
          ].join('\n')
    updateActive((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'assistant',
        content: guide,
      },
    ])
  }, [mode, updateActive])

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

  const handleDelete = async (id: string) => {
    const target = sessions.find((s) => s.id === id)
    if (target?.logIds?.length) {
      try {
        await aiLogApi.deleteMany(target.logIds)
        qc.invalidateQueries({ queryKey: ['ai-logs', 'chat-history', user?.id] })
        qc.invalidateQueries({ queryKey: ['ai-logs', 'nlp-history', user?.id] })
        toast.success('Riwayat berhasil dihapus')
      } catch (error) {
        toast.error(toErrorMessage(error))
        return
      }
    }
    setSessions((prev) => {
      let next = prev.filter((s) => s.id !== id)
      if (next.length === 0) {
        const fresh: ChatSession = {
          id: uid(),
          mode: 'nlp',
          title: 'Chat baru',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        next = [fresh]
      }
      if (id === activeId || !next.some((s) => s.id === activeId)) {
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
    (categoryName?: string, type?: TransactionType, context?: string): string | undefined => {
      const wanted = normalizeCategoryName([categoryName, context].filter(Boolean).join(' '))
      if (!wanted) return undefined
      const scoped = (categories.data ?? []).filter((c) => !type || c.type === type)
      const exact = scoped.find((c) => {
        const current = normalizeCategoryName(c.name)
        return current === wanted || current.includes(wanted) || wanted.includes(current)
      })
      if (exact) return exact.id
      const tokens = categoryTokens(wanted)
      return scoped.find((c) => {
        const current = normalizeCategoryName(c.name)
        return tokens.some((token) => current.includes(token))
      })?.id
    },
    [categories.data],
  )

  /* ─── Mutations ─── */
  const categorizeMutation = useMutation({
    mutationFn: (inputText: string) => aiApi.categorize({ text: inputText, session_id: active?.id ?? activeId ?? undefined }),
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
                  merchant_name: cleanMerchant(data.merchant_name),
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
              'Saya belum berhasil menangkap detail transaksinya. Coba tulis lebih spesifik, misalnya: "beli bubur ayam 14rb". Kalau butuh panduan, ketik "help".',
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
        const type = (item.type as TransactionType) || 'expense'
        const form: TxForm = {
          wallet_id: defaultWallet,
          category_id: findCategoryId(item.category, type, `${item.description ?? ''} ${item.merchant_name ?? ''} ${inputText}`) || '',
          amount: item.amount || 0,
          type,
          merchant_name: cleanMerchant(item.merchant_name),
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
            merchant_name: cleanMerchant(item.merchant_name),
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
      qc.invalidateQueries({ queryKey: ['ai-logs', 'nlp-history', user?.id] })
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
      return aiApi.chat({ message: msg, include_context: true, history: prior, session_id: active?.id ?? activeId ?? undefined })
    },
    onSuccess: (data) => {
      updateActive((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: cleanReply(data.reply) },
      ])
      window.setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['ai-logs', 'chat-history', user?.id] })
      }, 800)
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
    if (/^(help|bantuan|panduan)$/i.test(trimmed)) {
      window.setTimeout(showHelp, 0)
      return
    }
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
  const defaultWalletId = wallets.data?.find((w) => w.is_default)?.id ?? wallets.data?.[0]?.id ?? ''
  const categoryOptions = (type: TransactionType): SelectOption[] =>
    (categories.data?.filter((c) => c.type === type) ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    }))
  const resolveReviewForm = useCallback(
    (message: Message): TxForm | undefined => {
      if (!message.form) return undefined
      const form = message.form
      const categoryId =
        form.category_id ||
        findCategoryId(
          message.extractedData?.category,
          form.type,
          `${message.extractedData?.description ?? ''} ${message.extractedData?.merchant_name ?? ''} ${form.description ?? ''}`,
        ) ||
        ''

      return {
        ...form,
        wallet_id: form.wallet_id || defaultWalletId,
        category_id: categoryId,
      }
    },
    [defaultWalletId, findCategoryId],
  )

  useEffect(() => {
    const defaultWallet = wallets.data?.find((w) => w.is_default)?.id ?? wallets.data?.[0]?.id
    if (!defaultWallet) return
    const timer = window.setTimeout(() => {
      setSessions((prev) =>
        prev.map((session) =>
          ({
            ...session,
            messages: session.messages.map((message) =>
              message.type === 'transaction-review' && message.form && !message.form.wallet_id && !message.saved
                ? { ...message, form: { ...message.form, wallet_id: defaultWallet } }
                : message,
            ),
          }),
        ),
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [wallets.data])

  useEffect(() => {
    if (!categories.data?.length) return
    const timer = window.setTimeout(() => {
      setSessions((prev) =>
        prev.map((session) =>
          ({
            ...session,
            messages: session.messages.map((message) => {
              if (
                message.type !== 'transaction-review' ||
                !message.form ||
                message.form.category_id ||
                !message.extractedData?.category ||
                message.saved
              ) {
                return message
              }
              const categoryId = findCategoryId(
                message.extractedData.category,
                message.form.type,
                `${message.extractedData.description ?? ''} ${message.extractedData.merchant_name ?? ''} ${message.form.description ?? ''}`,
              )
              return categoryId
                ? { ...message, form: { ...message.form, category_id: categoryId } }
                : message
            }),
          }),
        ),
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [categories.data, findCategoryId])

  const examples = mode === 'nlp' ? NLP_EXAMPLES : CHAT_EXAMPLES

  return (
    <div className="relative flex h-[calc(100dvh-8rem)] min-h-[680px] overflow-hidden rounded-2xl border border-white/80 bg-white/30 shadow-lg shadow-slate-200/30 backdrop-blur-xl">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-20 bottom-10 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" style={{ animationDelay: '2s' }} />
      </div>
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
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/80 bg-white/40 px-4 py-3 md:px-6">
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
          <div className="flex items-center gap-2">
            <button
              onClick={showHelp}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/62 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xl hover:bg-white hover:text-brand-700"
            >
              <HiOutlineQuestionMarkCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </button>
            <button
              onClick={() => handleNew(mode)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat baru</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.length === 0 && (
              <div className="py-6">
                <div className="mx-auto mb-8 max-w-lg rounded-2xl border border-white/80 bg-white/62 px-6 py-8 text-center shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
                  <AIAvatar />
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                    SAKU AI
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                    {mode === 'nlp'
                      ? 'Catat Transaksi Instan lewat Chat'
                      : 'Tanya Jawab & Dapatkan Analisis Keuangan'}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {mode === 'nlp'
                      ? 'Tulis transaksi seperti chat biasa. AI akan membuat pratinjau sebelum disimpan.'
                      : 'Tanyakan ringkasan, pola pengeluaran, atau saran hemat dari data keuanganmu.'}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Coba ketuk contoh di bawah ini
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setText(ex)
                          textareaRef.current?.focus()
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
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
                  <AIAvatar />
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

                  {msg.type === 'transaction-review' && msg.extractedData && msg.form ? (() => {
                    const resolvedForm = resolveReviewForm(msg)
                    const resolvedMessage = resolvedForm ? { ...msg, form: resolvedForm } : msg
                    return (
                      <TransactionReviewCard
                        message={resolvedMessage}
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
                        onFormChange={(form) => handleUpdateForm(msg.id, form)}
                        onToggleSelect={
                          msg.batchId ? () => handleToggleSelect(msg.id) : undefined
                        }
                      />
                    )
                  })() : null}
                </div>

                {msg.role === 'user' && (
                  <UserAvatar photoUrl={user?.photo_url} name={user?.name} />
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-center gap-3">
                <AIAvatar />
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
