import { aiLogApi } from '@/features/ai/api'
import type { TransactionType } from '@/types/api'
import { formatRelativeDayLabel } from '@/lib/dateLabel'
import { imageFileToWebPBase64 } from '@/lib/files'

export interface ExtractedReceipt {
  amount?: number
  type?: TransactionType
  category?: string
  merchant_name?: string
  description?: string
  ocr_text?: string
  date?: string
  confidence?: number
  line_items?: string[]
  image_key?: string
  log_id?: string
}

export interface ScanHistoryEntry {
  id: string
  timestamp: number
  imagePreview: string
  amount: number
  type: TransactionType
  merchant: string
  description: string
  transactionDate: string
  categoryName?: string
  ocrText?: string
  lineItems?: string[]
  confidence?: number
}

export function cleanMerchant(value?: string | null): string {
  const merchant = (value ?? '').trim()
  return merchant === '-' ? '' : merchant
}

export function extractReceiptItems(ocrText?: string, lineItems?: string[]): string[] {
  if (lineItems?.length) {
    return lineItems.map((item) => item.trim()).filter(Boolean).slice(0, 8)
  }
  const ignored = /(alfamart|indomaret|total|subtotal|tunai|kembali|pajak|ppn|struk|receipt|telp|npwp|tanggal|jam|kasir|member|rp\b|qty|harga|diskon|terima kasih|www\.|http)/i
  return (ocrText || '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s{2,}/g, ' '))
    .filter((line) => line.length >= 3 && !ignored.test(line))
    .filter((line) => /[a-zA-Z]/.test(line))
    .map((line) => line.replace(/\s+[xX]?\d+([.,]\d+)?\s*$/, '').trim())
    .filter(Boolean)
    .slice(0, 8)
}

export function buildScanDescription(d: {
  merchant_name?: string
  ocr_text?: string
  line_items?: string[]
}): string {
  const merchant = cleanMerchant(d.merchant_name)
  const text = `${d.ocr_text ?? ''} ${(d.line_items ?? []).join(' ')}`.toLowerCase()
  const items = extractReceiptItems(d.ocr_text, d.line_items)
  const hasReceiptItems = items.length > 0
  const hasBankEvidence = /(mutasi|rekening|sumber dana|sumber akun|penerima|tujuan|ref(erensi)?|admin bank|bi-fast|dana masuk|transfer masuk|received|credited|nomor rekening|no\.?\s*rek)/i.test(text)
  const hasServiceEvidence = /(cuci|laundry|gosok|parfum|status:\s*lunas|item struk|id transaksi|nomor telepon|layanan|reguler|express)/i.test(text)
  const isTransfer = hasBankEvidence || (!hasReceiptItems && /(transfer|top ?up|qris)/i.test(text))

  if (hasReceiptItems && hasServiceEvidence) {
    const prefix = merchant ? `Pembayaran di ${merchant}` : 'Pembayaran layanan'
    return `${prefix}: ${items.join(', ')}`
  }

  if (isTransfer && !hasReceiptItems) {
    if (/dana masuk|transfer masuk|received|credited|mutasi masuk/i.test(text)) {
      return merchant ? `Transfer masuk dari ${merchant}` : 'Transfer masuk'
    }
    if (/top ?up/i.test(text)) return merchant ? `Top up ${merchant}` : 'Top up e-wallet'
    if (/qris/i.test(text)) return merchant ? `Pembayaran QRIS ke ${merchant}` : 'Pembayaran QRIS'
    return merchant ? `Transfer ke ${merchant}` : 'Transfer bank'
  }

  if (items.length > 0) {
    const prefix = merchant ? `Belanja di ${merchant}` : 'Belanja'
    return `${prefix}: ${items.join(', ')}`
  }
  if (merchant) return `Belanja di ${merchant}`
  return 'Scan struk'
}

export function resolveScanDescription(d: {
  description?: string
  merchant_name?: string
  ocr_text?: string
  line_items?: string[]
}): string {
  const fallback = buildScanDescription(d)
  const raw = d.description?.trim() ?? ''
  const hasItems = extractReceiptItems(d.ocr_text, d.line_items).length > 0
  const rawLooksGeneric = !raw || /^scan struk|belanja$|transfer( bank)?$|transfer ke\b|pembayaran$/i.test(raw)
  return hasItems && rawLooksGeneric ? fallback : raw || fallback
}

export function parseScannedDate(raw?: string): string {
  if (!raw) return new Date().toISOString().split('T')[0]
  const value = raw.trim()
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    let year = Number(dmy[3])
    if (year < 100) year += 2000
    const parsed = new Date(year, month - 1, day)
    if (year >= 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31 && parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0]
}

export function normalizeCategoryName(value?: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function scanLogToHistory(
  log: NonNullable<Awaited<ReturnType<typeof aiLogApi.list>>['data']>[number],
): ScanHistoryEntry {
  const raw = log.raw_response
  const created = new Date(log.created_at)
  const timestamp = Number.isNaN(created.getTime()) ? Date.now() : created.getTime()
  const amount =
    typeof log.extracted_amount === 'number' ? log.extracted_amount : Number(raw?.amount ?? 0)
  const rawDescription = rawString(raw, 'description')
  const fallbackDescription = resolveScanDescription({
    description: rawDescription,
    merchant_name: cleanMerchant(log.extracted_merchant || rawString(raw, 'merchant_name')),
    ocr_text: rawString(raw, 'ocr_text'),
    line_items: readStringArray(raw, 'line_items'),
  })

  return {
    id: log.id,
    timestamp,
    imagePreview: log.image_url ?? '',
    amount,
    type: rawType(raw),
    merchant: cleanMerchant(log.extracted_merchant || rawString(raw, 'merchant_name')),
    description: fallbackDescription,
    transactionDate: rawString(raw, 'date'),
    categoryName: log.extracted_category || rawString(raw, 'category'),
    ocrText: rawString(raw, 'ocr_text'),
    lineItems: readStringArray(raw, 'line_items') ?? extractReceiptItems(rawString(raw, 'ocr_text')),
    confidence:
      typeof log.confidence_score === 'number'
        ? log.confidence_score
        : typeof raw?.confidence === 'number'
          ? raw.confidence
          : undefined,
  }
}

export function groupHistoryByDay(entries: ScanHistoryEntry[]) {
  const map = new Map<number, { label: string; items: ScanHistoryEntry[] }>()
  for (const entry of entries) {
    const date = new Date(entry.timestamp)
    const dayKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const bucket = map.get(dayKey)
    if (bucket) bucket.items.push(entry)
    else map.set(dayKey, { label: formatRelativeDayLabel(entry.timestamp), items: [entry] })
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, value]) => value)
}

export function imageFileToOptimizedBase64(file: File): Promise<string> {
  return imageFileToWebPBase64(file, { maxSide: 1500, quality: 0.8, filename: 'receipt-scan' })
}

function rawString(raw: Record<string, unknown> | undefined, key: string): string {
  const value = raw?.[key]
  return typeof value === 'string' ? value : ''
}

function rawType(raw: Record<string, unknown> | undefined): TransactionType {
  return rawString(raw, 'type') === 'income' ? 'income' : 'expense'
}

function readStringArray(raw: Record<string, unknown> | undefined, key: string): string[] | undefined {
  const value = raw?.[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
}
