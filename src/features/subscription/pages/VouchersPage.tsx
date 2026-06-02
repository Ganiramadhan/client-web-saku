import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineReceiptPercent, HiOutlineTrash } from 'react-icons/hi2'
import { Badge, Button, Card, CurrencyInput, DateInput, Input, Modal, PageHeader, Spinner } from '@/components/ui'
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

export function VouchersPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Voucher | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const vouchersQ = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => subscriptionApi.listVouchersAdmin({ page: 1, limit: 100 }),
  })
  const vouchers = vouchersQ.data ?? []

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

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Voucher Management"
        subtitle="Create discount codes for subscription checkout and monitor redemption usage."
      />
      <div className="grid gap-5">
        <Card className="bg-white/72">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HiOutlineReceiptPercent className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-950">Voucher Codes</h2>
                <p className="text-xs text-slate-500">Manage discount codes used during subscription payment.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="blue">{vouchers.length} codes</Badge>
              <Button size="sm" leftIcon={<HiOutlinePlus className="h-4 w-4" />} onClick={startCreate}>Add Voucher</Button>
            </div>
          </div>
          {vouchersQ.isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : vouchers.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/55 p-8 text-center text-sm text-slate-500">
              No voucher codes yet.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/72">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="border-r border-slate-100 px-4 py-3">Code</th>
                      <th className="border-r border-slate-100 px-4 py-3">Discount</th>
                      <th className="border-r border-slate-100 px-4 py-3">Usage</th>
                      <th className="border-r border-slate-100 px-4 py-3">Validity</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="transition hover:bg-white">
                        <td className="border-r border-slate-100 px-4 py-3">
                          <p className="font-mono text-sm font-extrabold text-slate-950">{voucher.code}</p>
                          <p className="text-xs text-slate-500">{voucher.name}</p>
                        </td>
                        <td className="border-r border-slate-100 px-4 py-3 text-xs font-semibold text-slate-700">
                          {voucher.discount_type === 'percent' ? `${voucher.discount_value}%` : formatCurrency(voucher.discount_value)}
                          {voucher.max_discount > 0 ? <span className="ml-1 text-slate-400">max {formatCurrency(voucher.max_discount)}</span> : null}
                        </td>
                        <td className="border-r border-slate-100 px-4 py-3 text-xs text-slate-600">
                          {voucher.used_count}/{voucher.max_redemptions || '∞'}
                        </td>
                        <td className="border-r border-slate-100 px-4 py-3 text-xs text-slate-600">
                          {formatDate(voucher.starts_at)} - {formatDate(voucher.ends_at)}
                          <div className="mt-1"><Badge tone={voucher.is_active ? 'green' : 'gray'}>{voucher.is_active ? 'Active' : 'Inactive'}</Badge></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" leftIcon={<HiOutlinePencilSquare className="h-4 w-4" />} onClick={() => startEdit(voucher)}>Edit</Button>
                            <Button size="sm" variant="danger" leftIcon={<HiOutlineTrash className="h-4 w-4" />} loading={remove.isPending} onClick={() => remove.mutate(voucher.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>

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
