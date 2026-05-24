import { aiLogApi } from '@/features/ai/api'
import type { TransactionType } from '@/types/api'

export type AIMode = 'nlp' | 'chatbot'

export interface ExtractedTx {
  amount?: number
  type?: TransactionType
  category?: string
  merchant_name?: string
  confidence?: number
  description?: string
  date?: string
  transaction_date?: string
}

export interface TxForm {
  wallet_id: string
  category_id: string
  amount: number
  type: TransactionType
  merchant_name: string
  description: string
  transaction_date: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'transaction-review' | 'batch-actions'
  extractedData?: ExtractedTx
  form?: TxForm
  batchId?: string
  selected?: boolean
  saved?: boolean
}

export interface ChatSession {
  id: string
  mode: AIMode
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  logIds?: string[]
}

export const NLP_EXAMPLES = [
  'beli nasi padang 35rb',
  'gaji freelance 3juta',
  'bayar listrik 450ribu',
  'beli bensin 50k',
  'bonus kantor 5jt',
]

export const NLP_EXAMPLES_EN = [
  'lunch at Sederhana 35k',
  'freelance payment 3m',
  'electricity bill 450k',
  'fuel expense 50k',
  'office bonus 5m',
]

export const CHAT_EXAMPLES = [
  'Ringkas arus kas bulan ini dan hal yang perlu saya perhatikan.',
  'Kategori mana yang paling menekan pengeluaran bulan ini?',
  'Buat rekomendasi budget mingguan berdasarkan transaksi terakhir.',
  'Bandingkan performa bulan ini dengan bulan lalu secara singkat.',
]

export const CHAT_EXAMPLES_EN = [
  'Summarize this month cashflow and what needs attention.',
  'Which category is driving most of my spending this month?',
  'Suggest a weekly budget from my recent transactions.',
  'Compare this month with last month in a concise way.',
]

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function cleanMerchant(value?: string | null): string {
  const merchant = (value ?? '').trim()
  return merchant === '-' ? '' : merchant
}

export function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'Chat baru'
  const title = firstUser.content.trim().replace(/\s+/g, ' ')
  return title.length > 40 ? `${title.slice(0, 40)}...` : title
}

