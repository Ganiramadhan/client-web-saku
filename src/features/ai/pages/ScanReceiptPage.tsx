import { useCallback, useEffect, useState, type ChangeEvent, type DragEvent, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineTrash,
} from 'react-icons/hi2'

import { aiApi, aiLogApi } from '@/features/ai/api'
import { categoryApi } from '@/features/categories/api'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'

import {
  Badge,
  Button,
  CurrencyInput,
  DateInput,
  Modal,
  PageHeader,
  RSelect,
  Textarea,
  type SelectOption,
} from '@/components/ui'

import { useT } from '@/i18n'
import type { TransactionType } from '@/types/api'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatRelativeDayLabel, formatTimeLabel } from '@/lib/dateLabel'
import { confirm } from '@/lib/confirm'

interface ExtractedReceipt {
  amount?: number
  type?: TransactionType
  category?: string
  merchant_name?: string
  description?: string
  ocr_text?: string
  date?: string
  confidence?: number
  line_items?: string[]
}

function cleanMerchant(value?: string | null): string {
  const merchant = (value ?? '').trim()
  return merchant === '-' ? '' : merchant
}

function extractReceiptItems(ocrText?: string, lineItems?: string[]): string[] {
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

function buildScanDescription(d: { merchant_name?: string; ocr_text?: string; line_items?: string[] }): string {
  const merchant = cleanMerchant(d.merchant_name)
  const text = `${d.ocr_text ?? ''} ${(d.line_items ?? []).join(' ')}`.toLowerCase()
  const isTransfer = /(transfer|mutasi|rekening|sumber dana|sumber akun|penerima|tujuan|ref(erensi)?|admin bank|bi-fast|qris|top ?up|dana masuk|transfer masuk)/i.test(text)
  const items = extractReceiptItems(d.ocr_text, d.line_items)
  if (isTransfer) {
    if (/dana masuk|transfer masuk|received|credited|mutasi masuk/i.test(text)) {
      return merchant ? `Transfer masuk dari ${merchant}` : 'Transfer masuk'
    }
    if (/top ?up/i.test(text)) {
      return merchant ? `Top up ${merchant}` : 'Top up e-wallet'
    }
    if (/qris/i.test(text)) {
      return merchant ? `Pembayaran QRIS ke ${merchant}` : 'Pembayaran QRIS'
    }
    return merchant ? `Transfer ke ${merchant}` : 'Transfer bank'
  }
  if (items.length > 0) {
    const prefix = merchant ? `Belanja di ${merchant}` : 'Belanja'
    return `${prefix}: ${items.join(', ')}`
  }
  if (merchant) return `Belanja di ${merchant}`
  return 'Scan struk'
}

function parseScannedDate(raw?: string): string {
  if (!raw) return new Date().toISOString().split('T')[0]
  // Accept YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0]
}

function normalizeCategoryName(value?: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

interface ScanHistoryEntry {
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

function rawString(raw: Record<string, unknown> | undefined, key: string): string {
  const value = raw?.[key]
  return typeof value === 'string' ? value : ''
}

function rawType(raw: Record<string, unknown> | undefined): TransactionType {
  return rawString(raw, 'type') === 'income' ? 'income' : 'expense'
}

function scanLogToHistory(log: NonNullable<Awaited<ReturnType<typeof aiLogApi.list>>['data']>[number]): ScanHistoryEntry {
  const raw = log.raw_response
  const created = new Date(log.created_at)
  const timestamp = Number.isNaN(created.getTime()) ? Date.now() : created.getTime()
  const amount =
    typeof log.extracted_amount === 'number'
      ? log.extracted_amount
      : Number(raw?.amount ?? 0)
  const rawDescription = rawString(raw, 'description')
  const fallbackDescription = buildScanDescription({
    merchant_name: cleanMerchant(log.extracted_merchant || rawString(raw, 'merchant_name')),
    ocr_text: rawString(raw, 'ocr_text'),
    line_items: Array.isArray(raw?.line_items) ? raw.line_items.filter((item): item is string => typeof item === 'string') : undefined,
  })

  return {
    id: log.id,
    timestamp,
    imagePreview: log.image_url ?? '',
    amount,
    type: rawType(raw),
    merchant: cleanMerchant(log.extracted_merchant || rawString(raw, 'merchant_name')),
    description: rawDescription && !/^scan struk|belanja$/i.test(rawDescription.trim())
      ? rawDescription
      : fallbackDescription,
    transactionDate: rawString(raw, 'date'),
    categoryName: log.extracted_category || rawString(raw, 'category'),
    ocrText: rawString(raw, 'ocr_text'),
    lineItems: Array.isArray(raw?.line_items)
      ? raw.line_items.filter((item): item is string => typeof item === 'string')
      : extractReceiptItems(rawString(raw, 'ocr_text')),
    confidence:
      typeof log.confidence_score === 'number'
        ? log.confidence_score
        : typeof raw?.confidence === 'number'
          ? raw.confidence
          : undefined,
  }
}

function groupHistoryByDay(entries: ScanHistoryEntry[]) {
  const map = new Map<number, { label: string; items: ScanHistoryEntry[] }>()
  for (const e of entries) {
    const d = new Date(e.timestamp)
    const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const label = formatRelativeDayLabel(e.timestamp)
    const bucket = map.get(dayKey)
    if (bucket) bucket.items.push(e)
    else map.set(dayKey, { label, items: [e] })
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, v]) => v)
}

function imageFileToOptimizedBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxSide = 1600
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas tidak tersedia'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar'))
    }
    img.src = url
  })
}

