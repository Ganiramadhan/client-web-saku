import type { ChangeEventHandler, DragEventHandler, ReactNode, RefObject } from 'react'
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { Badge, Button, CurrencyInput, DateInput, Modal, RSelect, Textarea, type SelectOption } from '@/components/ui'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { formatTimeLabel } from '@/lib/dateLabel'
import type { TransactionType } from '@/types/api'
import type { ScanHistoryEntry } from '../utils/receipt'

interface ReceiptFormState {
  wallet_id: string
  category_id: string
  amount: number
  type: TransactionType
  merchant_name: string
  description: string
  transaction_date: string
}

const SCAN_COPY = {
  id: {
    upload: 'Upload Foto Struk',
    processingReceipt: 'Memproses Struk...',
    processingHint: 'AI sedang membaca nominal, merchant, dan kategori.',
    uploadHint: 'Tarik & lepas foto, atau klik untuk memilih file. AI akan mengisi data otomatis.',
    chooseFile: 'Pilih File',
    maxSize: 'Maks. 5 MB',
    stepsTitle: 'Cara Kerja Scan Struk',
    steps: [
      ['Upload Struk', 'Pilih file gambar struk dari perangkat.'],
      ['AI Ekstraksi Data', 'AI akan membaca otomatis nominal, merchant, tanggal, dan kategori.'],
      ['Review Detail', 'Periksa kembali data transaksi hasil ekstraksi sebelum disimpan.'],
      ['Konfirmasi & Simpan', 'Simpan data ke dompet Anda sebagai transaksi baru.'],
    ],
    receiptPhoto: 'Foto Struk',
    receiptPhotoHint: 'Hasil jepretan atau file yang diupload',
    dataRead: 'Data terbaca',
    scanAgain: 'Ulangi / Foto Lain',
    processing: 'AI sedang memproses',
    processingDetail: 'Membaca nominal, merchant, tanggal, dan kategori transaksi...',
    processingMobileTitle: 'Sedang membaca struk',
    processingMobileDesc: 'Tunggu sebentar, AI sedang mengekstrak detail transaksi.',
    previewTitle: 'Preview Detail Transaksi',
    editTitle: 'Edit Detail Transaksi',
    previewDesc: 'Readonly hasil ekstraksi struk sebelum disimpan',
    editDesc: 'Sesuaikan data hasil ekstraksi struk',
    readonlyHint: 'Klik Edit Detail dulu untuk mengubah hasil scan.',
    type: 'Tipe Transaksi',
    amount: 'Nominal',
    merchant: 'Merchant',
    wallet: 'Dompet',
    category: 'Kategori',
    date: 'Tanggal Transaksi',
    pickDate: 'Pilih tanggal',
    note: 'Catatan',
    notePlaceholder: 'Tambahkan catatan transaksi...',
    cancelEdit: 'Batal Edit',
    editDetail: 'Edit Detail',
    save: 'Simpan Transaksi',
    history: 'Riwayat Scan Struk',
    selectAll: 'Pilih semua',
    cancelSelect: 'Batal pilih',
    delete: 'Hapus',
    detail: 'Detail Scan',
    deleteHistory: 'Hapus Riwayat',
    noImage: 'Tidak ada foto struk',
    noImageDesc: 'Hanya data AI yang tersedia untuk scan ini.',
    typeLabel: 'Tipe',
    scannedAt: 'Scan pada',
    items: 'Item Struk',
  },
  en: {
    upload: 'Upload Receipt Photo',
    processingReceipt: 'Processing Receipt...',
    processingHint: 'AI is reading amount, merchant, and category.',
    uploadHint: 'Drag and drop a photo, or click to choose a file. AI will fill the data automatically.',
    chooseFile: 'Choose File',
    maxSize: 'Max. 5 MB',
    stepsTitle: 'How Receipt Scan Works',
    steps: [
      ['Upload Receipt', 'Choose a receipt image from your device.'],
      ['AI Data Extraction', 'AI reads amount, merchant, date, and category automatically.'],
      ['Review Details', 'Review extracted transaction details before saving.'],
      ['Confirm & Save', 'Save the data to your wallet as a new transaction.'],
    ],
    receiptPhoto: 'Receipt Photo',
    receiptPhotoHint: 'Captured or uploaded file',
    dataRead: 'Data read',
    scanAgain: 'Retake / Another Photo',
    processing: 'AI is processing',
    processingDetail: 'Reading amount, merchant, date, and transaction category...',
    processingMobileTitle: 'Reading receipt',
    processingMobileDesc: 'Hang tight, AI is extracting the transaction details.',
    previewTitle: 'Transaction Detail Preview',
    editTitle: 'Edit Transaction Details',
    previewDesc: 'Readonly receipt extraction before saving',
    editDesc: 'Adjust extracted receipt details',
    readonlyHint: 'Click Edit Details first to change the scan result.',
    type: 'Transaction Type',
    amount: 'Amount',
    merchant: 'Merchant',
    wallet: 'Wallet',
    category: 'Category',
    date: 'Transaction Date',
    pickDate: 'Pick date',
    note: 'Note',
    notePlaceholder: 'Add transaction note...',
    cancelEdit: 'Cancel Edit',
    editDetail: 'Edit Details',
    save: 'Save Transaction',
    history: 'Receipt Scan History',
    selectAll: 'Select all',
    cancelSelect: 'Cancel selection',
    delete: 'Delete',
    detail: 'Scan Detail',
    deleteHistory: 'Delete History',
    noImage: 'No receipt photo',
    noImageDesc: 'Only AI data is available for this scan.',
    typeLabel: 'Type',
    scannedAt: 'Scanned at',
    items: 'Receipt Items',
  },
} as const

