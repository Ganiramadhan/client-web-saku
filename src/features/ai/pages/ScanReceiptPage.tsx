import { useCallback, useEffect, useState, type ChangeEvent, type DragEvent, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { aiApi, aiLogApi } from '@/features/ai/api'
import { categoryApi } from '@/features/categories/api'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'

import { PageHeader, type SelectOption } from '@/components/ui'

import { useT } from '@/i18n'
import type { TransactionType } from '@/types/api'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { confirm } from '@/lib/confirm'
import {
  ReceiptImagePreviewCard,
  ReceiptProcessingCard,
  ReceiptTransactionPanel,
  ReceiptStepsList,
  ReceiptUploadPanel,
  ScanHistoryDetailModal,
  ScanHistoryPanel,
} from '../components/ScanReceiptPanels'
import { validateImageFile } from '@/lib/files'
import {
  cleanMerchant,
  groupHistoryByDay,
  imageFileToOptimizedBase64,
  normalizeCategoryName,
  parseScannedDate,
  resolveScanDescription,
  scanLogToHistory,
  type ExtractedReceipt,
  type ScanHistoryEntry,
} from '../utils/receipt'

const SCAN_DRAFT_KEY = 'saku-scan-receipt-draft'

export function ScanReceiptPage() {
  const t = useT()
  const qc = useQueryClient()

  const [imagePreview, setImagePreview] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SCAN_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as {
        imagePreview?: string
        isEditing?: boolean
        extractedData?: ExtractedReceipt | null
        form?: typeof form
      }
      if (draft.imagePreview) setImagePreview(draft.imagePreview)
      if (draft.extractedData) setExtractedData(draft.extractedData)
      if (draft.form) setForm(draft.form)
      if (typeof draft.isEditing === 'boolean') setIsEditing(draft.isEditing)
    } catch {
      window.localStorage.removeItem(SCAN_DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (!imagePreview && !extractedData) {
      window.localStorage.removeItem(SCAN_DRAFT_KEY)
      return
    }
    window.localStorage.setItem(
      SCAN_DRAFT_KEY,
      JSON.stringify({ imagePreview, isEditing, extractedData, form }),
    )
  }, [extractedData, form, imagePreview, isEditing])

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
      return aiApi.scanReceipt({ image_base64: base64, media_type: 'image/webp' })
    },
    onSuccess: (data) => {
      const d = { ...(data as ExtractedReceipt), merchant_name: cleanMerchant((data as ExtractedReceipt).merchant_name) }
      const nextType = (d.type as TransactionType) || 'expense'
      const description = resolveScanDescription(d)
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
    onSuccess: async (savedTx) => {
      void savedTx
      if (extractedData?.image_key) {
        await aiApi.promoteScanImage(extractedData.image_key).catch(() => undefined)
      }
      toast.success('Transaksi berhasil disimpan!')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['transactions'] }),
        qc.invalidateQueries({ queryKey: ['ai-logs', 'scan-receipt-history'] }),
        qc.invalidateQueries({ queryKey: ['savings-goals'] }),
        qc.invalidateQueries({ queryKey: ['wallets'] }),
      ])
      resetForm()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const handleFile = (file: File | undefined | null) => {
    if (!file) return
    const validationError = validateImageFile(file, { maxSizeMb: 5 })
    if (validationError) {
      toast.error(validationError)
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
    window.localStorage.removeItem(SCAN_DRAFT_KEY)
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
  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-0 bottom-10 h-[420px] w-[420px] rounded-full bg-brand-200/10 blur-3xl" />
      </div>

      <PageHeader title={t.scanReceipt.title} subtitle={t.scanReceipt.subtitle} />

      {!imagePreview ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <ReceiptUploadPanel
            uploadInputRef={uploadInputRef}
            isDragging={isDragging}
            isPending={scanMutation.isPending}
            onPickFile={() => uploadInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onFileChange={handleFileChange}
          />

          <ReceiptStepsList />
        </div>
      ) : (
        /* ─── Result + Form ─── */
        <div className="grid gap-5 lg:grid-cols-[400px_1fr] lg:gap-8">
          <ReceiptImagePreviewCard
            imagePreview={imagePreview}
            isProcessing={scanMutation.isPending}
            hasExtractedData={Boolean(extractedData)}
            onReset={resetForm}
          />

          <div className="space-y-4">
            {scanMutation.isPending ? (
              <ReceiptProcessingCard />
            ) : (
              <ReceiptTransactionPanel
                form={form}
                isEditing={isEditing}
                typeOptions={[
                  { value: 'expense', label: t.transactions.expense },
                  { value: 'income', label: t.transactions.income },
                ]}
                walletOptions={walletOptions}
                categoryOptions={categoryOptions}
                saveLoading={saveMutation.isPending}
                saveDisabled={!form.wallet_id || !form.category_id || form.amount <= 0}
                onFormChange={setForm}
                onEdit={() => setIsEditing(true)}
                onCancelEdit={() => setIsEditing(false)}
                onSave={() => saveMutation.mutate()}
              />
            )}
          </div>
        </div>
      )}

      <ScanHistoryPanel
        history={history}
        selectedHistory={selectedHistory}
        selectedCount={selectedCount}
        allHistorySelected={allHistorySelected}
        groups={groupHistoryByDay(history)}
        onToggleAll={() =>
          setSelectedHistory(allHistorySelected ? new Set() : new Set(history.map((item) => item.id)))
        }
        onToggleItem={(id, checked) => {
          setSelectedHistory((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
          })
        }}
        onOpen={setViewing}
        onDeleteSelected={() => deleteHistoryItems(Array.from(selectedHistory))}
      />

      <ScanHistoryDetailModal
        viewing={viewing}
        typeLabel={(type) => (type === 'income' ? t.transactions.income : t.transactions.expense)}
        onClose={() => setViewing(null)}
        onDelete={(id) => deleteHistoryItems([id])}
      />
    </div>
  )
}
