import { useCallback, useEffect, useState, type ChangeEvent, type DragEvent, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { aiApi, aiLogApi } from '@/features/ai/api'
import { categoryApi } from '@/features/categories/api'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { subscriptionApi } from '@/features/subscription/api'

import { PageHeader, type SelectOption } from '@/components/ui'
import { WalletRequiredState } from '@/components/WalletRequiredState'

import { useT } from '@/i18n'
import type { TransactionType } from '@/types/api'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { confirm } from '@/lib/confirm'
import {
  ReceiptImagePreviewCard,
  ReceiptMobileProcessingBanner,
  ReceiptProcessingCard,
  ReceiptTransactionPanel,
  ReceiptStepsList,
  ReceiptUploadPanel,
  ScanHistoryDetailModal,
  ScanHistoryPanel,
} from '../components/ScanReceiptPanels'
import { validateImageFile } from '@/lib/files'
import { useAuthStore } from '@/stores/authStore'
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
const SCAN_DRAFT_DB = 'saku-scan-receipt-preview-db'
const SCAN_DRAFT_STORE = 'previews'

function openScanDraftDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(SCAN_DRAFT_DB, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SCAN_DRAFT_STORE)) db.createObjectStore(SCAN_DRAFT_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readScanPreview(key: string): Promise<string> {
  if (!('indexedDB' in window)) return ''
  const db = await openScanDraftDB()
  return new Promise((resolve) => {
    const tx = db.transaction(SCAN_DRAFT_STORE, 'readonly')
    const request = tx.objectStore(SCAN_DRAFT_STORE).get(key)
    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : '')
    request.onerror = () => resolve('')
    tx.oncomplete = () => db.close()
  })
}

async function writeScanPreview(key: string, value: string): Promise<void> {
  if (!('indexedDB' in window) || !value) return
  const db = await openScanDraftDB()
  return new Promise((resolve) => {
    const tx = db.transaction(SCAN_DRAFT_STORE, 'readwrite')
    tx.objectStore(SCAN_DRAFT_STORE).put(value, key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      resolve()
    }
  })
}

async function deleteScanPreview(key: string): Promise<void> {
  if (!('indexedDB' in window)) return
  const db = await openScanDraftDB()
  return new Promise((resolve) => {
    const tx = db.transaction(SCAN_DRAFT_STORE, 'readwrite')
    tx.objectStore(SCAN_DRAFT_STORE).delete(key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      resolve()
    }
  })
}