export function ScanReceiptPage() {
  const t = useT()
  const qc = useQueryClient()

  const [imagePreview, setImagePreview] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const [viewing, setViewing] = useState<ScanHistoryEntry | null>(null)
  const [selectedHistory, setSelectedHistory] = useState<Set<string>>(() => new Set())

  const [form, setForm] = useState({
    wallet_id: '',
    category_id: '',
    amount: 0,
    type: 'expense' as TransactionType,
    merchant_name: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  })

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
  })
  const scanLogsQ = useQuery({
    queryKey: ['ai-logs', 'scan-receipt-history'],
    queryFn: () => aiLogApi.scanReceiptHistory(1, 100),
  })

  useEffect(() => {
    if (form.wallet_id) return
    const list = wallets.data
    if (!list || list.length === 0) return
    const def = list.find((w) => w.is_default) ?? list[0]
    const timer = window.setTimeout(() => {
      setForm((prev) => (prev.wallet_id ? prev : { ...prev, wallet_id: def.id }))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [wallets.data, form.wallet_id])

  useEffect(() => {
    const logs = scanLogsQ.data?.data
    if (!logs) return
    const nextHistory = logs.map(scanLogToHistory).sort((a, b) => b.timestamp - a.timestamp)
    const timer = window.setTimeout(() => setHistory(nextHistory), 0)
    return () => window.clearTimeout(timer)
  }, [scanLogsQ.data])

  const findCategoryId = useCallback((categoryName?: string, type?: TransactionType): string | undefined => {
    if (!categoryName) return undefined
    const wanted = normalizeCategoryName(categoryName)
    if (!wanted) return undefined
    return (categories.data ?? [])
      .filter((c) => !type || c.type === type)
      .find((c) => {
        const current = normalizeCategoryName(c.name)
        return current === wanted || current.includes(wanted) || wanted.includes(current)
      })?.id
  }, [categories.data])

  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await imageFileToOptimizedBase64(file)
      return aiApi.scanReceipt({ image_base64: base64 })
    },
    onSuccess: (data) => {
      const d = { ...(data as ExtractedReceipt), merchant_name: cleanMerchant((data as ExtractedReceipt).merchant_name) }
      const nextType = (d.type as TransactionType) || 'expense'
      const description = d.description?.trim() || buildScanDescription(d)
      setExtractedData(d)
      setForm((prev) => ({
        ...prev,
        amount: d.amount || 0,
        merchant_name: cleanMerchant(d.merchant_name),
        category_id: findCategoryId(d.category, nextType) || '',
        description,
        type: nextType,
        transaction_date: parseScannedDate(d.date),
      }))
      qc.invalidateQueries({ queryKey: ['ai-logs', 'scan-receipt-history'] })
      toast.success('Struk berhasil di-scan!')
    },
    onError: (e) => {
      toast.error(toErrorMessage(e))
      resetForm()
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const iso = new Date(`${form.transaction_date}T00:00:00`).toISOString()
      return transactionApi.create({
        ...form,
        transaction_date: iso,
        source: 'ai_ocr',
        confidence_score: extractedData?.confidence,
      })
    },
    onSuccess: (savedTx) => {
      void savedTx
      toast.success('Transaksi berhasil disimpan!')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['ai-logs', 'scan-receipt-history'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      resetForm()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const handleFile = (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimum 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    scanMutation.mutate(file)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0])
    e.target.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const resetForm = () => {
    setImagePreview('')
    setIsEditing(false)
    setExtractedData(null)
    const def = wallets.data?.find((w) => w.is_default) ?? wallets.data?.[0]
    setForm({
      wallet_id: def?.id ?? '',
      category_id: '',
      amount: 0,
      type: 'expense',
      merchant_name: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
    })
  }

  useEffect(() => {
    if (form.category_id || !extractedData?.category || !categories.data?.length) return
    const categoryId = findCategoryId(extractedData.category, form.type)
    if (!categoryId) return
    const timer = window.setTimeout(() => {
      setForm((prev) => (prev.category_id ? prev : { ...prev, category_id: categoryId }))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [categories.data, extractedData?.category, findCategoryId, form.category_id, form.type])

  const filteredCats = categories.data?.filter((c) => c.type === form.type) ?? []
  const walletOptions: SelectOption[] = (wallets.data ?? []).map((w) => ({
    value: w.id,
    label: w.name,
  }))
  const categoryOptions: SelectOption[] = filteredCats.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const selectedCount = selectedHistory.size
  const allHistorySelected = history.length > 0 && selectedCount === history.length
  const deleteHistoryItems = async (ids: string[]) => {
    if (ids.length === 0) return
    const ok = await confirm({
      title: ids.length > 1 ? 'Hapus riwayat terpilih?' : 'Hapus riwayat scan?',
      description:
        ids.length > 1
          ? `${ids.length} riwayat scan akan dihapus dari database. Transaksi yang sudah disimpan tetap aman.`
          : 'Riwayat scan akan dihapus dari database. Transaksi yang sudah disimpan tetap aman.',
      tone: 'danger',
      confirmLabel: 'Hapus',
    })
    if (!ok) return
    try {
      await aiLogApi.deleteMany(ids)
      const next = history.filter((item) => !ids.includes(item.id))
      setHistory(next)
      setSelectedHistory((prev) => {
        const copy = new Set(prev)
        ids.forEach((id) => copy.delete(id))
        return copy
      })
      setViewing((current) => (current && ids.includes(current.id) ? null : current))
      qc.invalidateQueries({ queryKey: ['ai-logs', 'scan-receipt-history'] })
      toast.success('Riwayat scan berhasil dihapus')
    } catch (error) {
      toast.error(toErrorMessage(error))
    }
  }
  const receiptSteps = [
    {
      num: '01',
      Icon: HiOutlineCloudArrowUp,
      title: 'Upload Struk',
      desc: 'Ambil foto struk belanja Anda atau pilih file gambar dari perangkat.',
      color: 'text-cyan-600',
      bg: 'rgba(236,254,255,0.90)',
      border: 'rgba(165,243,252,0.70)',
    },
    {
      num: '02',
      Icon: HiOutlineSparkles,
      title: 'AI Ekstraksi Data',
      desc: 'Sistem cerdas AI akan membaca otomatis nominal, nama toko/merchant, tanggal, dan kategori.',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
    },
    {
      num: '03',
      Icon: HiOutlineDocumentText,
      title: 'Review Detail',
      desc: 'Periksa kembali data transaksi hasil ekstraksi sebelum disimpan.',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: 'Konfirmasi & Simpan',
      desc: 'Simpan data ke dompet Anda seketika sebagai transaksi baru.',
      color: 'text-emerald-600',
      bg: 'rgba(236,253,245,0.90)',
      border: 'rgba(167,243,208,0.70)',
    },
  ]

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-0 bottom-10 h-[420px] w-[420px] rounded-full bg-brand-200/10 blur-3xl" />
      </div>

      <PageHeader title={t.scanReceipt.title} subtitle={t.scanReceipt.subtitle} />

      {!imagePreview ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div
            className="lg:col-span-2 rounded-3xl p-6 transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.40)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.60)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              disabled={scanMutation.isPending}
              className={cn(
                'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300',
                isDragging
                  ? 'border-brand-500 bg-brand-50/50 scale-[0.99] shadow-inner'
                  : 'border-slate-300 bg-white/50 hover:border-brand-400 hover:bg-white/80 hover:shadow-lg hover:shadow-brand-100/30',
                scanMutation.isPending && 'cursor-wait opacity-80',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload struk"
                title="Upload struk"
                className="hidden"
                onChange={handleFileChange}
                disabled={scanMutation.isPending}
              />

              <div className="relative mb-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  {scanMutation.isPending ? (
                    <HiOutlineArrowPath className="h-10 w-10 animate-spin text-brand-600" />
                  ) : (
                    <HiOutlineCloudArrowUp className="h-10 w-10 text-brand-600" />
                  )}
                </div>
                {!scanMutation.isPending && (
                  <span className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow ring-2 ring-white animate-bounce">
                    <HiOutlineSparkles className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                {scanMutation.isPending ? 'Memproses Struk…' : 'Upload Foto Struk'}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {scanMutation.isPending
                  ? 'AI sedang membaca nominal, merchant, dan kategori.'
                  : 'Tarik & lepas foto, atau klik untuk memilih file. AI akan mengisi data otomatis.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                  <HiOutlinePhoto className="h-3.5 w-3.5" /> JPG / PNG / WEBP
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                  Maks. 5 MB
                </span>
              </div>
            </button>
          </div>

          {/* Steps card matching How it Works */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-600">
              Cara Kerja Scan Struk
            </h3>
            {receiptSteps.map((step) => (
              <div
                key={step.num}
                className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(36px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(36px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.88)',
                  boxShadow:
                    '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
                }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-3xl border border-cyan-300/30" />
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
                </div>

                <div className="relative flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105',
                      step.color,
                    )}
                    style={{
                      background: step.bg,
                      border: `1px solid ${step.border}`,
                    }}
                  >
                    <step.Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">{step.num}</span>
                      <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─── Result + Form ─── */
        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          {/* LEFT — photo preview */}
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'rgba(255,255,255,0.50)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.60)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Foto Struk</h3>
                <p className="mt-0.5 text-xs text-slate-500">Hasil jepretan atau file yang diupload</p>
              </div>
              {extractedData ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Data terbaca
                </span>
              ) : null}
            </div>

            <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
              <img src={imagePreview} alt="Struk" className="h-full w-full object-contain" />
              {scanMutation.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white px-4 py-3 shadow">
                    <HiOutlineArrowPath className="h-6 w-6 animate-spin text-brand-600" />
                    <span className="text-xs font-semibold text-slate-700">AI memproses…</span>
                  </div>
                </div>
              ) : null}
            </div>

            <Button
              variant="ghost"
              className="mt-4 w-full rounded-2xl"
              onClick={resetForm}
              leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
            >
              Ulangi / Foto Lain
            </Button>
          </div>

          {/* RIGHT — Preview Card & Collapsible Form */}
          <div className="space-y-4">
            {scanMutation.isPending ? (
              <div
                className="flex flex-col items-center justify-center py-24 rounded-3xl"
                style={{
                  background: 'rgba(255,255,255,0.50)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.60)',
                }}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 animate-bounce">
                  <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">AI sedang memproses</h4>
                <p className="mt-1.5 text-xs text-slate-500">Membaca nominal, merchant, dan kategori transaksi…</p>
                <div className="mt-5 flex w-48 gap-1">
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-200 [animation-delay:0ms]" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-300 [animation-delay:200ms]" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-400 [animation-delay:400ms]" />
                </div>
              </div>
            ) : !isEditing ? (
              <div className="rounded-2xl border border-white/80 bg-white/68 p-6 shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <HiOutlineDocumentText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Preview Detail Transaksi</h3>
                    <p className="text-[11px] text-slate-500">Readonly hasil ekstraksi struk sebelum disimpan</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RSelect
                      label="Tipe Transaksi"
                      value={form.type}
                      options={[
                        { value: 'expense', label: t.transactions.expense },
                        { value: 'income', label: t.transactions.income },
                      ]}
                      onChange={() => undefined}
                      isDisabled
                    />
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nominal</label>
                      <CurrencyInput value={form.amount} onChange={() => undefined} disabled />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Merchant</label>
                    <input
                      type="text"
                      value={form.merchant_name}
                      readOnly
                      placeholder="Contoh: Alfamart"
                      className="w-full rounded-xl border border-white/80 bg-white/72 px-3 py-2.5 text-sm text-slate-700 shadow-sm backdrop-blur-xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <RSelect label="Dompet" value={form.wallet_id} options={walletOptions} onChange={() => undefined} isDisabled />
                    <RSelect label="Kategori" value={form.category_id} options={categoryOptions} onChange={() => undefined} isDisabled />
                  </div>

                  <DateInput
                    label="Tanggal Transaksi"
                    value={form.transaction_date || null}
                    onChange={() => undefined}
                    placeholderText="Pilih tanggal"
                    disabled
                  />

                  <Textarea
                    label="Catatan"
                    rows={3}
                    value={form.description}
                    onChange={() => undefined}
                    placeholder="Tambahkan catatan transaksi…"
                    readOnly
                  />

                  <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Edit Detail
                    </button>
                    <Button
                      className="rounded-xl"
                      onClick={() => saveMutation.mutate()}
                      loading={saveMutation.isPending}
                      disabled={!form.wallet_id || !form.category_id || form.amount <= 0}
                    >
                      <HiOutlineCheckCircle className="mr-1 h-4 w-4" />
                      Simpan Transaksi
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Expanded Edit Form */
              <div className="rounded-2xl border border-white/80 bg-white/68 p-6 shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <HiOutlineDocumentText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Edit Detail Transaksi</h3>
                    <p className="text-[11px] text-slate-500">Sesuaikan data hasil ekstraksi struk</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RSelect
                      label="Tipe Transaksi"
                      value={form.type}
                      options={[
                        { value: 'expense', label: t.transactions.expense },
                        { value: 'income', label: t.transactions.income },
                      ]}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          type: (v as TransactionType) ?? 'expense',
                        })
                      }
                    />
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nominal</label>
                      <CurrencyInput
                        value={form.amount}
                        onChange={(val) => setForm({ ...form, amount: val })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Merchant</label>
                    <input
                      type="text"
                      value={form.merchant_name}
                      onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
                      placeholder="Contoh: Alfamart"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <RSelect
                      label="Dompet"
                      value={form.wallet_id}
                      options={walletOptions}
                      onChange={(v) => setForm({ ...form, wallet_id: v ?? '' })}
                    />
                    <RSelect
                      label="Kategori"
                      value={form.category_id}
                      options={categoryOptions}
                      onChange={(v) => setForm({ ...form, category_id: v ?? '' })}
                    />
                  </div>

                  <div>
                    <DateInput
                      label="Tanggal Transaksi"
                      value={form.transaction_date || null}
                      onChange={(d) =>
                        setForm({
                          ...form,
                          transaction_date: d ? d.toISOString().slice(0, 10) : '',
                        })
                      }
                      placeholderText="Pilih tanggal"
                    />
                  </div>

                  <Textarea
                    label="Catatan"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tambahkan catatan transaksi…"
                  />

                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Batal Edit
                    </button>
                    <Button
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        saveMutation.mutate()
                      }}
                      loading={saveMutation.isPending}
                      disabled={!form.wallet_id || !form.category_id || form.amount <= 0}
                    >
                      <HiOutlineCheckCircle className="mr-1 h-4 w-4" />
                      Simpan Transaksi
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {history.length > 0 ? (
        <div
          className="mt-8 rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
            <div className="flex items-center gap-2">
              <HiOutlineClock className="h-5 w-5 text-brand-600 animate-pulse" />
              <h3 className="text-base font-extrabold text-slate-900">Riwayat Scan Struk</h3>
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {history.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedHistory(allHistorySelected ? new Set() : new Set(history.map((item) => item.id)))
                }
                className="rounded-xl border border-white/80 bg-white/62 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white"
              >
                {allHistorySelected ? 'Batal pilih' : 'Pilih semua'}
              </button>
              {selectedCount > 0 ? (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<HiOutlineTrash className="h-4 w-4" />}
                  onClick={() => deleteHistoryItems(Array.from(selectedHistory))}
                >
                  Hapus ({selectedCount})
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {groupHistoryByDay(history).map((group) => (
              <div key={group.label}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((entry) => (
                    <div
                      key={entry.id}
                      className="group relative flex gap-3 rounded-2xl border border-white/70 bg-white/62 p-3 text-left shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-lg hover:shadow-brand-100/30"
                    >
                      <input
                        type="checkbox"
                        checked={selectedHistory.has(entry.id)}
                        onChange={(event) => {
                          setSelectedHistory((prev) => {
                            const next = new Set(prev)
                            if (event.target.checked) next.add(entry.id)
                            else next.delete(entry.id)
                            return next
                          })
                        }}
                        aria-label="Pilih riwayat scan"
                        className="mt-5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setViewing(entry)}
                        className="flex min-w-0 flex-1 gap-3 text-left"
                      >
                      <span className="absolute right-3 bottom-3 grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white opacity-0 shadow-lg shadow-brand-200 transition group-hover:opacity-100">
                        <HiOutlineEye className="h-4 w-4" />
                      </span>
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
                        {entry.imagePreview ? (
                          <img
                            src={entry.imagePreview}
                            alt="Struk"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                            <HiOutlinePhoto className="h-5 w-5" />
                            <span className="text-[10px]">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                              entry.type === 'income'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200',
                            )}
                          >
                            {entry.type === 'income' ? '+' : '-'}
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0,
                            }).format(entry.amount)}
                          </span>
                          <span className="text-[10px] tabular-nums text-slate-400 font-medium">
                            {formatTimeLabel(entry.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {entry.merchant}
                        </p>
                        {entry.description ? (
                          <p className="line-clamp-1 text-xs text-slate-400 font-medium">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                    </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Scan"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="danger"
              onClick={() => {
                if (!viewing) return
                deleteHistoryItems([viewing.id])
              }}
            >
              Hapus Riwayat
            </Button>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {viewing ? (
          <div className="space-y-4">
            {viewing.imagePreview ? (
              <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-inner">
                <img
                  src={viewing.imagePreview}
                  alt="Struk"
                  className="mx-auto max-h-96 object-contain"
                />
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-100 p-8 text-center text-sm text-slate-500">
                <HiOutlinePhoto className="h-8 w-8" />
                <p className="mt-3 font-semibold text-slate-900">Tidak ada foto struk</p>
                <p className="mt-1 text-xs text-slate-500">Hanya data AI yang tersedia untuk scan ini.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Tipe</p>
                <Badge tone={viewing.type === 'income' ? 'green' : 'red'}>
                  {viewing.type === 'income' ? t.transactions.income : t.transactions.expense}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-400">Nominal</p>
                <p className="font-semibold text-slate-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0,
                  }).format(viewing.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Merchant</p>
                <p className="text-slate-800">{viewing.merchant}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Kategori</p>
                <p className="text-slate-800">{viewing.categoryName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tanggal Transaksi</p>
                <p className="text-slate-800">{viewing.transactionDate || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Scan pada</p>
                <p className="text-slate-800">
                  {new Date(viewing.timestamp).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {viewing.description ? (
              <div>
                <p className="text-xs text-slate-400">Catatan</p>
                <p className="text-sm text-slate-800">{viewing.description}</p>
              </div>
            ) : null}
            {viewing.lineItems?.length ? (
              <div>
                <p className="mb-2 text-xs text-slate-400">Item Struk</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60">
                  {viewing.lineItems.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start justify-between gap-3 px-3 py-2 text-xs text-slate-700"
                    >
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
