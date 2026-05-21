import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineCalculator,
  HiOutlinePhoto,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import {
  Button,
  Card,
  CurrencyInput,
  Input,
  PageHeader,
  Spinner,
  Modal,
} from '@/components/ui'
import { splitBillApi, type SplitBillParticipantInput } from '../api'
import { aiApi, fileToBase64 } from '@/features/ai/api'
import type { AIScanReceiptResponse } from '@/types/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'

interface Row extends SplitBillParticipantInput {
  _key: string
}

function newRow(name = '', amount = 0): Row {
  return { _key: Math.random().toString(36).slice(2), name, amount, phone: '' }
}

export function SplitBillFormPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const existing = useQuery({
    queryKey: ['split-bill', id],
    queryFn: () => splitBillApi.get(id!),
    enabled: isEdit,
  })

  const [title, setTitle] = useState('')
  const [total, setTotal] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<Row[]>([newRow(), newRow()])
  const [receiptPreview, setReceiptPreview] = useState('')
  const [receiptDetailOpen, setReceiptDetailOpen] = useState(false)
  const [receiptDetail, setReceiptDetail] = useState<AIScanReceiptResponse | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existing.data) {
      const timer = window.setTimeout(() => {
        setTitle(existing.data?.title ?? '')
        setTotal(existing.data?.total_amount ?? 0)
        setNotes(existing.data?.notes ?? '')
        setRows(
          existing.data?.participants.map((p) => ({
            _key: p.id,
            id: p.id,
            name: p.name,
            phone: p.phone,
            amount: p.amount,
          })) ?? [newRow(), newRow()],
        )
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [existing.data])

  const sumRows = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows])
  const diff = total - sumRows

  const splitEven = () => {
    if (!rows.length || total <= 0) return
    const each = Math.round((total / rows.length) * 100) / 100
    const lastDiff = total - each * rows.length
    setRows((prev) =>
      prev.map((r, i) => ({
        ...r,
        amount: i === prev.length - 1 ? each + lastDiff : each,
      })),
    )
  }

  const create = useMutation({
    mutationFn: () =>
      splitBillApi.create({
        title: title.trim(),
        total_amount: total,
        notes: notes.trim() || undefined,
        participants: rows.map((r) => ({
          name: r.name.trim(),
          phone: r.phone?.trim() || undefined,
          amount: Number(r.amount || 0),
        })),
      }),
    onSuccess: (b) => {
      toast.success('Split bill berhasil dibuat')
      qc.invalidateQueries({ queryKey: ['split-bills'] })
      nav(`/app/split-bills/${b.id}`)
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const update = useMutation({
    mutationFn: () =>
      splitBillApi.update(id!, {
        title: title.trim(),
        total_amount: total,
        notes: notes.trim() || undefined,
        participants: rows.map((r) => ({
          id: r.id,
          name: r.name.trim(),
          phone: r.phone?.trim() || undefined,
          amount: Number(r.amount || 0),
        })),
      }),
    onSuccess: () => {
      toast.success('Split bill diperbarui')
      qc.invalidateQueries({ queryKey: ['split-bills'] })
      qc.invalidateQueries({ queryKey: ['split-bill', id] })
      nav(`/app/split-bills/${id}`)
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const scanReceipt = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file)
      return aiApi.scanReceipt({ image_base64: base64, media_type: file.type })
    },
    onSuccess: (data) => {
      const merchant = data.merchant_name?.trim()
      setReceiptDetail(data)
      setTotal(Number(data.amount || 0))
      if (!title.trim()) setTitle(merchant ? `Split bill - ${merchant}` : 'Split bill dari struk')
      setNotes((prev) => {
        const next = [
          prev.trim(),
          merchant ? `Merchant: ${merchant}` : '',
          data.date ? `Tanggal: ${data.date}` : '',
        ].filter(Boolean)
        return Array.from(new Set(next)).join(' · ')
      })
      toast.success('Struk berhasil dibaca. Cek kembali total sebelum dibagi.')
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const handleReceiptFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Pilih file gambar struk.')
      return
    }
    setReceiptPreview(URL.createObjectURL(file))
    scanReceipt.mutate(file)
  }

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview)
    }
  }, [receiptPreview])

  const canSubmit =
    title.trim().length > 0 &&
    total > 0 &&
    rows.length >= 2 &&
    rows.every((r) => r.name.trim().length > 0 && Number(r.amount) > 0) &&
    Math.abs(diff) < 0.01

  if (isEdit && existing.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Split Bill' : 'Buat Split Bill'}
        subtitle="Bagi tagihan secara adil dan kirim ke teman via WhatsApp."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <HiOutlineUserGroup className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900">Detail Tagihan</h3>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Judul tagihan
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Makan malam, patungan kado, dll."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Total tagihan
                </label>
                <CurrencyInput value={total} onChange={setTotal} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Catatan (opsional)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tempat, tanggal, dll."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptFile}
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
                  loading={scanReceipt.isPending}
                  leftIcon={
                    scanReceipt.isPending
                      ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                      : <HiOutlinePhoto className="h-4 w-4" />
                  }
                  onClick={() => receiptInputRef.current?.click()}
                >
                  Scan Struk
                </Button>
              </div>
              {receiptPreview ? (
                <button
                  type="button"
                  onClick={() => setReceiptDetailOpen(true)}
                  className="mt-4 block w-full cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg active:scale-[0.99]"
                >
                  <img
                    src={receiptPreview}
                    alt="Preview struk"
                    className="max-h-72 w-full object-contain"
                  />
                  <div className="border-t border-slate-100 px-4 py-3 text-xs font-semibold text-blue-700">
                    Klik untuk melihat detail hasil scan struk
                  </div>
                </button>
              ) : null}
            </div>

            <div className="mt-2 border-t border-white/80 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Peserta</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<HiOutlineCalculator className="h-4 w-4" />}
                    onClick={splitEven}
                    disabled={total <= 0 || rows.length === 0}
                    className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    Bagi Rata
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<HiOutlinePlus className="h-4 w-4" />}
                    onClick={() => setRows((p) => [...p, newRow()])}
                    className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    Tambah
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {rows.map((r, idx) => (
                  <div
                    key={r._key}
                    className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-white/80 bg-white/52 p-3 shadow-sm backdrop-blur-xl"
                  >
                    <div className="col-span-12 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:hidden">
                      Peserta {idx + 1}
                    </div>
                    <div className="col-span-12 sm:col-span-4">
                      <Input
                        placeholder="Nama"
                        value={r.name}
                        onChange={(e) =>
                          setRows((p) =>
                            p.map((x) => (x._key === r._key ? { ...x, name: e.target.value } : x)),
                          )
                        }
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-4">
                      <Input
                        placeholder="62812xxxx (opsional)"
                        value={r.phone ?? ''}
                        onChange={(e) =>
                          setRows((p) =>
                            p.map((x) =>
                              x._key === r._key ? { ...x, phone: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <CurrencyInput
                        value={r.amount}
                        onChange={(v) =>
                          setRows((p) =>
                            p.map((x) => (x._key === r._key ? { ...x, amount: v } : x)),
                          )
                        }
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setRows((p) =>
                            p.length > 2 ? p.filter((x) => x._key !== r._key) : p,
                          )
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
          </div>
        </Card>

        <Card className="h-fit">
          <h3 className="text-sm font-semibold text-slate-900">Ringkasan</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total tagihan</dt>
              <dd className="font-semibold tabular-nums">{formatCurrency(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total dibagi</dt>
              <dd className="font-semibold tabular-nums">{formatCurrency(sumRows)}</dd>
            </div>
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
          <Button
            className="mt-5 w-full"
            onClick={() => (isEdit ? update.mutate() : create.mutate())}
            loading={create.isPending || update.isPending}
            disabled={!canSubmit}
          >
            {isEdit ? 'Simpan Perubahan' : 'Buat Split Bill'}
          </Button>
        </Card>
      </div>

      <Modal
        open={receiptDetailOpen}
        onClose={() => setReceiptDetailOpen(false)}
        title="Detail Struk"
        footer={<Button onClick={() => setReceiptDetailOpen(false)}>Tutup</Button>}
      >
        <div className="space-y-4">
          {receiptPreview ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <img src={receiptPreview} alt="Detail struk" className="max-h-[55vh] w-full object-contain" />
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <ReceiptInfo label="Merchant" value={receiptDetail?.merchant_name || '-'} />
            <ReceiptInfo label="Tanggal" value={receiptDetail?.date || '-'} />
            <ReceiptInfo label="Total" value={formatCurrency(Number(receiptDetail?.amount || total || 0))} />
            <ReceiptInfo label="Kategori" value={receiptDetail?.category || '-'} />
          </div>
          {receiptDetail?.ocr_text ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">OCR Text</p>
              <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-600">
                {receiptDetail.ocr_text}
              </p>
            </div>
          ) : null}
        </div>
      </Modal>
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

export default SplitBillFormPage
