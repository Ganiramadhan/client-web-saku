import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiPlus,
  HiOutlineArrowDownCircle,
  HiOutlineArrowUpCircle,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineEye,
} from 'react-icons/hi2'
import {
  IoFastFoodOutline,
  IoCarOutline,
  IoCartOutline,
  IoReceiptOutline,
  IoGameControllerOutline,
  IoMedkitOutline,
  IoSchoolOutline,
  IoHomeOutline,
  IoShirtOutline,
  IoEllipsisHorizontalOutline,
  IoCashOutline,
  IoGiftOutline,
  IoBriefcaseOutline,
  IoTrendingUpOutline,
  IoStorefrontOutline,
  IoWalletOutline,
  IoCardOutline,
  IoSwapHorizontalOutline,
  IoFlashOutline,
  IoAirplaneOutline,
  IoPawOutline,
  IoHeartOutline,
  IoBookOutline,
  IoFitnessOutline,
} from 'react-icons/io5'
import { transactionApi, type TransactionUpdatePayload } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  DataTable,
  DateInput,
  Input,
  Modal,
  PageHeader,
  RSelect,
  Textarea,
  type SelectOption,
} from '@/components/ui'
import { useT } from '@/i18n'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import type { Transaction } from '@/types/api'

type TypeFilter = 'all' | 'income' | 'expense'

// ─── Category icon helpers ────────────────────────────────────────
type IconCmp = ComponentType<{ className?: string }>

const CATEGORY_ICONS: Array<{ keys: string[]; Icon: IconCmp; tone: string }> = [
  { keys: ['makan', 'minum', 'food', 'kuliner', 'kopi', 'cafe', 'resto'], Icon: IoFastFoodOutline, tone: 'bg-orange-100 text-orange-700' },
  { keys: ['transport', 'bensin', 'parkir', 'taxi', 'grab', 'gojek', 'kendara', 'mobil', 'motor'], Icon: IoCarOutline, tone: 'bg-sky-100 text-sky-700' },
  { keys: ['belanja', 'shopping', 'shop'], Icon: IoCartOutline, tone: 'bg-fuchsia-100 text-fuchsia-700' },
  { keys: ['tagih', 'bill'], Icon: IoReceiptOutline, tone: 'bg-amber-100 text-amber-700' },
  { keys: ['hibur', 'enter', 'film', 'game', 'musik'], Icon: IoGameControllerOutline, tone: 'bg-violet-100 text-violet-700' },
  { keys: ['kesehat', 'health', 'obat', 'rumah sakit', 'klinik'], Icon: IoMedkitOutline, tone: 'bg-rose-100 text-rose-700' },
  { keys: ['pendidik', 'sekolah', 'kursus', 'belajar', 'edu'], Icon: IoSchoolOutline, tone: 'bg-blue-100 text-blue-700' },
  { keys: ['rumah', 'home', 'sewa', 'kost'], Icon: IoHomeOutline, tone: 'bg-teal-100 text-teal-700' },
  { keys: ['pakai', 'baju', 'fashion', 'cloth'], Icon: IoShirtOutline, tone: 'bg-pink-100 text-pink-700' },
  { keys: ['gaji', 'salary', 'penghasil'], Icon: IoCashOutline, tone: 'bg-emerald-100 text-emerald-700' },
  { keys: ['bonus', 'tunjang'], Icon: IoGiftOutline, tone: 'bg-lime-100 text-lime-700' },
  { keys: ['freelance', 'kerja', 'projek'], Icon: IoBriefcaseOutline, tone: 'bg-indigo-100 text-indigo-700' },
  { keys: ['investasi', 'invest', 'saham', 'reksa', 'crypto'], Icon: IoTrendingUpOutline, tone: 'bg-green-100 text-green-700' },
  { keys: ['hadiah', 'gift'], Icon: IoGiftOutline, tone: 'bg-rose-100 text-rose-700' },
  { keys: ['penjual', 'jualan', 'sales'], Icon: IoStorefrontOutline, tone: 'bg-amber-100 text-amber-700' },
  { keys: ['bunga', 'interest'], Icon: IoWalletOutline, tone: 'bg-emerald-100 text-emerald-700' },
  { keys: ['cashback', 'reward'], Icon: IoCardOutline, tone: 'bg-cyan-100 text-cyan-700' },
  { keys: ['transfer', 'kirim'], Icon: IoSwapHorizontalOutline, tone: 'bg-slate-100 text-slate-700' },
  { keys: ['listrik', 'pln', 'air', 'pdam', 'gas', 'utilit'], Icon: IoFlashOutline, tone: 'bg-yellow-100 text-yellow-700' },
  { keys: ['liburan', 'travel', 'tiket', 'hotel'], Icon: IoAirplaneOutline, tone: 'bg-cyan-100 text-cyan-700' },
  { keys: ['hewan', 'pet', 'kucing', 'anjing'], Icon: IoPawOutline, tone: 'bg-orange-100 text-orange-700' },
  { keys: ['donasi', 'sedekah', 'amal', 'charity'], Icon: IoHeartOutline, tone: 'bg-rose-100 text-rose-700' },
  { keys: ['buku', 'book'], Icon: IoBookOutline, tone: 'bg-blue-100 text-blue-700' },
  { keys: ['olahraga', 'gym', 'fitness', 'sport'], Icon: IoFitnessOutline, tone: 'bg-emerald-100 text-emerald-700' },
]

