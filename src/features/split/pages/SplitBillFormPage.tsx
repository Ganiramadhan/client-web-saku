import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineCalculator,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import {
  Button,
  Card,
  CurrencyInput,
  Input,
  PageHeader,
  Spinner,
} from '@/components/ui'
import { splitBillApi, type SplitBillParticipantInput } from '../api'
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

  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title)
      setTotal(existing.data.total_amount)
      setNotes(existing.data.notes ?? '')
      setRows(
        existing.data.participants.map((p) => ({
          _key: p.id,
          id: p.id,
          name: p.name,
          phone: p.phone,
          amount: p.amount,
        })),
      )
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
        action={
          <Link to="/app/split-bills">
            <Button variant="secondary" leftIcon={<HiOutlineArrowLeft className="h-4 w-4" />}>
              Kembali
            </Button>
          </Link>
        }
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

            <div className="mt-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Peserta</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<HiOutlineCalculator className="h-4 w-4" />}
                    onClick={splitEven}
                    disabled={total <= 0 || rows.length === 0}
                  >
                    Bagi Rata
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<HiOutlinePlus className="h-4 w-4" />}
                    onClick={() => setRows((p) => [...p, newRow()])}
                  >
                    Tambah
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {rows.map((r, idx) => (
                  <div
                    key={r._key}
                    className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-2"
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
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
    </div>
  )
}

export default SplitBillFormPage