function useScanCopy() {
  const { locale } = useLocale()
  return SCAN_COPY[locale]
}

const receiptSteps = [
  {
    num: '01',
    Icon: HiOutlineCloudArrowUp,
    title: 'Upload Struk',
    desc: 'Pilih file gambar struk dari perangkat.',
    color: 'text-cyan-600',
    bg: 'rgba(236,254,255,0.90)',
    border: 'rgba(165,243,252,0.70)',
  },
  {
    num: '02',
    Icon: HiOutlineSparkles,
    title: 'AI Ekstraksi Data',
    desc: 'Sistem cerdas AI akan membaca otomatis nominal, nama toko/merchant, tanggal, dan kategori.',
    color: 'text-brand-700',
    bg: 'rgba(255,228,220,0.72)',
    border: 'rgba(255,157,141,0.34)',
  },
  {
    num: '03',
    Icon: HiOutlineDocumentText,
    title: 'Review Detail',
    desc: 'Periksa kembali data transaksi hasil ekstraksi sebelum disimpan.',
    color: 'text-amber-700',
    bg: 'rgba(253,223,130,0.42)',
    border: 'rgba(245,158,11,0.18)',
  },
  {
    num: '04',
    Icon: HiOutlineCheckCircle,
    title: 'Konfirmasi & Simpan',
    desc: 'Simpan data ke dompet Anda seketika sebagai transaksi baru.',
    color: 'text-emerald-700',
    bg: 'rgba(236,253,245,0.90)',
    border: 'rgba(167,243,208,0.70)',
  },
]