function resolveCategoryIcon(name?: string): { Icon: IconCmp; tone: string } {
  const n = (name || '').toLowerCase()
  if (n) {
    for (const c of CATEGORY_ICONS) {
      if (c.keys.some((k) => n.includes(k))) return { Icon: c.Icon, tone: c.tone }
    }
  }
  return { Icon: IoEllipsisHorizontalOutline, tone: 'bg-slate-100 text-slate-600' }
}

function CategoryCell({ name }: { name: string }) {
  const { Icon, tone } = resolveCategoryIcon(name)
  return (
    <div className="flex items-center gap-2">
      <div className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' + tone}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="truncate font-medium text-slate-900">{name}</span>
    </div>
  )
}

export function TransactionsListPage() {
  const t = useT()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [viewing, setViewing] = useState<Transaction | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  // filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
  })
  const q = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: () => transactionApi.list({ page: 1, limit: 500 }),
  })

  const walletMap = useMemo(() => {
    const m = new Map<string, string>()
    wallets.data?.forEach((w) => m.set(w.id, w.name))
    return m
  }, [wallets.data])

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>()
    categories.data?.forEach((c) => m.set(c.id, c.name))
    return m
  }, [categories.data])

  // Filter options for the category dropdown — narrowed by type filter
  const categoryFilterOptions: SelectOption[] = useMemo(() => {
    const cats = (categories.data ?? []).filter(
      (c) => typeFilter === 'all' || c.type === typeFilter,
    )
    return [
      { value: '', label: 'Semua Kategori' },
      ...cats.map((c) => ({ value: c.id, label: c.name })),
    ]
  }, [categories.data, typeFilter])

  const filteredTx = useMemo(() => {
    const all = q.data?.data ?? []
    return all.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (categoryFilter && tx.category_id !== categoryFilter) return false
      if (dateFrom) {
        const txTs = new Date(tx.transaction_date).getTime()
        const fromTs = new Date(dateFrom)
        fromTs.setHours(0, 0, 0, 0)
        if (txTs < fromTs.getTime()) return false
      }
      if (dateTo) {
        const txTs = new Date(tx.transaction_date).getTime()
        const endTs = new Date(dateTo)
        endTs.setHours(23, 59, 59, 999)
        if (txTs > endTs.getTime()) return false
      }
      return true
    })
  }, [q.data, typeFilter, categoryFilter, dateFrom, dateTo])

  useEffect(() => {
    const available = new Set(filteredTx.map((tx) => tx.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => available.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filteredTx])

  const summary = useMemo(() => {
    let income = 0,
      expense = 0
    filteredTx.forEach((t) => {
      const amt = Number(t.amount) || 0
      if (t.type === 'income') income += amt
      else expense += amt
    })
    return { income, expense, net: income - expense, count: filteredTx.length }
  }, [filteredTx])

  const todaySummary = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    let income = 0
    let expense = 0

    for (const tx of q.data?.data ?? []) {
      const ts = new Date(tx.transaction_date).getTime()
      if (ts < start.getTime() || ts > end.getTime()) continue

      const amount = Number(tx.amount) || 0
      if (tx.type === 'income') income += amount
      else expense += amount
    }

    return { income, expense }
  }, [q.data])

  const remove = useMutation({
    mutationFn: transactionApi.remove,
    onSuccess: () => {
      toast.success('Transaksi dihapus')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const bulkRemove = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => transactionApi.remove(id)))
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.length} transaksi dihapus`)
      setSelectedIds(new Set())
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (tx: Transaction) => {
    const ok = await confirm({
      title: 'Hapus transaksi?',
      description: 'Saldo dompet akan di-recalc setelah penghapusan.',
      tone: 'danger',
      confirmLabel: t.common.delete,
    })
    if (ok) remove.mutate(tx.id)
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const allIds = filteredTx.map((tx) => tx.id)
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allSelected) allIds.forEach((id) => next.delete(id))
      else allIds.forEach((id) => next.add(id))
      return next
    })
  }

  const onBulkDelete = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    const ok = await confirm({
      title: `Hapus ${ids.length} transaksi?`,
      description: 'Semua transaksi terpilih akan dihapus dan saldo dompet akan dihitung ulang.',
      tone: 'danger',
      confirmLabel: 'Hapus Semua',
    })
    if (ok) bulkRemove.mutate(ids)
  }

  const resetFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('')
    setDateFrom(null)
    setDateTo(null)
  }

  const hasActiveFilter =
    typeFilter !== 'all' || categoryFilter !== '' || dateFrom !== null || dateTo !== null

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        id: 'select',
        header: () => {
          const allSelected = filteredTx.length > 0 && filteredTx.every((tx) => selectedIds.has(tx.id))
          return (
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllVisible}
                onClick={(event) => event.stopPropagation()}
                aria-label="Pilih semua transaksi"
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 transition hover:scale-110 focus:ring-brand-500"
              />
            </div>
          )
        },
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={selectedIds.has(row.original.id)}
              onChange={() => toggleSelected(row.original.id)}
              onClick={(event) => event.stopPropagation()}
              aria-label="Pilih transaksi"
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 transition hover:scale-110 focus:ring-brand-500"
            />
          </div>
        ),
      },
      {
        id: 'no',
        header: () => <span className="block text-center">#</span>,
        enableSorting: false,
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination
          const n = pageIndex * pageSize + row.index + 1
          return (
            <span className="block text-center text-xs font-medium text-slate-500">
              {n}
            </span>
          )
        },
      },
      {
        id: 'date',
        header: 'Tanggal',
        accessorFn: (tx) => tx.transaction_date,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-slate-700">
            {formatDate(row.original.transaction_date)}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Kategori',
        accessorFn: (tx) => categoryMap.get(tx.category_id) ?? '—',
        cell: ({ row }) => (
          <CategoryCell name={categoryMap.get(row.original.category_id) ?? '—'} />
        ),
      },
      {
        id: 'description',
        header: 'Deskripsi',
        enableSorting: false,
        accessorFn: (tx) => tx.description ?? tx.merchant_name ?? '',
        cell: ({ row }) => {
          const tx = row.original
          const desc = tx.description || tx.merchant_name || ''
          return desc ? (
            <span className="line-clamp-1 max-w-[260px] text-slate-600" title={desc}>
              {desc}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )
        },
      },
      {
        id: 'amount',
        header: () => <span className="block text-right">Nominal</span>,
        accessorFn: (tx) => Number(tx.amount),
        cell: ({ row }) => {
          const isIncome = row.original.type === 'income'
          return (
            <div
              className={
                'whitespace-nowrap text-right font-semibold ' +
                (isIncome ? 'text-emerald-700' : 'text-rose-700')
              }
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(Number(row.original.amount))}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Aksi</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setViewing(row.original)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
              title="Detail"
              aria-label="Detail transaksi"
            >
              <HiOutlineEye className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(row.original)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-brand-700"
              title={t.common.edit}
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(row.original)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
              title={t.common.delete}
            >
              <HiOutlineTrash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walletMap, categoryMap, t, filteredTx, selectedIds],
  )

  return (
    <div>
      <PageHeader
        title={t.transactions.title}
        subtitle={t.transactions.subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <HiOutlineArrowDownTray className="mr-1 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={() => navigate('/app/transactions/add')}>
              <HiPlus className="mr-1 h-4 w-4" />
              Tambah Transaksi
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="Pemasukan" helper="Sesuai filter aktif" value={summary.income} tone="emerald" />
          <SummaryCard label="Pengeluaran" helper="Sesuai filter aktif" value={summary.expense} tone="rose" />
          <SummaryCard label="Net Cashflow" helper={`${summary.count} transaksi`} value={summary.net} tone={summary.net >= 0 ? 'slate' : 'rose'} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCard label="Pemasukan Hari Ini" helper="Total hari ini" value={todaySummary.income} tone="emerald" compact />
          <SummaryCard label="Pengeluaran Hari Ini" helper="Total hari ini" value={todaySummary.expense} tone="rose" compact />
        </div>
      </div>

      {/* Filter bar */}
      <Card className="mb-4 bg-white/60">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <HiOutlineFunnel className="h-4 w-4" />
                Filter
                {hasActiveFilter ? (
                  <span className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    !
                  </span>
                ) : null}
              </button>
              <h3 className="hidden items-center gap-2 text-sm font-semibold text-slate-700 lg:inline-flex">
                <HiOutlineFunnel className="h-4 w-4" />
                Filter
              </h3>
            </div>
            {hasActiveFilter ? (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-slate-500 hover:text-rose-600"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" /> Reset
              </button>
            ) : null}
          </div>

          <div className={(showFilters ? 'grid' : 'hidden') + ' grid-cols-1 gap-3 sm:grid-cols-2 lg:grid! lg:grid-cols-4'}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Jenis</label>
              <RSelect
                value={typeFilter}
                options={[
                  { value: 'all', label: 'Semua' },
                  { value: 'income', label: 'Pemasukan' },
                  { value: 'expense', label: 'Pengeluaran' },
                ]}
                onChange={(v) => {
                  setTypeFilter((v as TypeFilter) ?? 'all')
                  setCategoryFilter('')
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori</label>
              <RSelect
                value={categoryFilter}
                options={categoryFilterOptions}
                onChange={(v) => setCategoryFilter(v ?? '')}
              />
            </div>
            <div>
              <DateInput
                label="Dari Tanggal"
                value={dateFrom}
                onChange={(d) => setDateFrom(d)}
                placeholderText="Pilih tanggal"
                maxDate={dateTo ?? undefined}
              />
            </div>
            <div>
              <DateInput
                label="Sampai Tanggal"
                value={dateTo}
                onChange={(d) => setDateTo(d)}
                placeholderText="Pilih tanggal"
                minDate={dateFrom ?? undefined}
              />
            </div>
          </div>
        </div>
      </Card>

      {selectedIds.size > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
              <HiOutlineTrash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-rose-950">
                {selectedIds.size} transaksi dipilih
              </p>
              <p className="mt-0.5 text-xs leading-5 text-rose-700">
                Hapus massal akan menghitung ulang saldo dompet setelah transaksi dihapus.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="border-rose-100 !bg-white text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-rose-50"
              onClick={() => setSelectedIds(new Set())}
            >
              Batal Pilih
            </Button>
            <Button
              variant="danger"
              onClick={onBulkDelete}
              loading={bulkRemove.isPending}
              leftIcon={<HiOutlineTrash className="h-4 w-4" />}
            >
              Hapus Terpilih
            </Button>
          </div>
        </div>
      ) : null}

      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        <DataTable
          data={filteredTx}
          columns={columns}
          loading={q.isLoading}
          searchPlaceholder="Cari kategori, dompet, deskripsi…"
          emptyTitle="Belum ada transaksi"
          emptyAction={
            <Button onClick={() => navigate('/app/transactions/add')}>
              <HiPlus className="mr-1 h-4 w-4" />
              Tambah Transaksi
            </Button>
          }
          getRowId={(r) => r.id}
          initialPageSize={10}
          onRowClick={(r) => setViewing(r)}
        />
      </div>

      {/* Mobile cards */}
      <MobileTransactionList
        loading={q.isLoading}
        items={filteredTx}
        walletMap={walletMap}
        categoryMap={categoryMap}
        onView={(tx) => setViewing(tx)}
        onEdit={setEditing}
        onDelete={onDelete}
        selectedIds={selectedIds}
        onToggleSelected={toggleSelected}
      />

      <DetailModal
        tx={viewing}
        walletName={viewing ? walletMap.get(viewing.wallet_id) : undefined}
        categoryName={viewing ? categoryMap.get(viewing.category_id) : undefined}
        onClose={() => setViewing(null)}
        onEdit={(tx) => { setViewing(null); setEditing(tx) }}
        onDelete={(tx) => { setViewing(null); onDelete(tx) }}
      />

      <EditModal
        key={editing?.id ?? 'noedit'}
        tx={editing}
        onClose={() => setEditing(null)}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        categoryOptions={categoryFilterOptions}
      />
    </div>
  )
}

function SummaryCard({
  label,
  helper,
  value,
  tone,
  compact,
}: {
  label: string
  helper?: string
  value: number
  tone: 'emerald' | 'rose' | 'slate'
  compact?: boolean
}) {
  const isNet = tone === 'slate'
  const isIncome = tone === 'emerald' || (isNet && value >= 0)
  const signedValue = isNet && value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value)
  
  const glassStyle = isNet
    ? value >= 0
      ? {
          background: 'rgba(255, 255, 255, 0.68)',
          border: '1px solid rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        }
      : {
          background: 'rgba(255, 255, 255, 0.68)',
          border: '1px solid rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        }
    : isIncome
    ? {
        background: 'rgba(255, 255, 255, 0.68)',
        border: '1px solid rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
      }
    : {
        background: 'rgba(255, 255, 255, 0.68)',
        border: '1px solid rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
      }

  const colour = isIncome
    ? 'text-emerald-700'
    : 'text-rose-700'

  return (
    <div
      style={glassStyle}
      className={cn(
        'group relative overflow-hidden rounded-2xl px-5 py-4 shadow-lg shadow-slate-200/30 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md',
        compact && 'lg:px-4',
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/35 blur-2xl transition group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </div>
          {helper ? <p className="mt-1 text-[11px] font-medium text-slate-400">{helper}</p> : null}
        </div>
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black',
            isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
          )}
        >
          {isIncome ? '+' : '-'}
        </span>
      </div>
      <div className={cn('relative mt-3 font-black tracking-tight tabular-nums', colour, compact ? 'text-lg' : 'text-xl')}>
        {signedValue}
      </div>
    </div>
  )
}


function MobileTransactionList({
  loading,
  items,
  walletMap,
  categoryMap,
  onView,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelected,
}: {
  loading: boolean
  items: Transaction[]
  walletMap: Map<string, string>
  categoryMap: Map<string, string>
  onView: (tx: Transaction) => void
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
  selectedIds: Set<string>
  onToggleSelected: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = useMemo(() => {
    if (!search) return items
    const s = search.toLowerCase()
    return items.filter((tx) => {
      const cat = (categoryMap.get(tx.category_id) ?? '').toLowerCase()
      const wlt = (walletMap.get(tx.wallet_id) ?? '').toLowerCase()
      const desc = (tx.merchant_name || tx.description || '').toLowerCase()
      return cat.includes(s) || wlt.includes(s) || desc.includes(s)
    })
  }, [items, search, walletMap, categoryMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  if (!loading && items.length === 0) return null

  return (
    <div className="space-y-3 md:hidden">
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Cari…"
        className="w-full rounded-xl border border-white/60 bg-white/40 px-3.5 py-2.5 text-sm shadow-sm backdrop-blur-md focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-300"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/30 border border-white/40" />
          ))}
        </div>
      ) : (
        <>
          {visible.map((tx, i) => {
            const isIncome = tx.type === 'income'
            const cat = categoryMap.get(tx.category_id) ?? '—'
            const wlt = walletMap.get(tx.wallet_id) ?? '—'
            const { Icon: CatIcon, tone: catTone } = resolveCategoryIcon(cat)
            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md hover:bg-white/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tx.id)}
                      onChange={() => onToggleSelected(tx.id)}
                      aria-label="Pilih transaksi"
                      className="mt-3 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-brand-600 transition hover:scale-110 focus:ring-brand-500"
                    />
                    <div className={'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/10 ' + catTone}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          #{start + i + 1}
                        </span>
                        <Badge tone={isIncome ? 'green' : 'red'}>
                          {isIncome ? (
                            <HiOutlineArrowDownCircle className="h-3 w-3" />
                          ) : (
                            <HiOutlineArrowUpCircle className="h-3 w-3" />
                          )}
                          <span className="ml-1 font-semibold">{isIncome ? 'Masuk' : 'Keluar'}</span>
                        </Badge>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold text-slate-900">{cat}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(tx.transaction_date)} · {wlt}
                      </p>
                      {(tx.merchant_name || tx.description) && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {tx.merchant_name || tx.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={
                      'shrink-0 text-right text-base font-black ' +
                      (isIncome ? 'text-emerald-700' : 'text-rose-700')
                    }
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-white/60 pt-2">
                  <button
                    onClick={() => onView(tx)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white/80 transition-all"
                  >
                    <HiOutlineEye className="h-4 w-4" />
                    <span className="sr-only">Detail</span>
                  </button>
                  <button
                    onClick={() => onEdit(tx)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white/80 transition-all"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(tx)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-all"
                  >
                    <HiOutlineTrash className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Tidak ada transaksi yang cocok.
            </div>
          ) : null}

          {filtered.length > pageSize ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span>
                Hal. {safePage}/{totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
                >
                  ‹
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

/* ─────────────────────── Detail modal ─────────────────────── */

function DetailModal({
  tx,
  walletName,
  categoryName,
  onClose,
  onEdit,
  onDelete,
}: {
  tx: Transaction | null
  walletName?: string
  categoryName?: string
  onClose: () => void
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
}) {
  if (!tx) return null
  const isIncome = tx.type === 'income'
  const { Icon: CatIcon } = resolveCategoryIcon(categoryName)
  const sourceLabel =
    tx.source && tx.source !== 'manual'
      ? tx.source === 'ai_ocr'
        ? 'Hasil Scan AI'
        : tx.source === 'import'
        ? 'Impor'
        : tx.source === 'api'
        ? 'API'
        : tx.source
      : null
  return (
    <Modal
      open={Boolean(tx)}
      onClose={onClose}
      title="Detail Transaksi"
      description="Ringkasan lengkap transaksi"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {onEdit ? (
            <Button
              variant="outline"
              leftIcon={<HiOutlinePencilSquare className="h-4 w-4" />}
              onClick={() => onEdit(tx)}
            >
              <span className="sr-only">Edit</span>
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="danger"
              leftIcon={<HiOutlineTrash className="h-4 w-4" />}
              onClick={() => onDelete(tx)}
            >
              <span className="sr-only">Hapus</span>
            </Button>
          ) : null}
        </>
      }
    >
      {/* Hero — softer gradient */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4 shadow-inner backdrop-blur-md',
          isIncome
            ? 'bg-gradient-to-br from-emerald-500/10 via-white/40 to-white/10 border-emerald-500/20'
            : 'bg-gradient-to-br from-rose-500/10 via-white/40 to-white/10 border-rose-500/20',
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm backdrop-blur-sm',
              isIncome
                ? 'bg-white/80 text-emerald-700 border-emerald-200/50'
                : 'bg-white/80 text-rose-700 border-rose-200/50',
            )}
          >
            <CatIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={isIncome ? 'green' : 'red'}>
                {isIncome ? (
                  <HiOutlineArrowDownCircle className="h-3.5 w-3.5" />
                ) : (
                  <HiOutlineArrowUpCircle className="h-3.5 w-3.5" />
                )}
                <span className="ml-1 font-semibold">{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
              </Badge>
              {sourceLabel ? <Badge tone="violet">{sourceLabel}</Badge> : null}
            </div>
            <div className="mt-1.5 truncate text-xs font-bold uppercase tracking-wider text-slate-500">
              {categoryName ?? '—'}
            </div>
            <div
              className={cn(
                'mt-1 text-2xl font-black tabular-nums sm:text-3xl',
                isIncome ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {isIncome ? '+ ' : '- '}
              {formatCurrency(Number(tx.amount))}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {formatDate(tx.transaction_date)}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <InfoTile label="Dompet" value={walletName ?? '—'} />
        <InfoTile label="Merchant" value={tx.merchant_name || '—'} />
        <InfoTile
          label="Deskripsi"
          value={
            <span className="block whitespace-pre-wrap text-slate-700">
              {tx.description || '—'}
            </span>
          }
          className="col-span-2"
        />
        {typeof tx.confidence_score === 'number' ? (
          <InfoTile
            label="AI Confidence"
            value={
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      tx.confidence_score >= 0.8
                        ? 'bg-emerald-500'
                        : tx.confidence_score >= 0.5
                        ? 'bg-amber-500'
                        : 'bg-rose-500',
                    )}
                    data-pct={(tx.confidence_score * 100).toFixed(0)}
                    style={{ width: `${(tx.confidence_score * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {(tx.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            }
            className="col-span-2"
          />
        ) : null}
      </div>
    </Modal>
  )
}

