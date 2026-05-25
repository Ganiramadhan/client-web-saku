import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiPlus,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineEye,
  HiOutlineArrowPath,
} from 'react-icons/hi2'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import {
  Button,
  Card,
  DataTable,
  DateInput,
  PageHeader,
  RSelect,
  type SelectOption,
} from '@/components/ui'
import { MobileFab } from '@/components/MobileFab'
import { useLocale, useT } from '@/i18n'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import type { Transaction } from '@/types/api'
import {
  CategoryCell,
  DetailModal,
  EditModal,
  ExportModal,
  MobileTransactionList,
  SummaryCard,
} from '../components/TransactionsListPanels'
import { getTransactionCopy } from '../constants/copy'

type TypeFilter = 'all' | 'income' | 'expense'
export function TransactionsListPage() {
  const t = useT()
  const { locale } = useLocale()
  const txCopy = getTransactionCopy(locale)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [viewing, setViewing] = useState<Transaction | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  // filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<Date | null>(null)
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
    queryFn: () => transactionApi.list({ page: 1, limit: 200 }),
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
      { value: '', label: txCopy.allCategories },
      ...cats.map((c) => ({ value: c.id, label: c.name })),
    ]
  }, [categories.data, typeFilter, txCopy.allCategories])

  const filteredTx = useMemo(() => {
    const all = q.data?.data ?? []
    return all.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (categoryFilter && tx.category_id !== categoryFilter) return false
      if (monthFilter) {
        const txDate = new Date(tx.transaction_date)
        if (
          txDate.getFullYear() !== monthFilter.getFullYear() ||
          txDate.getMonth() !== monthFilter.getMonth()
        ) {
          return false
        }
      }
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
  }, [q.data, typeFilter, categoryFilter, monthFilter, dateFrom, dateTo])

  useEffect(() => {
    if (dateFrom && dateTo && dateTo < dateFrom) {
      setDateTo(null)
    }
  }, [dateFrom, dateTo])

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
      toast.success(txCopy.deleted)
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
      toast.success(txCopy.deletedMany(ids.length))
      setSelectedIds(new Set())
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (tx: Transaction) => {
    const ok = await confirm({
      title: txCopy.deleteTitle,
      description: txCopy.deleteDescription,
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
      title: txCopy.deleteManyTitle(ids.length),
      description: txCopy.deleteManyDescription,
      tone: 'danger',
      confirmLabel: txCopy.deleteAll,
    })
    if (ok) bulkRemove.mutate(ids)
  }

  const resetFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('')
    setMonthFilter(null)
    setDateFrom(null)
    setDateTo(null)
  }

  const hasActiveFilter =
    typeFilter !== 'all' || categoryFilter !== '' || monthFilter !== null || dateFrom !== null || dateTo !== null

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
                aria-label={txCopy.deleteAll}
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
              aria-label={txCopy.detail}
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
        header: txCopy.date,
        accessorFn: (tx) => tx.transaction_date,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-slate-700">
            {formatDate(row.original.transaction_date)}
          </span>
        ),
      },
      {
        id: 'category',
        header: txCopy.category,
        accessorFn: (tx) => categoryMap.get(tx.category_id) ?? '—',
        cell: ({ row }) => (
          <CategoryCell name={categoryMap.get(row.original.category_id) ?? '—'} />
        ),
      },
      {
        id: 'description',
        header: txCopy.description,
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
        header: () => <span className="block text-right">{txCopy.amount}</span>,
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
        header: () => <span className="block text-right">{txCopy.action}</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setViewing(row.original)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
              title={txCopy.detail}
              aria-label={txCopy.detail}
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
            <Button
              variant="outline"
              onClick={() => q.refetch()}
              loading={q.isFetching}
              leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <HiOutlineArrowDownTray className="mr-1 h-4 w-4" />
              {txCopy.exportExcel}
            </Button>
            <div className="hidden sm:block">
              <Button onClick={() => navigate('/app/transactions/add')}>
                <HiPlus className="mr-1 h-4 w-4" />
                {txCopy.add}
              </Button>
            </div>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label={txCopy.income} helper={txCopy.matchesFilter} value={summary.income} tone="emerald" />
          <SummaryCard label={txCopy.expense} helper={txCopy.matchesFilter} value={summary.expense} tone="rose" />
          <SummaryCard label={txCopy.netCashflow} helper={`${summary.count} ${txCopy.transactionCount}`} value={summary.net} tone={summary.net >= 0 ? 'slate' : 'rose'} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCard label={txCopy.todayIncome} helper={txCopy.todayTotal} value={todaySummary.income} tone="emerald" compact />
          <SummaryCard label={txCopy.todayExpense} helper={txCopy.todayTotal} value={todaySummary.expense} tone="rose" compact />
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
                {txCopy.filter}
                {hasActiveFilter ? (
                  <span className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    !
                  </span>
                ) : null}
              </button>
              <h3 className="hidden items-center gap-2 text-sm font-semibold text-slate-700 lg:inline-flex">
                <HiOutlineFunnel className="h-4 w-4" />
                {txCopy.filter}
              </h3>
            </div>
            {hasActiveFilter ? (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-slate-500 hover:text-rose-600"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" /> {txCopy.reset}
              </button>
            ) : null}
          </div>

          <div className={(showFilters ? 'grid' : 'hidden') + ' grid-cols-1 gap-3 sm:grid-cols-2 lg:grid! lg:grid-cols-5'}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">{txCopy.type}</label>
              <RSelect
                value={typeFilter}
                options={[
                  { value: 'all', label: txCopy.all },
                  { value: 'income', label: txCopy.income },
                  { value: 'expense', label: txCopy.expense },
                ]}
                onChange={(v) => {
                  setTypeFilter((v as TypeFilter) ?? 'all')
                  setCategoryFilter('')
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">{txCopy.category}</label>
              <RSelect
                value={categoryFilter}
                options={categoryFilterOptions}
                onChange={(v) => setCategoryFilter(v ?? '')}
              />
            </div>
            <div>
              <DateInput
                label={txCopy.month}
                value={monthFilter}
                onChange={(d) => setMonthFilter(d)}
                picker="month"
                placeholderText={txCopy.allMonths}
              />
            </div>
            <div>
              <DateInput
                label={txCopy.fromDate}
                value={dateFrom}
                onChange={(d) => {
                  setDateFrom(d)
                  if (d && dateTo && dateTo < d) setDateTo(null)
                }}
                placeholderText={txCopy.pickDate}
                maxDate={dateTo ?? undefined}
              />
            </div>
            <div>
              <DateInput
                label={txCopy.toDate}
                value={dateTo}
                onChange={(d) => setDateTo(d)}
                placeholderText={dateFrom ? txCopy.pickDate : txCopy.pickStartFirst}
                minDate={dateFrom ?? undefined}
                disabled={!dateFrom}
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
                {selectedIds.size} {txCopy.selected}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-rose-700">
                {txCopy.bulkHelp}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => setSelectedIds(new Set())}
            >
              {txCopy.cancelSelect}
            </Button>
            <Button
              variant="danger"
              onClick={onBulkDelete}
              loading={bulkRemove.isPending}
              leftIcon={<HiOutlineTrash className="h-4 w-4" />}
            >
              {txCopy.deleteSelected}
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
          searchPlaceholder={txCopy.searchPlaceholder}
          emptyTitle={txCopy.emptyTitle}
          emptyAction={
            <Button onClick={() => navigate('/app/transactions/add')}>
              <HiPlus className="mr-1 h-4 w-4" />
              {txCopy.add}
            </Button>
          }
          getRowId={(r) => r.id}
          initialPageSize={10}
          onRowClick={(r) => setViewing(r)}
          labels={txCopy.tableLabels}
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
        copy={txCopy}
      />

      <DetailModal
        tx={viewing}
        walletName={viewing ? walletMap.get(viewing.wallet_id) : undefined}
        categoryName={viewing ? categoryMap.get(viewing.category_id) : undefined}
        onClose={() => setViewing(null)}
        onEdit={(tx) => { setViewing(null); setEditing(tx) }}
        onDelete={(tx) => { setViewing(null); onDelete(tx) }}
        copy={txCopy}
      />

      <EditModal
        key={editing?.id ?? 'noedit'}
        tx={editing}
        onClose={() => setEditing(null)}
        copy={txCopy}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        categoryOptions={categoryFilterOptions}
        copy={txCopy}
      />
      <MobileFab
        label={txCopy.add}
        icon={<HiPlus className="h-6 w-6" />}
        onClick={() => navigate('/app/transactions/add')}
      />
    </div>
  )
}