export function chatSessionsFromLogs(
  logs: Awaited<ReturnType<typeof aiLogApi.list>>['data'],
): ChatSession[] {
  const groups = new Map<string, Awaited<ReturnType<typeof aiLogApi.list>>['data']>()
  logs
    .filter((log) => log.feature === 'chat' && log.status === 'success')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((log) => {
      const raw = log.raw_response ?? {}
      const sessionId =
        typeof raw.session_id === 'string' && raw.session_id.trim()
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

export function nlpSessionsFromLogs(
  logs: Awaited<ReturnType<typeof aiLogApi.list>>['data'],
): ChatSession[] {
  return logs
    .filter((log) => log.feature === 'categorize' && log.status === 'success')
    .map((log) => {
      const messages = buildNlpMessages(log)
      const createdAt = new Date(log.created_at).getTime()
      const updatedAt = new Date(log.updated_at || log.created_at).getTime()
      return {
        id: `nlp-${log.id}`,
        mode: 'nlp',
        title: deriveTitle(messages),
        messages,
        createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
        updatedAt: Number.isNaN(updatedAt) ? Date.now() : updatedAt,
        logIds: [log.id],
      }
    })
}

export function logIdFromReviewMessage(messageId: string): string | null {
  const match = messageId.match(/^(.+)-review-\d+-\d+$/)
  return match?.[1] ?? null
}

export function groupSessionsByDate(sessions: ChatSession[], locale: 'id' | 'en' = 'id') {
  const map = new Map<number, { label: string; items: ChatSession[] }>()
  const now = new Date()
  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  for (const session of sessions) {
    const date = new Date(session.updatedAt)
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const label =
      key === todayKey
        ? locale === 'id' ? 'Hari ini' : 'Today'
        : date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
    const existing = map.get(key)
    if (existing) existing.items.push(session)
    else map.set(key, { label, items: [session] })
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, value]) => value)
}

export async function fetchAllChatLogIds(mode?: AIMode): Promise<string[]> {
  const ids = new Set<string>()
  const fetchers =
    mode === 'chatbot'
      ? [aiLogApi.chatHistory]
      : mode === 'nlp'
        ? [aiLogApi.nlpHistory]
        : [aiLogApi.chatHistory, aiLogApi.nlpHistory]
  for (const fetchHistory of fetchers) {
    let page = 1
    while (page <= 20) {
      const res = await fetchHistory(page, 200)
      res.data.forEach((log) => ids.add(log.id))
      if (!res.meta?.has_next) break
      page += 1
    }
  }
  return Array.from(ids)
}

export function cleanReply(reply: string): string {
  let text = (reply ?? '').trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json|JSON)?\s*\n?/, '')
    text = text.replace(/\n?```\s*$/, '')
    text = text.trim()
  }
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text) as Record<string, unknown>
      for (const key of ['message', 'reply', 'answer', 'response', 'text']) {
        const value = obj[key]
        if (typeof value === 'string' && value.trim()) return value.trim()
      }
      return 'Maaf, saya belum bisa memberikan jawaban yang tepat. Coba tanyakan ulang.'
    } catch {
      // Keep original text when it only looks like JSON.
    }
  }
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .trim()
}

export function normalizeCategoryName(value?: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function categoryTokens(value?: string): string[] {
  const normalized = normalizeCategoryName(value)
  const groups = [
    ['makan', 'minum', 'food', 'drink', 'beverage', 'nasi', 'padang', 'warung', 'resto', 'restaurant', 'kopi', 'coffee', 'cafe'],
    ['transport', 'transportasi', 'gojek', 'grab', 'bensin', 'parkir', 'taxi', 'ojek'],
    ['belanja', 'shopping', 'shop', 'mall', 'tokopedia', 'shopee', 'baju'],
    ['tagihan', 'bill', 'bills', 'listrik', 'wifi', 'internet', 'pulsa', 'vps', 'domain'],
    ['hiburan', 'entertainment', 'netflix', 'spotify', 'game', 'bioskop'],
    ['gaji', 'salary', 'payroll', 'bonus', 'freelance'],
  ]
  return groups.find((group) => group.some((token) => normalized.includes(token))) ?? []
}

export function toISODateOnly(raw?: string): string | undefined {
  if (!raw) return undefined
  const value = raw.trim()
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

export function inferTransactionDate(text: string, explicit?: string): string {
  const direct = toISODateOnly(explicit)
  if (direct) return direct
  const date = new Date()
  const lowered = text.toLowerCase()
  if (/\b(kemarin|yesterday)\b/.test(lowered)) date.setDate(date.getDate() - 1)
  else if (/\b(besok|tomorrow)\b/.test(lowered)) date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export interface SpeechRecognitionLike {
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

export function getSpeechCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | null
}

function buildNlpMessages(
  log: Awaited<ReturnType<typeof aiLogApi.list>>['data'][number],
): Message[] {
  const raw = log.raw_response ?? {}
  const input = typeof raw.message === 'string' ? raw.message.trim() : ''
  const txs = Array.isArray(raw.transactions) ? raw.transactions : []
  const items =
    txs.length > 0
      ? txs
      : log.extracted_amount
        ? [
            {
              amount: log.extracted_amount,
              merchant_name: cleanMerchant(log.extracted_merchant),
              category: log.extracted_category,
              type: raw.type,
              confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
              description: input,
            },
          ]
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
    const date =
      typeof item.date === 'string'
        ? item.date
        : typeof item.transaction_date === 'string'
          ? item.transaction_date
          : undefined
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
        date,
        transaction_date: date,
      },
      form: {
        wallet_id: '',
        category_id: '',
        amount,
        type,
        merchant_name: merchant,
        description,
        transaction_date: inferTransactionDate(input, date),
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
}