function InfoTile({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/60 bg-white/40 px-4 py-3 shadow-inner backdrop-blur-md transition-all duration-300 hover:bg-white/60',
        className
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

/* ─────────────────────── Edit modal ─────────────────────── */

function EditModal({
  tx,
  onClose,
}: {
  tx: Transaction | null
  onClose: () => void
}) {
  const t = useT()
  const qc = useQueryClient()
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
  })

  const [form, setForm] = useState<TransactionUpdatePayload>(() => ({
    wallet_id: tx?.wallet_id,
    category_id: tx?.category_id,
    amount: tx ? Number(tx.amount) : 0,
    type: tx?.type ?? 'expense',
    description: tx?.description ?? '',
    merchant_name: tx?.merchant_name ?? '',
    transaction_date: tx?.transaction_date,
  }))

  const filteredCats = useMemo(
    () =>
      (categories.data ?? [])
        .filter((c) => c.type === form.type)
        .map<SelectOption>((c) => ({ value: c.id, label: c.name })),
    [categories.data, form.type],
  )

  const walletOpts = useMemo(
    () =>
      (wallets.data ?? []).map<SelectOption>((w) => ({
        value: w.id,
        label: w.name,
      })),
    [wallets.data],
  )

  const m = useMutation({
    mutationFn: () => {
      if (!tx) throw new Error('No transaction')
      const payload: TransactionUpdatePayload = {
        ...form,
        transaction_date: form.transaction_date
          ? new Date(form.transaction_date).toISOString()
          : undefined,
      }
      return transactionApi.update(tx.id, payload)
    },
    onSuccess: () => {
      toast.success('Transaksi diperbarui')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={Boolean(tx)}
      onClose={onClose}
      title={tx ? 'Edit Transaksi' : ''}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button loading={m.isPending} onClick={() => m.mutate()}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <RSelect
          label="Jenis"
          value={form.type ?? 'expense'}
          options={[
            { value: 'expense', label: 'Pengeluaran' },
            { value: 'income', label: 'Pemasukan' },
          ]}
          onChange={(v) =>
            setForm({
              ...form,
              type: (v as 'income' | 'expense') ?? 'expense',
              category_id: undefined,
            })
          }
        />
        <RSelect
          label="Dompet"
          value={form.wallet_id ?? ''}
          options={walletOpts}
          onChange={(v) => setForm({ ...form, wallet_id: v ?? '' })}
        />
        <RSelect
          label="Kategori"
          value={form.category_id ?? ''}
          options={filteredCats}
          onChange={(v) => setForm({ ...form, category_id: v ?? '' })}
        />
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Nominal
          </label>
          <CurrencyInput
            value={Number(form.amount ?? 0)}
            onChange={(val) => setForm({ ...form, amount: val })}
          />
        </div>
        <DateInput
          label="Tanggal"
          value={form.transaction_date || null}
          onChange={(d) =>
            setForm({
              ...form,
              transaction_date: d ? d.toISOString() : undefined,
            })
          }
          placeholderText="Pilih tanggal"
        />
        <Input
          label="Merchant"
          placeholder="cth: Indomaret"
          value={form.merchant_name ?? ''}
          onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
        />
        <Textarea
          label="Deskripsi"
          rows={2}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </Modal>
  )
}


type ExportMode = 'month' | 'range'

function ExportModal({
  open,
  onClose,
  categoryOptions,
}: {
  open: boolean
  onClose: () => void
  categoryOptions: SelectOption[]
}) {
  const [mode, setMode] = useState<ExportMode>('month')
  const [month, setMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [typeF, setTypeF] = useState<TypeFilter>('all')
  const [catF, setCatF] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const onExport = async () => {
    setBusy(true)
    try {
      const params: Record<string, string> = {}
      if (mode === 'month') {
        if (month) {
          params.month = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
        }
      } else {
        if (from) params.from = from.toISOString()
        if (to) {
          const end = new Date(to)
          end.setHours(23, 59, 59, 999)
          params.to = end.toISOString()
        }
      }
      if (typeF !== 'all') params.type = typeF
      if (catF) params.category_id = catF

      const blob = await transactionApi.exportXlsx(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const monthStamp = month ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}` : 'bulan'
      const stamp = mode === 'month' ? monthStamp : `${(from ?? new Date()).toISOString().slice(0, 10)}_${(to ?? new Date()).toISOString().slice(0, 10)}`
      a.download = `transaksi-${stamp}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('File berhasil diunduh')
      onClose()
    } catch (e) {
      toast.error(toErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Transaksi ke Excel"
      description="Pilih periode dan filter sebelum mengunduh data transaksi."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Batal</Button>
          <Button onClick={onExport} loading={busy}>
            <HiOutlineArrowDownTray className="mr-1 h-4 w-4" />
            Download .xlsx
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('month')}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
              mode === 'month'
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200/50'
                : 'border-white/80 bg-white/62 text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white',
            )}
          >
            Per Bulan
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
              mode === 'range'
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200/50'
                : 'border-white/80 bg-white/62 text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white',
            )}
          >
            Range Tanggal
          </button>
        </div>

        {mode === 'month' ? (
          <DateInput
            picker="month"
            label="Pilih Bulan"
            value={month}
            onChange={setMonth}
            placeholderText="Pilih bulan"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <DateInput label="Dari" value={from} onChange={setFrom} placeholderText="Pilih tanggal" maxDate={to ?? undefined} />
            <DateInput label="Sampai" value={to} onChange={setTo} placeholderText="Pilih tanggal" minDate={from ?? undefined} />
          </div>
        )}

        <RSelect
          label="Jenis"
          value={typeF}
          options={[
            { value: 'all', label: 'Semua' },
            { value: 'income', label: 'Pemasukan' },
            { value: 'expense', label: 'Pengeluaran' },
          ]}
          onChange={(v) => setTypeF((v as TypeFilter) ?? 'all')}
        />
        <RSelect
          label="Kategori"
          value={catF}
          options={categoryOptions}
          onChange={(v) => setCatF(v ?? '')}
        />
      </div>
    </Modal>
  )
}
