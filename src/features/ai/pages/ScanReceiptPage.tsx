import { useEffect, useState, type ChangeEvent, type DragEvent, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineClock,
} from 'react-icons/hi2'

import { aiApi, aiLogApi } from '@/features/ai/api'
import { categoryApi } from '@/features/categories/api'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'

import {
  Badge,
  Button,
  Card,
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
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeDayLabel, formatTimeLabel } from '@/lib/dateLabel'

interface ExtractedReceipt {
  amount?: number
  type?: TransactionType
  category?: string
  merchant_name?: string
  ocr_text?: string
  date?: string
  confidence?: number
}

function buildScanDescription(d: { merchant_name?: string; ocr_text?: string }): string {
  const merchant = (d.merchant_name || '').trim()
  if (merchant) return `Scan struk - ${merchant}`
  const firstLine = (d.ocr_text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (firstLine) return firstLine.slice(0, 120)
  return 'Scan struk'
}

function parseScannedDate(raw?: string): string {
  if (!raw) return new Date().toISOString().split('T')[0]
  // Accept YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0]
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
  confidence?: number
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

export function ScanReceiptPage() {
  const t = useT()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [imagePreview, setImagePreview] = useState<string>('')
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const [viewing, setViewing] = useState<ScanHistoryEntry | null>(null)

  const historyQ = useQuery({
    queryKey: ['ai-logs', 'scan_receipt'],
    queryFn: () => aiLogApi.list('scan_receipt', 1, 50),
    enabled: !!user?.id,
  })
  useEffect(() => {
    const rows = historyQ.data?.data ?? []
    const mapped: ScanHistoryEntry[] = rows
      .filter((r) => r.status === 'success')
      .map((r) => {
        const raw = (r.raw_response ?? {}) as Record<string, unknown>
        const rawType = typeof raw.type === 'string' ? (raw.type as string) : 'expense'
        const rawDate = typeof raw.date === 'string' ? (raw.date as string) : ''
        const rawOcr = typeof raw.ocr_text === 'string' ? (raw.ocr_text as string) : undefined
        return {
          id: r.id,
          timestamp: new Date(r.created_at).getTime(),
          imagePreview: r.image_url ?? '',
          amount: r.extracted_amount ?? 0,
          type: (rawType === 'income' ? 'income' : 'expense') as TransactionType,
          merchant: r.extracted_merchant ?? '',
          description: r.extracted_merchant ? `Scan struk - ${r.extracted_merchant}` : 'Scan struk',
          transactionDate: rawDate || r.created_at.split('T')[0],
          categoryName: r.extracted_category,
          ocrText: rawOcr,
          confidence: r.confidence_score,
        }
      })
    setHistory(mapped)
  }, [historyQ.data])

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

  useEffect(() => {
    if (form.wallet_id) return
    const list = wallets.data
    if (!list || list.length === 0) return
    const def = list.find((w) => w.is_default) ?? list[0]
    setForm((prev) => (prev.wallet_id ? prev : { ...prev, wallet_id: def.id }))
  }, [wallets.data])

  const findCategoryId = (categoryName?: string): string | undefined => {
    if (!categoryName) return undefined
    return categories.data?.find(
      (c) =>
        c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes(c.name.toLowerCase()),
    )?.id
  }

  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })
      return aiApi.scanReceipt({ image_base64: base64 })
    },
    onSuccess: (data) => {
      const d = data as ExtractedReceipt
      setExtractedData(d)
      setForm((prev) => ({
        ...prev,
        amount: d.amount || 0,
        merchant_name: d.merchant_name || '',
        category_id: findCategoryId(d.category) || prev.category_id,
        description: buildScanDescription(d),
        type: (d.type as TransactionType) || 'expense',
        transaction_date: parseScannedDate(d.date),
      }))
      toast.success('Struk berhasil di-scan!')
      qc.invalidateQueries({ queryKey: ['ai-logs', 'scan_receipt'] })
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
    onSuccess: () => {
      toast.success('Transaksi berhasil disimpan!')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      qc.invalidateQueries({ queryKey: ['ai-logs', 'scan_receipt'] })
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

  const filteredCats = categories.data?.filter((c) => c.type === form.type) ?? []
  const walletOptions: SelectOption[] = (wallets.data ?? []).map((w) => ({
    value: w.id,
    label: w.name,
  }))
  const categoryOptions: SelectOption[] = filteredCats.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const conf = extractedData?.confidence ?? 0
  const confTone: 'green' | 'amber' | 'red' =
    conf >= 0.8 ? 'green' : conf >= 0.5 ? 'amber' : 'red'

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t.scanReceipt.title} subtitle={t.scanReceipt.subtitle} />

      {!imagePreview ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
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
                'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all',
                isDragging
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50',
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
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  {scanMutation.isPending ? (
                    <HiOutlineArrowPath className="h-10 w-10 animate-spin text-brand-600" />
                  ) : (
                    <HiOutlineCloudArrowUp className="h-10 w-10 text-brand-600" />
                  )}
                </div>
                {!scanMutation.isPending && (
                  <span className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow ring-2 ring-white">
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
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  <HiOutlinePhoto className="h-3.5 w-3.5" /> JPG / PNG / WEBP
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  Maks. 5 MB
                </span>
              </div>
            </button>
          </Card>

          {/* Tips card */}
          <Card>
            <div className="flex items-center gap-2">
              <HiOutlineSparkles className="h-5 w-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Tips Hasil Maksimal
              </h3>
            </div>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
              {[
                'Foto struk dalam pencahayaan terang dan rata.',
                'Pastikan teks pada struk fokus dan tidak buram.',
                'Hindari bayangan atau lipatan pada struk.',
                'Crop area struk saja, hilangkan latar belakang.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        /* ─── Result + Form ─── */
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* LEFT — preview */}
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Foto Struk
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pastikan hasil scan terlihat jelas
                </p>
              </div>
              {extractedData ? (
                <Badge tone={confTone}>{(conf * 100).toFixed(0)}% akurat</Badge>
              ) : null}
            </div>

            <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                src={imagePreview}
                alt="Struk"
                className="h-full w-full object-contain"
              />
              {scanMutation.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white px-4 py-3 shadow">
                    <HiOutlineArrowPath className="h-6 w-6 animate-spin text-brand-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      AI memproses…
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {extractedData ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                    <HiOutlineSparkles className="h-4 w-4 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      Hasil AI
                    </h4>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                      Data terisi otomatis. Kamu masih bisa mengubah sebelum
                      disimpan.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={resetForm}
              leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
            >
              Scan Struk Lain
            </Button>
          </Card>

          {/* RIGHT — form */}
          <Card>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <HiOutlineDocumentText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Review Transaksi
                </h3>
                <p className="text-xs text-slate-500">
                  Periksa kembali data sebelum disimpan
                </p>
              </div>
            </div>

            {scanMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                  <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  AI sedang memproses
                </h4>
                <p className="mt-1.5 text-xs text-slate-500">
                  Membaca nominal, merchant, dan kategori transaksi…
                </p>
                <div className="mt-5 flex w-48 gap-1">
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-200 [animation-delay:0ms]" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-300 [animation-delay:200ms]" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-400 [animation-delay:400ms]" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-5">
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
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      {t.common.amount}
                    </label>
                    <CurrencyInput
                      value={form.amount}
                      onChange={(val) => setForm({ ...form, amount: val })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t.transactions.merchant}
                  </label>
                  <input
                    type="text"
                    value={form.merchant_name}
                    onChange={(e) =>
                      setForm({ ...form, merchant_name: e.target.value })
                    }
                    placeholder="Contoh: Alfamart"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <RSelect
                    label={t.transactions.wallet}
                    value={form.wallet_id}
                    options={walletOptions}
                    onChange={(v) => setForm({ ...form, wallet_id: v ?? '' })}
                  />
                  <RSelect
                    label={t.transactions.category}
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

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={resetForm}>
                    <HiOutlineArrowPath className="mr-1 h-4 w-4" />
                    Scan Lagi
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    loading={saveMutation.isPending}
                    disabled={
                      !form.wallet_id ||
                      !form.category_id ||
                      form.amount <= 0
                    }
                  >
                    <HiOutlineCheckCircle className="mr-1 h-4 w-4" />
                    Simpan Transaksi
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {history.length > 0 ? (
        <Card className="mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HiOutlineClock className="h-5 w-5 text-brand-600" />
              <h3 className="text-base font-semibold text-slate-900">Riwayat Scan</h3>
              <Badge tone="gray">{history.length}</Badge>
            </div>
          </div>

          <div className="mt-3 space-y-5">
            {groupHistoryByDay(history).map((group) => (
              <div key={group.label}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setViewing(entry)}
                      className="group relative flex gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-sm"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                        {entry.imagePreview ? (
                          <img
                            src={entry.imagePreview}
                            alt="Struk"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <HiOutlinePhoto className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge tone={entry.type === 'income' ? 'green' : 'red'}>
                            {entry.type === 'income' ? '+' : '-'}
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0,
                            }).format(entry.amount)}
                          </Badge>
                          <span className="text-[10px] tabular-nums text-slate-400">
                            {formatTimeLabel(entry.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-slate-900">
                          {entry.merchant || '—'}
                        </p>
                        {entry.description ? (
                          <p className="line-clamp-1 text-xs text-slate-500">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Scan"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Tutup
          </Button>
        }
      >
        {viewing ? (
          <div className="space-y-4">
            {viewing.imagePreview ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img
                  src={viewing.imagePreview}
                  alt="Struk"
                  className="mx-auto max-h-96 object-contain"
                />
              </div>
            ) : null}
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
                <p className="text-slate-800">{viewing.merchant || '—'}</p>
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
              {viewing.confidence != null ? (
                <div>
                  <p className="text-xs text-slate-400">Confidence</p>
                  <p className="text-slate-800">{(viewing.confidence * 100).toFixed(0)}%</p>
                </div>
              ) : null}
            </div>
            {viewing.description ? (
              <div>
                <p className="text-xs text-slate-400">Catatan</p>
                <p className="text-sm text-slate-800">{viewing.description}</p>
              </div>
            ) : null}
            {viewing.ocrText ? (
              <div>
                <p className="mb-1 text-xs text-slate-400">Hasil OCR</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  {viewing.ocrText}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
