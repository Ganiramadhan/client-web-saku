import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineReceiptPercent,
  HiOutlineTag,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { AdminDataTable, AdminMetricCard, Badge, Button, CurrencyInput, DateInput, Input, Modal, PageHeader } from '@/components/ui'
import { subscriptionApi, type Voucher, type VoucherPayload } from '@/features/subscription/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'

type FormState = {
  code: string
  name: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number
  min_amount: number
  max_redemptions: string
  starts_at: Date | null
  ends_at: Date | null
  is_active: boolean
}

const emptyForm: FormState = {
  code: '',
  name: '',
  discount_type: 'fixed',
  discount_value: 0,
  max_discount: 0,
  min_amount: 0,
  max_redemptions: '',
  starts_at: null,
  ends_at: null,
  is_active: true,
}

const VOUCHER_SNAPSHOT_AT = Date.now()

export function VouchersPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Voucher | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const vouchersQ = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => subscriptionApi.listVouchersAdmin({ page: 1, limit: 100 }),
  })
  const vouchers = useMemo(() => vouchersQ.data ?? [], [vouchersQ.data])
  const voucherStats = useMemo(() => {
    return {
      total: vouchers.length,
      active: vouchers.filter((voucher) => voucher.is_active).length,
      scheduled: vouchers.filter((voucher) => voucher.starts_at && new Date(voucher.starts_at).getTime() > VOUCHER_SNAPSHOT_AT).length,
      redemptions: vouchers.reduce((sum, voucher) => sum + Number(voucher.used_count || 0), 0),
    }
  }, [vouchers])

  const payload = useMemo<VoucherPayload>(() => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    discount_type: form.discount_type,
    discount_value: form.discount_value,
    max_discount: form.max_discount,
    min_amount: form.min_amount,
    max_redemptions: Number(form.max_redemptions || 0),
    starts_at: form.starts_at ? form.starts_at.toISOString() : null,
    ends_at: form.ends_at ? form.ends_at.toISOString() : null,
    is_active: form.is_active,
  }), [form])

  const save = useMutation({
    mutationFn: () => editing
      ? subscriptionApi.updateVoucherAdmin(editing.id, payload)
      : subscriptionApi.createVoucherAdmin(payload),
    onSuccess: () => {
      toast.success(editing ? 'Voucher updated.' : 'Voucher created.')
      setEditing(null)
      setForm(emptyForm)
      setModalOpen(false)
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] })
    },
    onError: (err) => toast.error(toErrorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => subscriptionApi.deleteVoucherAdmin(id),
    onSuccess: () => {
      toast.success('Voucher deleted.')
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] })
    },
    onError: (err) => toast.error(toErrorMessage(err)),
  })

  const startEdit = (voucher: Voucher) => {
    setEditing(voucher)
    setForm({
      code: voucher.code,
      name: voucher.name,
      discount_type: voucher.discount_type,
      discount_value: Number(voucher.discount_value || 0),
      max_discount: Number(voucher.max_discount || 0),
      min_amount: Number(voucher.min_amount || 0),
      max_redemptions: String(voucher.max_redemptions || ''),
      starts_at: voucher.starts_at ? new Date(voucher.starts_at) : null,
      ends_at: voucher.ends_at ? new Date(voucher.ends_at) : null,
      is_active: voucher.is_active,
    })
    setModalOpen(true)
  }

  const startCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const columns = useMemo<ColumnDef<Voucher>[]>(() => [
    {
      id: 'code',
      header: 'Voucher',
      accessorFn: (voucher) => `${voucher.code} ${voucher.name}`,
      cell: ({ row }) => (
        <div className="min-w-[190px]">
          <p className="font-mono text-sm font-black tracking-wide text-[#17120f]">{row.original.code}</p>
          <p className="mt-1 text-xs text-slate-500">{row.original.name}</p>
        </div>
      ),
    },
    {
      id: 'discount',
      header: 'Discount',
      accessorFn: (voucher) => voucher.discount_value,
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <p className="text-sm font-black text-[#17120f]">
            {row.original.discount_type === 'percent' ? `${row.original.discount_value}%` : formatCurrency(row.original.discount_value)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {row.original.max_discount > 0 ? `Max ${formatCurrency(row.original.max_discount)}` : 'No discount cap'}
          </p>
        </div>
      ),
    },
    {
      id: 'usage',
      header: 'Usage',
      accessorFn: (voucher) => voucher.used_count,
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <p className="text-sm font-black tabular-nums text-[#17120f]">
            {row.original.used_count}/{row.original.max_redemptions || '∞'}
          </p>
          <p className="mt-1 text-xs text-slate-500">redemptions</p>
        </div>
      ),
    },
    {
      id: 'validity',
      header: 'Validity',
      accessorFn: (voucher) => `${voucher.starts_at ?? ''} ${voucher.ends_at ?? ''}`,
      cell: ({ row }) => (
        <div className="min-w-[180px] text-xs text-slate-600">
          <p>{formatDate(row.original.starts_at)} – {formatDate(row.original.ends_at)}</p>
          <div className="mt-2">
            <Badge tone={row.original.is_active ? 'green' : 'gray'}>{row.original.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Action</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => startEdit(row.original)} className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-brand-100 hover:text-brand-800" title="Edit">
            <HiOutlinePencilSquare className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => remove.mutate(row.original.id)} disabled={remove.isPending} className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50" title="Delete">
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [remove])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voucher Management"
        subtitle="Create discount codes for subscription checkout and monitor redemption usage."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" loading={vouchersQ.isFetching} onClick={() => vouchersQ.refetch()} leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}>Refresh</Button>
            <Button onClick={startCreate} leftIcon={<HiOutlinePlus className="h-4 w-4" />}>Add Voucher</Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Voucher Codes" value={voucherStats.total} helper="Created promotional codes" Icon={HiOutlineReceiptPercent} tone="brand" loading={vouchersQ.isLoading} />
        <AdminMetricCard label="Active" value={voucherStats.active} helper="Available during checkout" Icon={HiOutlineCheckCircle} tone="emerald" loading={vouchersQ.isLoading} />
        <AdminMetricCard label="Scheduled" value={voucherStats.scheduled} helper="Starts at a future date" Icon={HiOutlineClock} tone="amber" loading={vouchersQ.isLoading} />
        <AdminMetricCard label="Redemptions" value={voucherStats.redemptions} helper="Total successful uses" Icon={HiOutlineTag} tone="violet" loading={vouchersQ.isLoading} />
      </section>

      <AdminDataTable
        data={vouchers}
        columns={columns}
        loading={vouchersQ.isLoading}
        searchPlaceholder="Search voucher code or name..."
        emptyTitle="No voucher codes yet"
        emptyAction={<Button onClick={startCreate} leftIcon={<HiOutlinePlus className="h-4 w-4" />}>Add Voucher</Button>}
        getRowId={(voucher) => voucher.id}
      />

      <Modal
        open={modalOpen}
        size="lg"
        title={editing ? 'Edit Voucher' : 'Create Voucher'}
        description="Set discount value, usage limit, and validity period."
        onClose={() => {
          if (save.isPending) return
          setModalOpen(false)
          setEditing(null)
          setForm(emptyForm)
        }}
        closeOnBackdrop={!save.isPending}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false)
                setEditing(null)
                setForm(emptyForm)
              }}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()} disabled={!payload.code || !payload.name || payload.discount_value <= 0}>
              {editing ? 'Save Changes' : 'Create Voucher'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32) }))} placeholder="HEMAT20" hint="Only letters and numbers." />
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Launch promo June" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, discount_type: 'fixed' }))}
              className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${form.discount_type === 'fixed' ? 'border-brand-200 bg-brand-600 text-white' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-200 hover:text-brand-700'}`}
            >
              Fixed Amount
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, discount_type: 'percent' }))}
              className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${form.discount_type === 'percent' ? 'border-brand-200 bg-brand-600 text-white' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-200 hover:text-brand-700'}`}
            >
              Percentage
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {form.discount_type === 'percent' ? (
              <Input label="Discount" type="number" value={form.discount_value || ''} placeholder="20" hint="Percentage discount." onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value || 0) }))} />
            ) : (
              <CurrencyInput label="Discount" value={form.discount_value} placeholder="10.000" onChange={(value) => setForm((f) => ({ ...f, discount_value: value }))} />
            )}
            <CurrencyInput label="Max Discount" value={form.max_discount} placeholder="50.000" hint="Use 0 for no cap." onChange={(value) => setForm((f) => ({ ...f, max_discount: value }))} />
            <CurrencyInput label="Minimum Payment" value={form.min_amount} placeholder="29.000" onChange={(value) => setForm((f) => ({ ...f, min_amount: value }))} />
            <Input label="Max Uses" type="number" value={form.max_redemptions} placeholder="100" hint="Use 0 for unlimited." onChange={(e) => setForm((f) => ({ ...f, max_redemptions: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateInput label="Starts At" showTime value={form.starts_at} placeholderText="Select start date" onChange={(date) => setForm((f) => ({ ...f, starts_at: date }))} />
            <DateInput label="Ends At" showTime value={form.ends_at} placeholderText="Select end date" onChange={(date) => setForm((f) => ({ ...f, ends_at: date }))} />
          </div>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-xs font-bold text-slate-700">
            Active voucher
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          </label>
        </div>
      </Modal>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return 'Any time'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default VouchersPage
