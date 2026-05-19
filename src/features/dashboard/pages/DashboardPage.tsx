import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlinePlus,
  HiOutlineWallet,
} from 'react-icons/hi2'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { walletApi } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import { categoryApi } from '@/features/categories/api'
import { Card, PageHeader, Shimmer, Badge, EmptyState, Button } from '@/components/ui'
import { useT } from '@/i18n'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

type TrendRange = 'today' | '7d' | '30d' | '6mo'

const PIE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#64748b']

const TONE: Record<
  string,
  { bg: string; ring: string; icon: string; value: string }
> = {
  brand: {
    bg: 'bg-brand-50',
    ring: 'ring-brand-100',
    icon: 'bg-brand-100 text-brand-700',
    value: 'text-brand-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
  },
  rose: {
    bg: 'bg-rose-50',
    ring: 'ring-rose-100',
    icon: 'bg-rose-100 text-rose-700',
    value: 'text-rose-700',
  },
  slate: {
    bg: 'bg-white',
    ring: 'ring-slate-200',
    icon: 'bg-slate-100 text-slate-700',
    value: 'text-slate-900',
  },
}

export function DashboardPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [trendRange, setTrendRange] = useState<TrendRange>('7d')

  const now = useMemo(() => new Date(), [])
  const monthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
    [now],
  )
  const sixMonthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 5, 1),
    [now],
  )

  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: walletApi.list,
  })

  const recentTxns = useQuery({
    queryKey: ['transactions', { limit: 6 }],
    queryFn: () => transactionApi.list({ limit: 6, page: 1 }),
  })

  const monthTxns = useQuery({
    queryKey: ['transactions', 'month'],
    queryFn: () =>
      transactionApi.list({
        from: monthStart.toISOString(),
        to: now.toISOString(),
        limit: 1000,
      }),
  })

  const longRangeTxns = useQuery({
    queryKey: ['transactions', '6mo'],
    queryFn: () =>
      transactionApi.list({
        from: sixMonthStart.toISOString(),
        to: now.toISOString(),
        limit: 5000,
      }),
  })

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  })

  const totalBalance = useMemo(
    () => (wallets.data ?? []).reduce((sum, wallet) => sum + Number(wallet.balance ?? 0), 0),
    [wallets.data],
  )

  const monthSummary = useMemo(() => {
    const data = monthTxns.data?.data ?? []

    const income = data
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)

    const expense = data
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)

    return {
      income,
      expense,
      saved: income - expense,
      savingRate: income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0,
    }
  }, [monthTxns.data])

  const trendData = useMemo(() => {
    const txns = longRangeTxns.data?.data ?? []
    return buildTrendData(trendRange, txns, now)
  }, [trendRange, longRangeTxns.data, now])

  const monthlyData = useMemo(() => {
    const txns = longRangeTxns.data?.data ?? []
    return buildMonthlyData(txns, now)
  }, [longRangeTxns.data, now])

  const pieData = useMemo(() => {
    const catMap = new Map((categories.data ?? []).map((category) => [category.id, category]))
    const totals = new Map<string, number>()

    for (const tx of monthTxns.data?.data ?? []) {
      if (tx.type !== 'expense') continue

      const categoryName = catMap.get(tx.category_id)?.name ?? 'Lainnya'
      totals.set(categoryName, (totals.get(categoryName) ?? 0) + Number(tx.amount))
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 5)
    const rest = sorted.slice(5).reduce((sum, [, value]) => sum + value, 0)

    const result = top.map(([name, value]) => ({ name, value }))
    if (rest > 0) result.push({ name: 'Lainnya', value: rest })

    return result
  }, [monthTxns.data, categories.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.common.welcome}${user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋`}
        subtitle="Ringkasan kondisi keuangan, transaksi terbaru, dan performa bulanan kamu."
        action={
          <Link to="/app/transactions">
            <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
              {t.transactions.newTransaction}
            </Button>
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={wallets.isLoading}
          label={t.dashboard.totalBalance}
          value={formatCurrency(totalBalance)}
          Icon={HiOutlineBanknotes}
          tone="brand"
        />

        <StatCard
          loading={wallets.isLoading}
          label={t.dashboard.walletsCount}
          value={String(wallets.data?.length ?? 0)}
          Icon={HiOutlineWallet}
          tone="slate"
        />

        <StatCard
          loading={monthTxns.isLoading}
          label={t.dashboard.monthIncome}
          value={formatCurrency(monthSummary.income)}
          Icon={HiOutlineArrowTrendingUp}
          tone="emerald"
        />

        <StatCard
          loading={monthTxns.isLoading}
          label={t.dashboard.monthExpense}
          value={formatCurrency(monthSummary.expense)}
          Icon={HiOutlineArrowTrendingDown}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                {getTrendTitle(trendRange)}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Perbandingan pemasukan dan pengeluaran berdasarkan periode.
              </p>
            </div>

            <RangeTabs value={trendRange} onChange={setTrendRange} />
          </div>

          {longRangeTxns.isLoading ? (
            <Shimmer className="h-72 w-full rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={trendRange === 'today' ? 2 : trendRange === '30d' ? 4 : 0}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => compactCurrency(Number(value))}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.12}
                  name="Pemasukan"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="#f43f5e"
                  fillOpacity={0.1}
                  name="Pengeluaran"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <MonthlyInsight
          income={monthSummary.income}
          expense={monthSummary.expense}
          saved={monthSummary.saved}
          savingRate={monthSummary.savingRate}
          loading={monthTxns.isLoading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Kategori Pengeluaran</h2>
              <p className="mt-1 text-xs text-slate-500">Distribusi pengeluaran bulan ini.</p>
            </div>
            <HiOutlineChartPie className="h-5 w-5 text-slate-400" />
          </div>

          {monthTxns.isLoading || categories.isLoading ? (
            <Shimmer className="h-72 w-full rounded-2xl" />
          ) : pieData.length === 0 ? (
            <EmptyChart message="Belum ada pengeluaran bulan ini." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => <span className="text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">6 Bulan Terakhir</h2>
              <p className="mt-1 text-xs text-slate-500">
                Perbandingan pemasukan dan pengeluaran per bulan.
              </p>
            </div>
            <HiOutlineChartBar className="h-5 w-5 text-slate-400" />
          </div>

          {longRangeTxns.isLoading ? (
            <Shimmer className="h-72 w-full rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => compactCurrency(Number(value))}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Pemasukan" />
                <Bar dataKey="expense" fill="#f43f5e" radius={[8, 8, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                {t.dashboard.recentTransactions}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Aktivitas transaksi terbaru dari semua wallet.
              </p>
            </div>

            <Link
              to="/app/transactions"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              {t.dashboard.seeAll}
              <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5">
            {recentTxns.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Shimmer key={index} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (recentTxns.data?.data.length ?? 0) === 0 ? (
              <EmptyState
                title={t.common.empty}
                description={t.transactions.subtitle}
                action={
                  <Link to="/app/transactions">
                    <Button>{t.transactions.newTransaction}</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentTxns.data!.data.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700',
                        )}
                      >
                        {tx.type === 'income' ? (
                          <HiOutlineArrowTrendingUp className="h-5 w-5" />
                        ) : (
                          <HiOutlineArrowTrendingDown className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {tx.merchant_name || tx.description || 'Tanpa deskripsi'}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{formatDate(tx.transaction_date)}</span>
                          <Badge tone={tx.source === 'ai_ocr' ? 'violet' : 'gray'}>
                            {tx.source}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p
                      className={cn(
                        'shrink-0 text-sm font-bold',
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(tx.amount))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <WalletList
          loading={wallets.isLoading}
          wallets={wallets.data ?? []}
          title={t.nav.wallets}
          seeAllLabel={t.dashboard.seeAll}
          emptyLabel={t.common.empty}
        />
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
  Icon,
  tone,
}: {
  label: string
  value: string
  loading?: boolean
  Icon: ComponentType<{ className?: string }>
  tone: keyof typeof TONE
}) {
  const color = TONE[tone]

  return (
    <div className={cn('rounded-3xl p-5 shadow-sm ring-1 transition hover:shadow-md', color.bg, color.ring)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-600">{label}</p>

        <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', color.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <Shimmer className="mt-4 h-8 w-32 rounded-lg" />
      ) : (
        <p className={cn('mt-4 text-2xl font-bold tracking-tight', color.value)}>
          {value}
        </p>
      )}
    </div>
  )
}

function MonthlyInsight({
  income,
  expense,
  saved,
  savingRate,
  loading,
}: {
  income: number
  expense: number
  saved: number
  savingRate: number
  loading?: boolean
}) {
  const isPositive = saved >= 0

  return (
    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Insight Bulan Ini
      </p>

      {loading ? (
        <div className="mt-5 space-y-3">
          <Shimmer className="h-8 w-40 bg-white/10" />
          <Shimmer className="h-4 w-full bg-white/10" />
          <Shimmer className="h-4 w-2/3 bg-white/10" />
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-3xl font-bold tracking-tight">
            {formatCurrency(saved)}
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isPositive
              ? 'Bagus, pemasukan kamu masih lebih besar dari pengeluaran bulan ini.'
              : 'Pengeluaran bulan ini lebih besar dari pemasukan. Coba cek kategori terbesar.'}
          </p>

          <div className="mt-6 space-y-3">
            <InsightRow label="Pemasukan" value={formatCurrency(income)} />
            <InsightRow label="Pengeluaran" value={formatCurrency(expense)} />
            <InsightRow label="Saving rate" value={`${savingRate.toFixed(0)}%`} />
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn('h-full rounded-full', isPositive ? 'bg-emerald-400' : 'bg-rose-400')}
              style={{ width: `${Math.min(100, savingRate).toFixed(0)}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function WalletList({
  loading,
  wallets,
  title,
  seeAllLabel,
  emptyLabel,
}: {
  loading?: boolean
  wallets: { id: string; name: string; balance?: number | string | null; currency?: string }[]
  title: string
  seeAllLabel: string
  emptyLabel: string
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">Saldo dari wallet yang kamu miliki.</p>
        </div>

        <Link to="/app/wallets" className="text-xs font-semibold text-brand-700 hover:underline">
          {seeAllLabel}
        </Link>
      </div>

      <div className="mt-5 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Shimmer key={index} className="h-14 rounded-xl" />
          ))
        ) : wallets.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
            {emptyLabel}
          </p>
        ) : (
          wallets.slice(0, 5).map((wallet) => (
            <div
              key={wallet.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 ring-1 ring-slate-200">
                  <HiOutlineWallet className="h-5 w-5" />
                </div>

                <p className="truncate text-sm font-semibold text-slate-950">
                  {wallet.name}
                </p>
              </div>

              <p className="shrink-0 text-sm font-bold text-slate-950">
                {formatCurrency(Number(wallet.balance ?? 0), wallet.currency)}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

function RangeTabs({
  value,
  onChange,
}: {
  value: TrendRange
  onChange: (value: TrendRange) => void
}) {
  const options: { value: TrendRange; label: string }[] = [
    { value: 'today', label: 'Hari ini' },
    { value: '7d', label: '7 Hari' },
    { value: '30d', label: '30 Hari' },
    { value: '6mo', label: '6 Bulan' },
  ]

  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-xl px-3 py-1.5 transition',
            value === option.value
              ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
      {message}
    </div>
  )
}

function getTrendTitle(range: TrendRange): string {
  if (range === 'today') return 'Tren Hari Ini'
  if (range === '7d') return 'Tren 7 Hari'
  if (range === '30d') return 'Tren 30 Hari'
  return 'Tren 6 Bulan'
}

function buildTrendData(
  range: TrendRange,
  txns: { transaction_date: string; type: string; amount: number | string }[],
  now: Date,
) {
  const buckets: { key: string; label: string; income: number; expense: number }[] = []

  if (range === 'today') {
    for (let hour = 0; hour < 24; hour++) {
      buckets.push({
        key: String(hour),
        label: `${String(hour).padStart(2, '0')}:00`,
        income: 0,
        expense: 0,
      })
    }

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayKey = today.toISOString().slice(0, 10)

    for (const tx of txns) {
      if (tx.transaction_date.slice(0, 10) !== todayKey) continue

      const hour = new Date(tx.transaction_date).getHours()
      const row = buckets[hour]
      if (!row) continue

      if (tx.type === 'income') row.income += Number(tx.amount)
      else row.expense += Number(tx.amount)
    }

    return buckets
  }

  if (range === '7d' || range === '30d') {
    const span = range === '7d' ? 7 : 30

    for (let index = span - 1; index >= 0; index--) {
      const date = new Date(now)
      date.setDate(date.getDate() - index)

      const key = date.toISOString().slice(0, 10)
      const label = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      })

      buckets.push({ key, label, income: 0, expense: 0 })
    }

    const map = new Map(buckets.map((bucket) => [bucket.key, bucket]))

    for (const tx of txns) {
      const key = tx.transaction_date.slice(0, 10)
      const row = map.get(key)
      if (!row) continue

      if (tx.type === 'income') row.income += Number(tx.amount)
      else row.expense += Number(tx.amount)
    }

    return buckets
  }

  return buildMonthlyData(txns, now)
}

function buildMonthlyData(
  txns: { transaction_date: string; type: string; amount: number | string }[],
  now: Date,
) {
  const months: { key: string; label: string; income: number; expense: number }[] = []

  for (let index = 5; index >= 0; index--) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('id-ID', {
      month: 'short',
      year: '2-digit',
    })

    months.push({ key, label, income: 0, expense: 0 })
  }

  const map = new Map(months.map((month) => [month.key, month]))

  for (const tx of txns) {
    const date = new Date(tx.transaction_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const row = map.get(key)

    if (!row) continue

    if (tx.type === 'income') row.income += Number(tx.amount)
    else row.expense += Number(tx.amount)
  }

  return months
}

function compactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`

  return String(value)
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      {label ? <p className="mb-1 font-semibold text-slate-700">{label}</p> : null}

      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>

            <span className="font-semibold text-slate-950">
              {formatCurrency(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage