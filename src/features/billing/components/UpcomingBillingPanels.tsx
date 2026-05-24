import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineXMark, HiPlus } from 'react-icons/hi2'
import { Badge, Button, Card, CurrencyInput, DateInput, Input, Modal, RSelect, type SelectOption } from '@/components/ui'
import { upcomingBillingApi, type BillingCycle, type BillingStatus, type UpcomingBilling, type UpcomingBillingPayload } from '@/features/billing/api'
import { useLocale } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { nextBillingDate } from '@/features/account/utils/billing'

function useBillingCopy() {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Upcoming Billing',
        desc: 'Catat tagihan rutin agar tidak terlewat saat jatuh tempo.',
        deleted: 'Tagihan rutin dihapus.',
        paid: 'Tagihan ditandai sudah dibayar. Jatuh tempo berikutnya diperbarui.',
        deleteTitle: 'Hapus tagihan rutin?',
        deleteDesc: (name: string) => `${name} akan dihapus dari daftar upcoming billing.`,
        delete: 'Hapus',
        paidTitle: 'Tandai tagihan sudah dibayar?',
        paidDesc: (name: string, cycle: string) => `${name} akan dipindahkan ke jatuh tempo berikutnya sesuai siklus ${cycle.toLowerCase()}.`,
        paidConfirm: 'Sudah Dibayar',
        search: 'Cari nama, provider, atau catatan...',
        clearSearch: 'Bersihkan pencarian',
        allStatus: 'Semua Status',
        active: 'Aktif',
        paused: 'Paused',
        allCycles: 'Semua Siklus',
        weekly: 'Mingguan',
        monthly: 'Bulanan',
        yearly: 'Tahunan',
        loading: 'Memuat tagihan...',
        empty: 'Belum ada tagihan rutin. Tambahkan VPS, domain, software, atau layanan berulang agar cashflow mendatang lebih mudah dipantau.',
        add: 'Tambah Billing',
        noMatch: 'Tidak ada tagihan rutin yang cocok dengan filter.',
        showing: (shown: number, total: number) => `Menampilkan ${shown} dari ${total} tagihan`,
        noProvider: 'Tanpa provider',
        amount: 'Nominal',
        dueDate: 'Jatuh Tempo',
        edit: 'Edit',
        savedCreate: 'Tagihan rutin ditambahkan.',
        savedUpdate: 'Tagihan rutin diperbarui.',
        modalAdd: 'Tambah Upcoming Billing',
        modalEdit: 'Edit Upcoming Billing',
        modalDesc: 'Catat tagihan rutin agar pengeluaran mendatang lebih mudah dipantau.',
        cancel: 'Batal',
        save: 'Simpan',
        name: 'Nama Tagihan',
        namePlaceholder: 'Netflix, VPS, Domain',
        provider: 'Provider',
        providerPlaceholder: 'AWS, Netflix, Niagahoster',
        amountIdr: 'Nominal (IDR)',
        cycle: 'Siklus',
        status: 'Status',
        notes: 'Catatan',
        optional: 'Opsional',
        pickDueDate: 'Pilih tanggal jatuh tempo',
      }
    : {
        title: 'Upcoming Billing',
        desc: 'Record recurring bills so they are not missed when due.',
        deleted: 'Recurring bill deleted.',
        paid: 'Bill marked as paid. The next due date has been updated.',
        deleteTitle: 'Delete recurring bill?',
        deleteDesc: (name: string) => `${name} will be removed from upcoming billing.`,
        delete: 'Delete',
        paidTitle: 'Mark this bill as paid?',
        paidDesc: (name: string, cycle: string) => `${name} will move to the next due date based on its ${cycle.toLowerCase()} cycle.`,
        paidConfirm: 'Mark Paid',
        search: 'Search name, provider, or notes...',
        clearSearch: 'Clear search',
        allStatus: 'All Status',
        active: 'Active',
        paused: 'Paused',
        allCycles: 'All Cycles',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
        loading: 'Loading bills...',
        empty: 'No recurring bills yet. Add VPS, domains, software, or subscriptions so future cashflow is easier to track.',
        add: 'Add Billing',
        noMatch: 'No recurring bills match the current filters.',
        showing: (shown: number, total: number) => `Showing ${shown} of ${total} bills`,
        noProvider: 'No provider',
        amount: 'Amount',
        dueDate: 'Due Date',
        edit: 'Edit',
        savedCreate: 'Recurring bill added.',
        savedUpdate: 'Recurring bill updated.',
        modalAdd: 'Add Upcoming Billing',
        modalEdit: 'Edit Upcoming Billing',
        modalDesc: 'Record recurring bills so upcoming spending is easier to monitor.',
        cancel: 'Cancel',
        save: 'Save',
        name: 'Bill Name',
        namePlaceholder: 'Netflix, VPS, Domain',
        provider: 'Provider',
        providerPlaceholder: 'AWS, Netflix, Niagahoster',
        amountIdr: 'Amount (IDR)',
        cycle: 'Cycle',
        status: 'Status',
        notes: 'Notes',
        optional: 'Optional',
        pickDueDate: 'Choose due date',
      }
  return { locale, copy }
}

