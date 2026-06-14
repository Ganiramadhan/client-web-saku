import type { ChangeEventHandler, RefObject } from 'react'
import {
  HiOutlineArrowPath,
  HiOutlineCalculator,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { Button, Card, CurrencyInput, Input, Modal } from '@/components/ui'
import { useLocale } from '@/i18n'
import type { AIScanReceiptResponse } from '@/types/api'
import { formatCurrency } from '@/lib/utils'
import type { SplitParticipantRow } from '../utils/participants'

export function ReceiptScanPanel({
  inputRef,
  preview,
  isScanning,
  onFileChange,
  onPickFile,
  onOpenDetail,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  preview: string
  isScanning: boolean
  onFileChange: ChangeEventHandler<HTMLInputElement>
  onPickFile: () => void
  onOpenDetail: () => void
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Scan struk untuk isi total',
        desc: 'Upload foto struk, lalu SAKU AI akan membaca total dan merchant untuk split bill ini.',
        scan: 'Scan Struk',
        previewAlt: 'Preview struk',
        detail: 'Klik untuk melihat detail hasil scan struk',
      }
    : {
        title: 'Scan receipt to fill the total',
        desc: 'Upload a receipt photo and SAKU AI will read the total and merchant for this split bill.',
        scan: 'Scan Receipt',
        previewAlt: 'Receipt preview',
        detail: 'Click to view receipt scan details',
      }
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/55 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
            <HiOutlinePhoto className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{copy.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {copy.desc}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer transition hover:-translate-y-0.5 hover:border-brand-200 hover:!bg-white hover:text-brand-700 hover:shadow-md active:scale-[0.98]"
          loading={isScanning}
          leftIcon={
            isScanning ? (
              <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
            ) : (
              <HiOutlinePhoto className="h-4 w-4" />
            )
          }
          onClick={onPickFile}
        >
          {copy.scan}
        </Button>
      </div>
      {preview ? (
        <button
          type="button"
          onClick={onOpenDetail}
          className="mt-4 block w-full cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-100 hover:shadow-lg active:scale-[0.99]"
        >
          <img src={preview} alt={copy.previewAlt} className="max-h-72 w-full object-contain" />
          <div className="border-t border-slate-100 px-4 py-3 text-xs font-semibold text-brand-700">
            {copy.detail}
          </div>
        </button>
      ) : null}
    </div>
  )
}

export function ParticipantsEditor({
  rows,
  total,
  onRowsChange,
  onSplitEven,
  onAddRow,
}: {
  rows: SplitParticipantRow[]
  total: number
  onRowsChange: (rows: SplitParticipantRow[]) => void
  onSplitEven: () => void
  onAddRow: () => void
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        participants: 'Peserta',
        splitEven: 'Bagi Rata',
        add: 'Tambah',
        participant: 'Peserta',
        name: 'Nama',
        phone: '62812xxxx (opsional)',
        delete: 'Hapus peserta',
      }
    : {
        participants: 'Participants',
        splitEven: 'Split Evenly',
        add: 'Add',
        participant: 'Participant',
        name: 'Name',
        phone: '+62812xxxx (optional)',
        delete: 'Delete participant',
      }
  return (
    <div className="mt-2 border-t border-white/80 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">{copy.participants}</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<HiOutlineCalculator className="h-4 w-4" />}
            onClick={onSplitEven}
            disabled={total <= 0 || rows.length === 0}
            className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            {copy.splitEven}
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<HiOutlinePlus className="h-4 w-4" />}
            onClick={onAddRow}
            className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            {copy.add}
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((row, idx) => (
          <div
            key={row._key}
            className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-white/80 bg-white/52 p-3 shadow-sm backdrop-blur-xl"
          >
            <div className="col-span-12 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:hidden">
              {copy.participant} {idx + 1}
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Input
                placeholder={copy.name}
                value={row.name}
                onChange={(event) => updateRow(rows, row._key, { name: event.target.value }, onRowsChange)}
              />
            </div>
            <div className="col-span-7 sm:col-span-4">
              <Input
                placeholder={copy.phone}
                value={row.phone ?? ''}
                onChange={(event) => updateRow(rows, row._key, { phone: event.target.value }, onRowsChange)}
              />
            </div>
            <div className="col-span-4 sm:col-span-3">
              <CurrencyInput
                value={row.amount}
                onChange={(amount) => updateRow(rows, row._key, { amount }, onRowsChange)}
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onRowsChange(rows.length > 2 ? rows.filter((item) => item._key !== row._key) : rows)
                }
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                disabled={rows.length <= 2}
                title={copy.delete}
              >
                <HiOutlineTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SplitSummaryCard({
  total,
  sumRows,
  diff,
  isEdit,
  canSubmit,
  isSubmitting,
  onSubmit,
}: {
  total: number
  sumRows: number
  diff: number
  isEdit: boolean
  canSubmit: boolean
  isSubmitting: boolean
  onSubmit: () => void
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Ringkasan',
        total: 'Total tagihan',
        splitTotal: 'Total dibagi',
        diff: 'Selisih',
        warning: 'Total per peserta belum sama dengan total tagihan.',
        save: 'Simpan Perubahan',
        create: 'Buat Split Bill',
      }
    : {
        title: 'Summary',
        total: 'Total bill',
        splitTotal: 'Total split',
        diff: 'Difference',
        warning: 'Total per participant does not match the bill total.',
        save: 'Save Changes',
        create: 'Create Split Bill',
      }
  return (
    <Card className="h-fit">
      <h3 className="text-sm font-semibold text-slate-900">{copy.title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <SummaryRow label={copy.total} value={formatCurrency(total)} />
        <SummaryRow label={copy.splitTotal} value={formatCurrency(sumRows)} />
        <div className="flex justify-between border-t border-slate-100 pt-2">
          <dt className="text-slate-500">{copy.diff}</dt>
          <dd
            className={
              Math.abs(diff) < 0.01
                ? 'font-bold tabular-nums text-emerald-600'
                : 'font-bold tabular-nums text-rose-600'
            }
          >
            {formatCurrency(diff)}
          </dd>
        </div>
      </dl>
      {Math.abs(diff) >= 0.01 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {copy.warning}
        </p>
      ) : null}
      <Button className="mt-5 w-full" onClick={onSubmit} loading={isSubmitting} disabled={!canSubmit}>
        {isEdit ? copy.save : copy.create}
      </Button>
    </Card>
  )
}

export function ReceiptDetailModal({
  open,
  preview,
  detail,
  total,
  onClose,
}: {
  open: boolean
  preview: string
  detail: AIScanReceiptResponse | null
  total: number
  onClose: () => void
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Detail Struk',
        close: 'Tutup',
        receiptAlt: 'Detail struk',
        date: 'Tanggal',
        total: 'Total',
        category: 'Kategori',
      }
    : {
        title: 'Receipt Details',
        close: 'Close',
        receiptAlt: 'Receipt details',
        date: 'Date',
        total: 'Total',
        category: 'Category',
      }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      footer={<Button onClick={onClose}>{copy.close}</Button>}
    >
      <div className="space-y-4">
        {preview ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <img src={preview} alt={copy.receiptAlt} className="max-h-[55vh] w-full object-contain" />
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <ReceiptInfo label="Merchant" value={detail?.merchant_name || '-'} />
          <ReceiptInfo label={copy.date} value={detail?.date || '-'} />
          <ReceiptInfo label={copy.total} value={formatCurrency(Number(detail?.amount || total || 0))} />
          <ReceiptInfo label={copy.category} value={detail?.category || '-'} />
        </div>
        {detail?.ocr_text ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">OCR Text</p>
            <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-600">
              {detail.ocr_text}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function ReceiptInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function updateRow(
  rows: SplitParticipantRow[],
  key: string,
  patch: Partial<SplitParticipantRow>,
  onRowsChange: (rows: SplitParticipantRow[]) => void,
) {
  onRowsChange(rows.map((row) => (row._key === key ? { ...row, ...patch } : row)))
}
