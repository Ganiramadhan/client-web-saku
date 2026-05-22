import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineXMark,
  HiPlus,
} from 'react-icons/hi2'
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  DateInput,
  Input,
  Modal,
  RSelect,
  type SelectOption,
} from '@/components/ui'
import { upcomingBillingApi, type BillingCycle, type BillingStatus, type UpcomingBilling, type UpcomingBillingPayload } from '@/features/billing/api'
import type { Plan, Subscription } from '@/features/subscription/api'
import { toErrorMessage } from '@/lib/api'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { billingCycleLabel, nextBillingDate, sanitizeReferralCode } from '../utils/billing'

export function ReferralCard({ code, reward }: { code?: string; reward: number }) {
  const rows = [
    { label: 'Kode referal', value: code || 'Login ulang untuk membuat kode' },
    { label: 'Reward', value: formatCurrency(reward, 'IDR') },
  ]

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineStar className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-900">Kode Referal</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Bagikan kode ini. Reward masuk saat pengguna lain membayar langganan dengan kode kamu.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-white/80 bg-white/60 shadow-sm">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label}>
                <th className="w-36 bg-slate-50/70 px-3 py-2 font-semibold text-slate-500">
                  {row.label}
                </th>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  <span className={row.label === 'Kode referal' ? 'font-mono tracking-wide' : undefined}>
                    {row.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function SubscriptionCard({
  sub,
  pendingSub,
  loading,
  activePlan,
  plans,
  plansLoading,
  busyPlan,
  onSubscribe,
  onCancel,
  cancelLoading,
}: {
  sub: Subscription | null
  pendingSub: Subscription | null
  loading: boolean
  activePlan?: Plan | null
  plans: Plan[]
  plansLoading: boolean
  busyPlan: string | null
  onSubscribe: (planCode: string, referralCode?: string) => void
  onCancel: (id: string) => void
  cancelLoading: boolean
}) {
  const [referralCode, setReferralCode] = useState('')
  const cleanReferralCode = sanitizeReferralCode(referralCode)

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">Informasi Langganan</h3>
        </div>
        <p className="mt-3 text-xs text-slate-500">Memuat…</p>
      </Card>
    )
  }
  if (!sub) {
    return (
      <Card>
        {pendingSub ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-amber-900">Pembayaran Belum Selesai</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Selesaikan pembayaran untuk mengaktifkan paket {pendingSub.plan_name}.
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-900">
                  {formatCurrency(Number(pendingSub.amount), pendingSub.currency)}
                </p>
              </div>
              <Badge tone="amber">Pending</Badge>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              loading={busyPlan === pendingSub.plan_code}
              onClick={() => onSubscribe(pendingSub.plan_code, cleanReferralCode)}
            >
              Lanjutkan Pembayaran
            </Button>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlineStar className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Informasi Langganan</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Akun masih berada di paket Free. Pilih paket untuk membuka fitur AI, laporan lanjutan, dan workflow finansial yang lebih lengkap.
            </p>
          </div>
          <Badge tone="gray">Free</Badge>
        </div>
        <div className="mt-4">
          <Input
            label="Kode Referal"
            placeholder="Opsional saat pembayaran"
            value={referralCode}
            onChange={(e) => setReferralCode(sanitizeReferralCode(e.target.value))}
            maxLength={32}
          />
        </div>
        <div className="mt-4 space-y-2">
          {plansLoading ? (
            <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
              Memuat paket...
            </p>
          ) : plans.length === 0 ? (
            <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
              Paket berbayar belum tersedia.
            </p>
          ) : (
            plans.map((plan) => {
              const disabled = plan.code.includes('premium')
              return (
              <div
                key={plan.id}
                className="rounded-2xl border border-white/80 bg-white/65 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatCurrency(Number(plan.price), plan.currency)}/{plan.period === 'monthly' ? 'bulan' : 'tahun'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={disabled}
                    loading={busyPlan === plan.code}
                    onClick={() => onSubscribe(plan.code, cleanReferralCode)}
                  >
                    {disabled ? 'Segera' : 'Pilih'}
                  </Button>
                </div>
              </div>
              )
            })
          )}
        </div>
      </Card>
    )
  }
  const isTrial = sub.is_trial || sub.status === 'trialing'
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
  const periodEnd = sub.ends_at ? new Date(sub.ends_at) : null
  const tone: 'green' | 'amber' | 'red' =
    sub.status === 'active' ? 'green' : isTrial ? 'amber' : 'red'
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-amber-500 animate-spin-slow" />
          <h3 className="text-sm font-bold text-slate-900">Informasi Langganan</h3>
        </div>
        <Badge tone={tone}>
          {isTrial ? 'Trial' : sub.status === 'active' ? 'Aktif' : sub.status}
        </Badge>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-base font-extrabold text-slate-950">{sub.plan_name}</p>
        <p className="text-xs font-semibold text-slate-600">
          {formatCurrency(Number(sub.amount), sub.currency)}
        </p>
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/60 pt-3 text-xs">
        {isTrial && trialEnd ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">Trial berakhir</dt>
            <dd className="font-semibold text-amber-700">
              {trialEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
        {periodEnd ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">Periode hingga</dt>
            <dd className="font-semibold text-slate-700">
              {periodEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
        {sub.next_billing_at ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">Tagihan berikutnya</dt>
            <dd className="font-semibold text-slate-700">
              {new Date(sub.next_billing_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
      </dl>
      {activePlan && activePlan.features.length > 0 ? (
        <div className="mt-4 border-t border-white/60 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Layanan aktif
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {activePlan.features.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <HiOutlineCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-700">
        Upcoming billing: {sub.next_billing_at
          ? new Date(sub.next_billing_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : periodEnd
            ? periodEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Belum tersedia'}
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="danger"
          size="sm"
          className="shadow-rose-200/50 transition hover:-translate-y-0.5 hover:shadow-md"
          loading={cancelLoading}
          onClick={() => onCancel(sub.id)}
        >
          Batalkan Langganan
        </Button>
      </div>
    </Card>
  )
}

export function UpcomingBillingManager({
  items,
  loading,
  onCreate,
  onEdit,
}: {
  items: UpcomingBilling[]
  loading: boolean
  onCreate: () => void
  onEdit: (item: UpcomingBilling) => void
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BillingStatus>('all')
  const [cycleFilter, setCycleFilter] = useState<'all' | BillingCycle>('all')
  const remove = useMutation({
    mutationFn: upcomingBillingApi.remove,
    onSuccess: () => {
      toast.success('Tagihan rutin dihapus.')
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })
  const markPaid = useMutation({
    mutationFn: (item: UpcomingBilling) =>
      upcomingBillingApi.update(item.id, {
        due_date: nextBillingDate(item).toISOString(),
        status: 'active',
      }),
    onSuccess: () => {
      toast.success('Tagihan ditandai sudah dibayar. Jatuh tempo berikutnya diperbarui.')
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: 'Hapus tagihan rutin?',
      description: `${item.name} akan dihapus dari daftar upcoming billing.`,
      tone: 'danger',
      confirmLabel: 'Hapus',
    })
    if (ok) remove.mutate(item.id)
  }

  const onMarkPaid = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: 'Tandai tagihan sudah dibayar?',
      description: `${item.name} akan dipindahkan ke jatuh tempo berikutnya sesuai siklus ${billingCycleLabel(item.cycle).toLowerCase()}.`,
      tone: 'primary',
      confirmLabel: 'Sudah Dibayar',
    })
    if (ok) markPaid.mutate(item)
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (cycleFilter !== 'all' && item.cycle !== cycleFilter) return false
      if (!query) return true
      const haystack = [item.name, item.provider, item.notes, item.currency]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [items, search, statusFilter, cycleFilter])

  return (
    <Card className="overflow-hidden bg-white/60">
      <div className="flex flex-col gap-3 border-b border-white/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
            <HiOutlineCalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Billing</h3>
            <p className="mt-0.5 text-xs text-slate-500">Catat tagihan rutin agar tidak terlewat saat jatuh tempo.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-white/80 bg-white/55 p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, provider, atau catatan..."
            className="pr-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="Bersihkan pencarian"
              title="Bersihkan pencarian"
            >
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <RSelect
          value={statusFilter}
          options={[
            { value: 'all', label: 'Semua Status' },
            { value: 'active', label: 'Aktif' },
            { value: 'paused', label: 'Paused' },
          ]}
          onChange={(value) => setStatusFilter((value as 'all' | BillingStatus) ?? 'all')}
        />
        <RSelect
          value={cycleFilter}
          options={[
            { value: 'all', label: 'Semua Siklus' },
            { value: 'weekly', label: 'Mingguan' },
            { value: 'monthly', label: 'Bulanan' },
            { value: 'yearly', label: 'Tahunan' },
          ]}
          onChange={(value) => setCycleFilter((value as 'all' | BillingCycle) ?? 'all')}
        />
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
            Memuat tagihan...
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">
              Belum ada tagihan rutin. Tambahkan VPS, domain, software, atau layanan berulang agar cashflow mendatang lebih mudah dipantau.
            </p>
            <Button className="mt-4" onClick={onCreate}>
              <HiPlus className="mr-1 h-4 w-4" />
              Tambah Billing
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-5 text-sm text-slate-500">
            Tidak ada tagihan rutin yang cocok dengan filter.
          </div>
        ) : (
          <>
          <p className="px-1 text-xs font-semibold text-slate-400">
            Menampilkan {filteredItems.length} dari {items.length} tagihan
          </p>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/80 bg-white/75 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {item.provider || 'Tanpa provider'} · {billingCycleLabel(item.cycle)}
                  </p>
                </div>
                <Badge tone={item.status === 'active' ? 'green' : 'amber'}>
                  {item.status === 'active' ? 'Aktif' : 'Paused'}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nominal</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">
                      {formatCurrency(Number(item.amount), item.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-2 ring-1 ring-blue-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Jatuh Tempo</p>
                    <p className="mt-1 text-sm font-extrabold text-blue-800">{formatDate(item.due_date)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    className="!bg-emerald-600 shadow-emerald-200/60 hover:!bg-emerald-700 focus:ring-emerald-500/40"
                    leftIcon={<HiOutlineCheckCircle className="h-4 w-4" />}
                    onClick={() => onMarkPaid(item)}
                    loading={markPaid.isPending}
                    disabled={item.status !== 'active'}
                  >
                    Sudah Dibayar
                  </Button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-700"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700"
                    title="Hapus"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </>
        )}
      </div>
    </Card>
  )
}

export function BillingModal({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing: UpcomingBilling | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<UpcomingBillingPayload>(() => ({
    name: editing?.name ?? '',
    provider: editing?.provider ?? '',
    amount: editing ? Number(editing.amount) : 0,
    currency: editing?.currency ?? 'IDR',
    cycle: editing?.cycle ?? 'monthly',
    due_date: editing?.due_date ? editing.due_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: editing?.status ?? 'active',
    notes: editing?.notes ?? '',
  }))

  const saveBilling = useMutation({
    mutationFn: () => {
      const payload: UpcomingBillingPayload = {
        ...form,
        due_date: new Date(`${form.due_date}T00:00:00`).toISOString(),
      }
      return editing
        ? upcomingBillingApi.update(editing.id, payload)
        : upcomingBillingApi.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Tagihan rutin diperbarui.' : 'Tagihan rutin ditambahkan.')
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Upcoming Billing' : 'Tambah Upcoming Billing'}
      description="Catat tagihan rutin agar pengeluaran mendatang lebih mudah dipantau."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button loading={saveBilling.isPending} onClick={() => saveBilling.mutate()}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nama Tagihan"
            placeholder="Netflix, VPS, Domain"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Provider"
            placeholder="AWS, Netflix, Niagahoster"
            value={form.provider ?? ''}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          />
        </div>
        <CurrencyInput
          label="Nominal (IDR)"
          value={Number(form.amount) || 0}
          onChange={(value) => setForm({ ...form, amount: value })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <RSelect
            label="Siklus"
            value={form.cycle}
            options={[
              { value: 'weekly', label: 'Mingguan' },
              { value: 'monthly', label: 'Bulanan' },
              { value: 'yearly', label: 'Tahunan' },
            ] as SelectOption[]}
            onChange={(value) => setForm({ ...form, cycle: (value ?? 'monthly') as BillingCycle })}
          />
          <DateInput
            label="Tanggal Jatuh Tempo"
            value={form.due_date || null}
            onChange={(date) => setForm({ ...form, due_date: date ? date.toISOString().slice(0, 10) : '' })}
            placeholderText="Pilih tanggal jatuh tempo"
          />
          <RSelect
            label="Status"
            value={form.status ?? 'active'}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'paused', label: 'Paused' },
            ] as SelectOption[]}
            onChange={(value) => setForm({ ...form, status: (value ?? 'active') as BillingStatus })}
          />
        </div>
        <Input
          label="Catatan"
          placeholder="Opsional"
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </Modal>
  )
}