type BillingCopy = ReturnType<typeof useBillingCopy>['copy']

function cycleLabel(cycle: BillingCycle, copy: BillingCopy) {
  if (cycle === 'weekly') return copy.weekly
  if (cycle === 'yearly') return copy.yearly
  return copy.monthly
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
  const { copy } = useBillingCopy()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BillingStatus>('all')
  const [cycleFilter, setCycleFilter] = useState<'all' | BillingCycle>('all')
  const remove = useMutation({
    mutationFn: upcomingBillingApi.remove,
    onSuccess: () => {
      toast.success(copy.deleted)
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
      toast.success(copy.paid)
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: copy.deleteTitle,
      description: copy.deleteDesc(item.name),
      tone: 'danger',
      confirmLabel: copy.delete,
    })
    if (ok) remove.mutate(item.id)
  }

  const onMarkPaid = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: copy.paidTitle,
      description: copy.paidDesc(item.name, cycleLabel(item.cycle, copy)),
      tone: 'primary',
      confirmLabel: copy.paidConfirm,
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
    <Card className="overflow-hidden bg-white/72">
      <div className="flex flex-col gap-3 border-b border-white/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
            <HiOutlineCalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{copy.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{copy.desc}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px]">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.search}
            className="pr-10"
          />

          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={copy.clearSearch}
              title={copy.clearSearch}
            >
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <RSelect
          value={statusFilter}
          options={[
            { value: 'all', label: copy.allStatus },
            { value: 'active', label: copy.active },
            { value: 'paused', label: copy.paused },
          ]}
          onChange={(value) => setStatusFilter((value as 'all' | BillingStatus) ?? 'all')}
        />

        <RSelect
          value={cycleFilter}
          options={[
            { value: 'all', label: copy.allCycles },
            { value: 'weekly', label: copy.weekly },
            { value: 'monthly', label: copy.monthly },
            { value: 'yearly', label: copy.yearly },
          ]}
          onChange={(value) => setCycleFilter((value as 'all' | BillingCycle) ?? 'all')}
        />
      </div>
      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
            {copy.loading}
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">
              {copy.empty}
            </p>
            <Button className="mt-4" onClick={onCreate}>
              <HiPlus className="mr-1 h-4 w-4" />
              {copy.add}
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-5 text-sm text-slate-500">
            {copy.noMatch}
          </div>
        ) : (
          <>
          <p className="px-1 text-xs font-semibold text-slate-400">
            {copy.showing(filteredItems.length, items.length)}
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
                    {item.provider || copy.noProvider} · {cycleLabel(item.cycle, copy)}
                  </p>
                </div>
                <Badge tone={item.status === 'active' ? 'green' : 'amber'}>
                  {item.status === 'active' ? copy.active : copy.paused}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.amount}</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">
                      {formatCurrency(Number(item.amount), item.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-2 ring-1 ring-blue-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{copy.dueDate}</p>
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
                    {copy.paidConfirm}
                  </Button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-700"
                    title={copy.edit}
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700"
                    title={copy.delete}
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
  const { copy } = useBillingCopy()
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
      toast.success(editing ? copy.savedUpdate : copy.savedCreate)
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? copy.modalEdit : copy.modalAdd}
      description={copy.modalDesc}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{copy.cancel}</Button>
          <Button loading={saveBilling.isPending} onClick={() => saveBilling.mutate()}>
            {copy.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={copy.name}
            placeholder={copy.namePlaceholder}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label={copy.provider}
            placeholder={copy.providerPlaceholder}
            value={form.provider ?? ''}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          />
        </div>
        <CurrencyInput
          label={copy.amountIdr}
          value={Number(form.amount) || 0}
          onChange={(value) => setForm({ ...form, amount: value })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <RSelect
            label={copy.cycle}
            value={form.cycle}
            options={[
              { value: 'weekly', label: copy.weekly },
              { value: 'monthly', label: copy.monthly },
              { value: 'yearly', label: copy.yearly },
            ] as SelectOption[]}
            onChange={(value) => setForm({ ...form, cycle: (value ?? 'monthly') as BillingCycle })}
          />
          <DateInput
            label={copy.dueDate}
            value={form.due_date || null}
            onChange={(date) => setForm({ ...form, due_date: date ? date.toISOString().slice(0, 10) : '' })}
            placeholderText={copy.pickDueDate}
          />
          <RSelect
            label={copy.status}
            value={form.status ?? 'active'}
            options={[
              { value: 'active', label: copy.active },
              { value: 'paused', label: copy.paused },
            ] as SelectOption[]}
            onChange={(value) => setForm({ ...form, status: (value ?? 'active') as BillingStatus })}
          />
        </div>
        <Input
          label={copy.notes}
          placeholder={copy.optional}
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </Modal>
  )
}
