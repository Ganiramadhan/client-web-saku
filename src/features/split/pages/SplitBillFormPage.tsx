import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { HiOutlineUserGroup } from 'react-icons/hi2'
import { Card, CurrencyInput, Input, PageHeader, Spinner } from '@/components/ui'
import { useLocale } from '@/i18n'
import { splitBillApi } from '../api'
import { aiApi, fileToBase64 } from '@/features/ai/api'
import type { AIScanReceiptResponse } from '@/types/api'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { validateImageFile } from '@/lib/files'
import {
  ParticipantsEditor,
  ReceiptDetailModal,
  ReceiptScanPanel,
  SplitSummaryCard,
} from '../components/SplitBillFormPanels'
import { newParticipantRow, type SplitParticipantRow } from '../utils/participants'

export function SplitBillFormPage() {
  const { locale } = useLocale()
  const nav = useNavigate()
  const qc = useQueryClient()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const copy = locale === 'id'
    ? {
        created: 'Split bill berhasil dibuat',
        updated: 'Split bill diperbarui',
        receiptTitle: (merchant?: string) => merchant ? `Split bill - ${merchant}` : 'Split bill dari struk',
        merchant: 'Merchant',
        date: 'Tanggal',
        receiptRead: 'Struk berhasil dibaca. Cek kembali total sebelum dibagi.',
        pageEdit: 'Edit Split Bill',
        pageCreate: 'Buat Split Bill',
        subtitle: 'Bagi tagihan secara adil dan kirim ke teman via WhatsApp.',
        detail: 'Detail Tagihan',
        titleLabel: 'Judul tagihan',
        titlePlaceholder: 'Makan malam, patungan kado, dll.',
        totalLabel: 'Total tagihan',
        notesLabel: 'Catatan (opsional)',
        notesPlaceholder: 'Tempat, tanggal, dll.',
      }
    : {
        created: 'Split bill created',
        updated: 'Split bill updated',
        receiptTitle: (merchant?: string) => merchant ? `Split bill - ${merchant}` : 'Split bill from receipt',
        merchant: 'Merchant',
        date: 'Date',
        receiptRead: 'Receipt scanned. Review the total before splitting.',
        pageEdit: 'Edit Split Bill',
        pageCreate: 'Create Split Bill',
        subtitle: 'Split bills fairly and send them to friends via WhatsApp.',
        detail: 'Bill Details',
        titleLabel: 'Bill title',
        titlePlaceholder: 'Dinner, gift contribution, etc.',
        totalLabel: 'Total bill',
        notesLabel: 'Notes (optional)',
        notesPlaceholder: 'Place, date, etc.',
      }

  const existing = useQuery({
    queryKey: ['split-bill', id],
    queryFn: () => splitBillApi.get(id!),
    enabled: isEdit,
  })

  const [title, setTitle] = useState('')
  const [total, setTotal] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<SplitParticipantRow[]>([newParticipantRow(), newParticipantRow()])
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
          })) ?? [newParticipantRow(), newParticipantRow()],
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
      toast.success(copy.created)
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
      toast.success(copy.updated)
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
      if (!title.trim()) setTitle(copy.receiptTitle(merchant))
      setNotes((prev) => {
        const next = [
          prev.trim(),
          merchant ? `${copy.merchant}: ${merchant}` : '',
          data.date ? `${copy.date}: ${data.date}` : '',
        ].filter(Boolean)
        return Array.from(new Set(next)).join(' · ')
      })
      toast.success(copy.receiptRead)
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const handleReceiptFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file, { maxSizeMb: 5 })
    if (validationError) {
      toast.error(validationError)
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
        title={isEdit ? copy.pageEdit : copy.pageCreate}
        subtitle={copy.subtitle}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <HiOutlineUserGroup className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900">{copy.detail}</h3>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {copy.titleLabel}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.titlePlaceholder}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {copy.totalLabel}
                </label>
                <CurrencyInput value={total} onChange={setTotal} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {copy.notesLabel}
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={copy.notesPlaceholder}
                />
              </div>
            </div>

            <ReceiptScanPanel
              inputRef={receiptInputRef}
              preview={receiptPreview}
              isScanning={scanReceipt.isPending}
              onFileChange={handleReceiptFile}
              onPickFile={() => receiptInputRef.current?.click()}
              onOpenDetail={() => setReceiptDetailOpen(true)}
            />

            <ParticipantsEditor
              rows={rows}
              total={total}
              onRowsChange={setRows}
              onSplitEven={splitEven}
              onAddRow={() => setRows((prev) => [...prev, newParticipantRow()])}
            />
          </div>
        </Card>

        <SplitSummaryCard
          total={total}
          sumRows={sumRows}
          diff={diff}
          isEdit={isEdit}
          canSubmit={canSubmit}
          isSubmitting={create.isPending || update.isPending}
          onSubmit={() => (isEdit ? update.mutate() : create.mutate())}
        />
      </div>

      <ReceiptDetailModal
        open={receiptDetailOpen}
        preview={receiptPreview}
        detail={receiptDetail}
        total={total}
        onClose={() => setReceiptDetailOpen(false)}
      />
    </div>
  )
}

export default SplitBillFormPage
