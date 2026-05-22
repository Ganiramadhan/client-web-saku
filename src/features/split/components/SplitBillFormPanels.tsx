import type { ChangeEventHandler, RefObject } from 'react'
import {
  HiOutlineArrowPath,
  HiOutlineCalculator,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { Button, Card, CurrencyInput, Input, Modal } from '@/components/ui'
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
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
            <HiOutlinePhoto className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Scan struk untuk isi total</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Upload foto struk, lalu SAKU AI akan membaca total dan merchant untuk split bill ini.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer transition hover:-translate-y-0.5 hover:border-blue-200 hover:!bg-white hover:text-blue-700 hover:shadow-md active:scale-[0.98]"
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
          Scan Struk
        </Button>
      </div>
      {preview ? (
        <button
          type="button"
          onClick={onOpenDetail}
          className="mt-4 block w-full cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg active:scale-[0.99]"
        >
          <img src={preview} alt="Preview struk" className="max-h-72 w-full object-contain" />
          <div className="border-t border-slate-100 px-4 py-3 text-xs font-semibold text-blue-700">
            Klik untuk melihat detail hasil scan struk
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
  return (
    <div className="mt-2 border-t border-white/80 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Peserta</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<HiOutlineCalculator className="h-4 w-4" />}
            onClick={onSplitEven}
            disabled={total <= 0 || rows.length === 0}
            className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            Bagi Rata
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<HiOutlinePlus className="h-4 w-4" />}
            onClick={onAddRow}
            className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            Tambah
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
              Peserta {idx + 1}
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Input
                placeholder="Nama"
                value={row.name}
                onChange={(event) => updateRow(rows, row._key, { name: event.target.value }, onRowsChange)}
              />
            </div>
            <div className="col-span-7 sm:col-span-4">
              <Input
                placeholder="62812xxxx (opsional)"
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
                title="Hapus peserta"
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
  return (
    <Card className="h-fit">
      <h3 className="text-sm font-semibold text-slate-900">Ringkasan</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <SummaryRow label="Total tagihan" value={formatCurrency(total)} />
        <SummaryRow label="Total dibagi" value={formatCurrency(sumRows)} />
        <div className="flex justify-between border-t border-slate-100 pt-2">
          <dt className="text-slate-500">Selisih</dt>
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
          Total per peserta belum sama dengan total tagihan.
        </p>
      ) : null}
      <Button className="mt-5 w-full" onClick={onSubmit} loading={isSubmitting} disabled={!canSubmit}>
        {isEdit ? 'Simpan Perubahan' : 'Buat Split Bill'}
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Struk"
      footer={<Button onClick={onClose}>Tutup</Button>}
    >
      <div className="space-y-4">
        {preview ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <img src={preview} alt="Detail struk" className="max-h-[55vh] w-full object-contain" />
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <ReceiptInfo label="Merchant" value={detail?.merchant_name || '-'} />
          <ReceiptInfo label="Tanggal" value={detail?.date || '-'} />
          <ReceiptInfo label="Total" value={formatCurrency(Number(detail?.amount || total || 0))} />
          <ReceiptInfo label="Kategori" value={detail?.category || '-'} />
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