export function ReceiptUploadPanel({
  uploadInputRef,
  isDragging,
  isPending,
  onPickFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
}: {
  uploadInputRef: RefObject<HTMLInputElement | null>
  isDragging: boolean
  isPending: boolean
  onPickFile: () => void
  onDragOver: DragEventHandler<HTMLDivElement>
  onDragLeave: () => void
  onDrop: DragEventHandler<HTMLDivElement>
  onFileChange: ChangeEventHandler<HTMLInputElement>
}) {
  const copy = useScanCopy()
  return (
    <div
      className="rounded-[1.5rem] p-6 transition-all duration-300 lg:col-span-2"
      style={{
        background: 'rgba(255,250,246,0.64)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(23,18,15,0.10)',
        boxShadow: '0 18px 45px rgba(23,18,15,0.06)',
      }}
    >
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300',
          isDragging
            ? 'scale-[0.99] border-brand-500 bg-brand-50/50 shadow-inner'
            : 'border-[#17120f]/14 bg-white/50 hover:border-brand-300 hover:bg-white/80 hover:shadow-lg hover:shadow-brand-100/30',
          isPending && 'cursor-wait opacity-80',
        )}
      >
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          aria-label={copy.upload}
          title={copy.upload}
          className="hidden"
          onChange={onFileChange}
          disabled={isPending}
        />
        <div className="relative mb-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#17120f]/8">
            {isPending ? (
              <HiOutlineArrowPath className="h-10 w-10 animate-spin text-brand-600" />
            ) : (
              <HiOutlineCloudArrowUp className="h-10 w-10 text-brand-600" />
            )}
          </div>
          {!isPending && (
            <span className="absolute -right-1 -top-1 inline-flex h-7 w-7 animate-bounce items-center justify-center rounded-full bg-brand-600 text-white shadow ring-2 ring-white">
              <HiOutlineSparkles className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <h2 className="text-lg font-black text-[#17120f]">
          {isPending ? copy.processingReceipt : copy.upload}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#4f4540]">
          {isPending ? copy.processingHint : copy.uploadHint}
        </p>

        {!isPending && (
          <div className="mt-6 w-full max-w-xs">
            <Button type="button" onClick={onPickFile} className="w-full gap-2">
              <HiOutlineCloudArrowUp className="h-4 w-4" />
              {copy.chooseFile}
            </Button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
            <HiOutlinePhoto className="h-3.5 w-3.5" /> JPG / PNG / WEBP
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
            {copy.maxSize}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ReceiptStepsList() {
  const copy = useScanCopy()
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-600">
        {copy.stepsTitle}
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
            boxShadow: '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
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
              style={{ background: step.bg, border: `1px solid ${step.border}` }}
            >
              <step.Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{step.num}</span>
                <h4 className="text-sm font-bold text-slate-900">{copy.steps[Number(step.num) - 1]?.[0] ?? step.title}</h4>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">{copy.steps[Number(step.num) - 1]?.[1] ?? step.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ReceiptImagePreviewCard({
  imagePreview,
  isProcessing,
  hasExtractedData,
  onReset,
}: {
  imagePreview: string
  isProcessing: boolean
  hasExtractedData: boolean
  onReset: () => void
}) {
  const copy = useScanCopy()
  return (
    <div
      className="rounded-2xl p-4 sm:rounded-3xl sm:p-5"
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
          <h3 className="text-base font-bold text-slate-900">{copy.receiptPhoto}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{copy.receiptPhotoHint}</p>
        </div>
        {hasExtractedData ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {copy.dataRead}
          </span>
        ) : null}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
        <img src={imagePreview} alt="Struk" className="max-h-[70dvh] w-full object-contain" />
        {isProcessing ? <ReceiptProcessingOverlay /> : null}
      </div>

      <Button
        variant="ghost"
        className="mt-4 w-full rounded-2xl"
        onClick={onReset}
        leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
      >
        {copy.scanAgain}
      </Button>
    </div>
  )
}

export function ReceiptProcessingCard() {
  const copy = useScanCopy()
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-16 sm:rounded-3xl sm:py-24"
      style={{
        background: 'rgba(255,255,255,0.50)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.60)',
      }}
    >
      <div className="mb-4 flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-brand-50">
        <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand-600" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900">{copy.processing}</h4>
      <p className="mt-1.5 px-4 text-center text-xs text-slate-500">
        {copy.processingDetail}
      </p>
      <div className="mt-5 flex w-48 gap-1">
        <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-200 [animation-delay:0ms]" />
        <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-300 [animation-delay:200ms]" />
        <div className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-400 [animation-delay:400ms]" />
      </div>
    </div>
  )
}

export function ReceiptMobileProcessingBanner() {
  const copy = useScanCopy()
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-4 z-40 md:hidden">
      <div className="overflow-hidden rounded-3xl border border-brand-200 bg-white/96 px-4 py-5 text-center shadow-2xl shadow-brand-900/15 backdrop-blur-xl">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 shadow-sm ring-1 ring-brand-100">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200">
            <span className="scan-pulse-motion absolute inset-0 rounded-2xl bg-brand-500/35" />
            <HiOutlineArrowPath className="scan-spinner-motion relative h-6 w-6" />
          </div>
        </div>
        <p className="text-sm font-extrabold text-slate-950">{copy.processing}</p>
        <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-5 text-slate-500">{copy.processingDetail}</p>
        <div className="mx-auto mt-4 h-1.5 max-w-[14rem] overflow-hidden rounded-full bg-brand-100">
          <div className="scan-progress-motion h-full w-1/2 rounded-full bg-brand-600" />
        </div>
      </div>
    </div>
  )
}

function ReceiptProcessingOverlay() {
  const copy = useScanCopy()
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
      <div className="receipt-scan-motion pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-brand-400/35 to-transparent" />
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/80 bg-white/92 px-4 py-3 shadow-xl">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
          <span className="scan-pulse-motion absolute inset-0 rounded-xl bg-brand-400/25" />
          <HiOutlineArrowPath className="scan-spinner-motion relative h-6 w-6 text-brand-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{copy.processing}</span>
      </div>
    </div>
  )
}