export function ScanReceiptPage() {
  const t = useT()
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const draftKey = user?.id ? `${SCAN_DRAFT_KEY}:${user.id}` : token ? '' : `${SCAN_DRAFT_KEY}:anonymous`

  const [imagePreview, setImagePreview] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const scanRequestRef = useRef(0)

  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const [localSavedHistory, setLocalSavedHistory] = useState<ScanHistoryEntry[]>([])
  const [viewing, setViewing] = useState<ScanHistoryEntry | null>(null)
  const [selectedHistory, setSelectedHistory] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setHistory([])
    setLocalSavedHistory([])
    setSelectedHistory(new Set())
    setViewing(null)
  }, [user?.id])

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
    setDraftReady(false)
    if (!draftKey) {
      setDraftReady(true)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        if (user?.id) window.localStorage.removeItem(SCAN_DRAFT_KEY)
        const raw = window.localStorage.getItem(draftKey)
        if (!raw) {
          if (!cancelled) {
            setImagePreview('')
            setExtractedData(null)
            setIsEditing(false)
          }
          return
        }
        const draft = JSON.parse(raw) as {
          imagePreview?: string
          isEditing?: boolean
          extractedData?: ExtractedReceipt | null
          form?: typeof form
        }
        const restoredPreview = draft.imagePreview
          ? draft.imagePreview.startsWith('data:')
            ? draft.imagePreview
            : `data:image/webp;base64,${draft.imagePreview}`
          : await readScanPreview(draftKey)
        if (cancelled) return
        if (restoredPreview) setImagePreview(restoredPreview)
        if (draft.extractedData) setExtractedData(draft.extractedData)
        if (draft.form) setForm(draft.form)
        if (typeof draft.isEditing === 'boolean') setIsEditing(draft.isEditing)
      } catch {
        window.localStorage.removeItem(draftKey)
      } finally {
        if (!cancelled) setDraftReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [draftKey, user?.id])

  useEffect(() => {
    if (!draftKey || !draftReady) return
    if (!imagePreview && !extractedData) {
      window.localStorage.removeItem(draftKey)
      void deleteScanPreview(draftKey)
      return
    }
    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ isEditing, extractedData, form }),
      )
    } catch {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ isEditing, extractedData, form }),
      )
    }
    if (imagePreview) void writeScanPreview(draftKey, imagePreview)
  }, [draftKey, draftReady, extractedData, form, imagePreview, isEditing])

  const wallets = useQuery({ queryKey: ['wallets', user?.id], queryFn: walletApi.list, enabled: Boolean(user?.id) })
  const categories = useQuery({
    queryKey: ['categories', 'all', user?.id],
    queryFn: () => categoryApi.list(),
    enabled: Boolean(user?.id),
  })
  const scanLogsQ = useQuery({
    queryKey: ['ai-logs', 'scan-receipt-history', user?.id],
    queryFn: () => aiLogApi.scanReceiptHistory(1, 100),
    enabled: Boolean(user?.id),
  })
  const activeSubscriptionQ = useQuery({
    queryKey: ['subscription', 'active', user?.id],
    queryFn: subscriptionApi.active,
    enabled: Boolean(user?.id),
    staleTime: 60 * 1000,
  })
  const monthlyScanCount = (scanLogsQ.data?.data ?? []).filter((log) => {
    const date = new Date(log.created_at)
    const now = new Date()
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }).length
  const planCode = activeSubscriptionQ.data?.plan_code ?? 'free'
  const ocrLimit = planCode.includes('premium') ? 300 : planCode.includes('pro') ? 100 : 10
  const shouldWarnQuota = monthlyScanCount >= Math.max(1, Math.floor(ocrLimit * 0.8))

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
    const rows = logs.map(scanLogToHistory)
    const seen = new Set(rows.map((item) => item.id))
    const merged = [...rows, ...localSavedHistory.filter((item) => !seen.has(item.id))]
    const nextHistory = merged.sort((a, b) => b.timestamp - a.timestamp)
    const timer = window.setTimeout(() => setHistory(nextHistory), 0)
    return () => window.clearTimeout(timer)
  }, [localSavedHistory, scanLogsQ.data])

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
    mutationFn: async ({ base64 }: { base64: string; requestId: number }) =>
      aiApi.scanReceipt({ image_base64: base64, media_type: 'image/webp' }),
    onSuccess: (data, vars) => {
      if (vars.requestId !== scanRequestRef.current) return
      trackEvent(analyticsEvents.receiptScanUsed, {
        feature_name: 'receipt_scan',
      })
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
    onError: (e, vars) => {
      if (vars.requestId !== scanRequestRef.current) return
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
        await aiApi.promoteScanImage(extractedData.image_key, extractedData.log_id).catch(() => undefined)
      }
      const categoryName =
        (categories.data ?? []).find((category) => category.id === form.category_id)?.name ??
        extractedData?.category
      const savedHistory: ScanHistoryEntry = {
        id: extractedData?.log_id || `local-${Date.now()}`,
        timestamp: Date.now(),
        imagePreview,
        amount: form.amount,
        type: form.type,
        merchant: cleanMerchant(form.merchant_name),
        description: form.description || resolveScanDescription(extractedData ?? {}),
        transactionDate: form.transaction_date,
        categoryName,
        ocrText: extractedData?.ocr_text,
        lineItems: extractedData?.line_items,
        confidence: extractedData?.confidence,
      }
      setLocalSavedHistory((prev) => {
        const next = prev.filter((item) => item.id !== savedHistory.id)
        return [savedHistory, ...next].slice(0, 20)
      })
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

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    const validationError = validateImageFile(file, { maxSizeMb: 5 })
    if (validationError) {
      toast.error(validationError)
      return
    }
      try {
        const optimizedPreview = await imageFileToOptimizedBase64(file)
        const requestId = scanRequestRef.current + 1
        scanRequestRef.current = requestId
        setImagePreview(`data:image/webp;base64,${optimizedPreview}`)
        scanMutation.mutate({ base64: optimizedPreview, requestId })
      } catch (error) {
        toast.error(toErrorMessage(error))
      }
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
    if (draftKey) {
      window.localStorage.removeItem(draftKey)
      void deleteScanPreview(draftKey)
    }
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
  if (!wallets.isLoading && (wallets.data ?? []).length === 0) {
    return <WalletRequiredState feature="scanReceipt" />
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-0 bottom-10 h-[420px] w-[420px] rounded-full bg-brand-200/10 blur-3xl" />
      </div>

      <PageHeader title={t.scanReceipt.title} subtitle={t.scanReceipt.subtitle} />
      {shouldWarnQuota ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-extrabold">OCR usage is close to your monthly limit.</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            You have used {monthlyScanCount} of {ocrLimit} OCR scans this month. Upgrade or reduce scans to avoid interruption.
          </p>
        </div>
      ) : null}
      {scanMutation.isPending ? <ReceiptMobileProcessingBanner /> : null}

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
          {scanMutation.isPending ? (
            <>
              <ReceiptImagePreviewCard
                imagePreview={imagePreview}
                isProcessing
                hasExtractedData={Boolean(extractedData)}
                onReset={resetForm}
              />
              <ReceiptProcessingCard />
            </>
          ) : (
            <>
              <ReceiptImagePreviewCard
                imagePreview={imagePreview}
                isProcessing={false}
                hasExtractedData={Boolean(extractedData)}
                onReset={resetForm}
              />
              <div className="space-y-4">
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
                onReadonlyClick={() => toast.info('Klik Edit Detail dulu untuk mengubah hasil scan.')}
              />
              </div>
            </>
          )}
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