export function ReceiptTransactionPanel({
  form,
  isEditing,
  typeOptions,
  walletOptions,
  categoryOptions,
  saveLoading,
  saveDisabled,
  onFormChange,
  onEdit,
  onCancelEdit,
  onSave,
  onReadonlyClick,
}: {
  form: ReceiptFormState
  isEditing: boolean
  typeOptions: SelectOption<TransactionType>[]
  walletOptions: SelectOption<string>[]
  categoryOptions: SelectOption<string>[]
  saveLoading: boolean
  saveDisabled: boolean
  onFormChange: (form: ReceiptFormState) => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onReadonlyClick?: () => void
}) {
  const copy = useScanCopy()
  return (
    <div className="rounded-2xl border border-white/80 bg-white/68 p-4 shadow-lg shadow-slate-200/35 backdrop-blur-2xl sm:p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <HiOutlineDocumentText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isEditing ? copy.editTitle : copy.previewTitle}
          </h3>
          <p className="text-[11px] text-slate-500">
            {isEditing ? copy.editDesc : copy.previewDesc}
          </p>
        </div>
      </div>

      <div
        className="space-y-4"
        onClickCapture={(event) => {
          if (isEditing) return
          const target = event.target as HTMLElement
          if (target.closest('button')) return
          onReadonlyClick?.()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <RSelect
            label={copy.type}
            value={form.type}
            options={typeOptions}
            onChange={(value) => isEditing && onFormChange({ ...form, type: (value as TransactionType) ?? 'expense' })}
            isDisabled={!isEditing}
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">{copy.amount}</label>
            <CurrencyInput
              value={form.amount}
              onChange={(amount) => onFormChange({ ...form, amount })}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">{copy.merchant}</label>
          <input
            type="text"
            value={form.merchant_name}
            readOnly={!isEditing}
            onChange={(event) => onFormChange({ ...form, merchant_name: event.target.value })}
            placeholder="Alfamart"
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm',
              isEditing
                ? 'border-slate-200 bg-white text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
                : 'border-white/80 bg-white/72 text-slate-700 backdrop-blur-xl',
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RSelect
            label={copy.wallet}
            value={form.wallet_id}
            options={walletOptions}
            onChange={(value) => onFormChange({ ...form, wallet_id: value ?? '' })}
            isDisabled={!isEditing}
          />
          <RSelect
            label={copy.category}
            value={form.category_id}
            options={categoryOptions}
            onChange={(value) => onFormChange({ ...form, category_id: value ?? '' })}
            isDisabled={!isEditing}
          />
        </div>

        <DateInput
          label={copy.date}
          value={form.transaction_date || null}
          onChange={(date) => onFormChange({ ...form, transaction_date: date ? date.toISOString().slice(0, 10) : '' })}
          placeholderText={copy.pickDate}
          disabled={!isEditing}
        />

        <Textarea
          label={copy.note}
          rows={3}
          value={form.description}
          onChange={(event) => onFormChange({ ...form, description: event.target.value })}
          placeholder={copy.notePlaceholder}
          readOnly={!isEditing}
        />

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={isEditing ? onCancelEdit : onEdit}
            className="rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {isEditing ? copy.cancelEdit : copy.editDetail}
          </button>
          <Button className="rounded-xl" onClick={onSave} loading={saveLoading} disabled={saveDisabled}>
            <HiOutlineCheckCircle className="mr-1 h-4 w-4" />
            {copy.save}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ScanHistoryPanel({
  history,
  selectedHistory,
  selectedCount,
  allHistorySelected,
  onToggleAll,
  onToggleItem,
  onOpen,
  onDeleteSelected,
  groups,
}: {
  history: ScanHistoryEntry[]
  selectedHistory: Set<string>
  selectedCount: number
  allHistorySelected: boolean
  onToggleAll: () => void
  onToggleItem: (id: string, checked: boolean) => void
  onOpen: (entry: ScanHistoryEntry) => void
  onDeleteSelected: () => void
  groups: { label: string; items: ScanHistoryEntry[] }[]
}) {
  const copy = useScanCopy()
  if (history.length === 0) return null

  return (
    <div
      className="mt-8 rounded-3xl p-4 sm:p-6"
      style={{
        background: 'rgba(255,255,255,0.40)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
      }}
    >
      <div className="flex flex-col gap-3 border-b border-slate-200/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineClock className="h-5 w-5 animate-pulse text-brand-600" />
          <h3 className="text-base font-extrabold text-slate-900">{copy.history}</h3>
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAll}
            className="rounded-xl border border-white/80 bg-white/62 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white"
          >
            {allHistorySelected ? copy.cancelSelect : copy.selectAll}
          </button>
          {selectedCount > 0 ? (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<HiOutlineTrash className="h-4 w-4" />}
              onClick={onDeleteSelected}
            >
              {copy.delete} ({selectedCount})
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  selected={selectedHistory.has(entry.id)}
                  onToggle={onToggleItem}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ScanHistoryDetailModal({
  viewing,
  typeLabel,
  onClose,
  onDelete,
}: {
  viewing: ScanHistoryEntry | null
  typeLabel: (type: ScanHistoryEntry['type']) => string
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const copy = useScanCopy()
  return (
    <Modal
      open={!!viewing}
      onClose={onClose}
      title={copy.detail}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="danger" onClick={() => viewing && onDelete(viewing.id)}>
            {copy.deleteHistory}
          </Button>
        </div>
      }
    >
      {viewing ? <ScanHistoryDetail viewing={viewing} typeLabel={typeLabel} /> : null}
    </Modal>
  )
}

function HistoryCard({
  entry,
  selected,
  onToggle,
  onOpen,
}: {
  entry: ScanHistoryEntry
  selected: boolean
  onToggle: (id: string, checked: boolean) => void
  onOpen: (entry: ScanHistoryEntry) => void
}) {
  const copy = useScanCopy()
  return (
    <div className="group relative flex gap-3 rounded-2xl border border-white/70 bg-white/62 p-3 text-left shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-lg hover:shadow-brand-100/30">
      <input
        type="checkbox"
        checked={selected}
        onChange={(event) => onToggle(entry.id, event.target.checked)}
        aria-label={copy.history}
        className="mt-5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <button type="button" onClick={() => onOpen(entry)} className="flex min-w-0 flex-1 gap-3 text-left">
        <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white opacity-0 shadow-lg shadow-brand-200 transition group-hover:opacity-100">
          <HiOutlineEye className="h-4 w-4" />
        </span>
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
          {entry.imagePreview ? (
            <img src={entry.imagePreview} alt="Struk" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
              <HiOutlinePhoto className="h-5 w-5" />
          <span className="text-[10px]">{copy.noImage}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <AmountPill entry={entry} />
            <span className="text-[10px] font-medium tabular-nums text-slate-400">
              {formatTimeLabel(entry.timestamp)}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">{entry.merchant}</p>
          {entry.description ? (
            <p className="line-clamp-1 text-xs font-medium text-slate-400">{entry.description}</p>
          ) : null}
        </div>
      </button>
    </div>
  )
}

function ScanHistoryDetail({
  viewing,
  typeLabel,
}: {
  viewing: ScanHistoryEntry
  typeLabel: (type: ScanHistoryEntry['type']) => string
}) {
  const copy = useScanCopy()
  return (
    <div className="space-y-4">
      {viewing.imagePreview ? (
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-inner">
          <img src={viewing.imagePreview} alt="Struk" className="mx-auto max-h-96 object-contain" />
        </div>
      ) : (
        <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-100 p-8 text-center text-sm text-slate-500">
          <HiOutlinePhoto className="h-8 w-8" />
          <p className="mt-3 font-semibold text-slate-900">{copy.noImage}</p>
          <p className="mt-1 text-xs text-slate-500">{copy.noImageDesc}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label={copy.typeLabel}>
          <Badge tone={viewing.type === 'income' ? 'green' : 'red'}>{typeLabel(viewing.type)}</Badge>
        </Info>
        <Info label={copy.amount}>
          <p className="font-semibold text-slate-900">{formatIDR(viewing.amount)}</p>
        </Info>
        <Info label={copy.merchant} value={viewing.merchant} />
        <Info label={copy.category} value={viewing.categoryName || '-'} />
        <Info label={copy.date} value={viewing.transactionDate || '-'} />
        <Info
          label={copy.scannedAt}
          value={new Date(viewing.timestamp).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        />
      </div>
      {viewing.description ? <Info label={copy.note} value={viewing.description} /> : null}
      {viewing.lineItems?.length ? (
        <div>
          <p className="mb-2 text-xs text-slate-400">{copy.items}</p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60">
            {viewing.lineItems.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-start justify-between gap-3 px-3 py-2 text-xs text-slate-700">
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AmountPill({ entry }: { entry: ScanHistoryEntry }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
        entry.type === 'income'
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border border-rose-200 bg-rose-50 text-rose-700',
      )}
    >
      {entry.type === 'income' ? '+' : '-'}
      {formatIDR(entry.amount)}
    </span>
  )
}

function Info({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      {children ?? <p className="text-slate-800">{value}</p>}
    </div>
  )
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}
