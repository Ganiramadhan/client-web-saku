import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineLightBulb,
  HiOutlinePlus,
  HiOutlineWallet,
} from 'react-icons/hi2'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { walletApi } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import { categoryApi } from '@/features/categories/api'
import { subscriptionApi, type Subscription } from '@/features/subscription/api'
import { upcomingBillingApi, type UpcomingBilling } from '@/features/billing/api'
import { Card, PageHeader, Shimmer, EmptyState, Button } from '@/components/ui'
import { useT } from '@/i18n'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Category, Transaction } from '@/types/api'

type TrendRange = 'today' | '7d' | '30d' | '6mo'

interface CategoryInsight {
  id: string
  name: string
  amount: number
  count: number
}

const TONE = {
  brand: {
    bg: 'rgba(239, 246, 255, 0.55)',
    border: '1px solid rgba(191, 219, 254, 0.70)',
    iconBg: 'rgba(219, 234, 254, 0.90)',
    iconBorder: '1px solid rgba(191, 219, 254, 0.80)',
    icon: 'text-blue-600',
    value: 'text-blue-950',
  },
  emerald: {
    bg: 'rgba(236, 253, 245, 0.55)',
    border: '1px solid rgba(167, 243, 208, 0.70)',
    iconBg: 'rgba(209, 250, 229, 0.90)',
    iconBorder: '1px solid rgba(167, 243, 208, 0.80)',
    icon: 'text-emerald-600',
    value: 'text-emerald-950',
  },
  rose: {
    bg: 'rgba(255, 241, 242, 0.55)',
    border: '1px solid rgba(254, 205, 211, 0.70)',
    iconBg: 'rgba(254, 226, 226, 0.90)',
    iconBorder: '1px solid rgba(254, 205, 211, 0.80)',
    icon: 'text-rose-600',
    value: 'text-rose-950',
  },
  slate: {
    bg: 'rgba(245, 243, 255, 0.55)',
    border: '1px solid rgba(221, 214, 254, 0.70)',
    iconBg: 'rgba(237, 233, 254, 0.90)',
    iconBorder: '1px solid rgba(221, 214, 254, 0.80)',
    icon: 'text-violet-600',
    value: 'text-violet-950',
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
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
  })

  const activeSubscription = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
  })

  const upcomingBillings = useQuery({
    queryKey: ['upcoming-billings'],
    queryFn: upcomingBillingApi.list,
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

  const categoryInsights = useMemo(
    () => buildCategoryInsights(monthTxns.data?.data ?? [], categories.data ?? []),
    [monthTxns.data, categories.data],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.common.welcome}${user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋`}
        subtitle="Ringkasan kondisi keuangan, transaksi terbaru, dan performa bulanan kamu."
        action={
          <Link to="/app/transactions">
            <Button
              className="rounded-xl !bg-blue-600 font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500"
              leftIcon={<HiOutlinePlus className="h-4 w-4" />}
            >
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
        <AiCategoryInsight
          loading={monthTxns.isLoading || categories.isLoading}
          insights={categoryInsights}
          expense={monthSummary.expense}
        />

        <UpcomingBillingCard
          loading={activeSubscription.isLoading || upcomingBillings.isLoading}
          subscription={activeSubscription.data ?? null}
          billings={upcomingBillings.data ?? []}
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
              <ul className="space-y-1">
                {recentTxns.data!.data.map((tx) => (
                  <li
                    key={tx.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-transparent px-3 py-2.5 transition-all duration-300 hover:bg-white/40 hover:border-white/50 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105',
                          tx.type === 'income'
                            ? 'bg-emerald-55 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-55 text-rose-700 border border-rose-100',
                        )}
                        style={{
                          background: tx.type === 'income' ? 'rgba(209, 250, 229, 0.60)' : 'rgba(254, 226, 226, 0.60)',
                        }}
                      >
                        {tx.type === 'income' ? (
                          <HiOutlineArrowTrendingUp className="h-5 w-5" />
                        ) : (
                          <HiOutlineArrowTrendingDown className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {tx.description || 'Tanpa deskripsi'}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{formatDate(tx.transaction_date)}</span>
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
    <div
      className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-md"
      style={{
        background: color.bg,
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: color.border,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.80)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-600">{label}</p>

        <div
          className={cn('flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105', color.icon)}
          style={{
            background: color.iconBg,
            border: color.iconBorder,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <Shimmer className="mt-4 h-8 w-32 rounded-xl" />
      ) : (
        <p className={cn('relative mt-4 text-3xl font-extrabold tracking-tight', color.value)}>
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
    <div
      className="rounded-2xl p-6 text-white transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.92), rgba(15, 23, 42, 0.90))',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }}
    >
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

function AiCategoryInsight({
  loading,
  insights,
  expense,
}: {
  loading?: boolean
  insights: CategoryInsight[]
  expense: number
}) {
  const top = insights[0]
  const topPct = top && expense > 0 ? Math.round((top.amount / expense) * 100) : 0

  return (
    <Card className="xl:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            AI Insight
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-950">
            Kategori Pengeluaran
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Ringkasan kategori terbesar bulan ini dari transaksi yang sudah tercatat.
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
          <HiOutlineLightBulb className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Shimmer key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !top ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-sm text-slate-500">
          Belum ada pengeluaran bulan ini. Insight kategori akan muncul setelah ada transaksi.
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-blue-950">
              {top.name} menyerap {topPct}% dari pengeluaran bulan ini.
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              Cek transaksi di kategori ini sebelum menambah pengeluaran baru, terutama jika nominalnya mulai melewati pola bulanan kamu.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {insights.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-sm"
              >
                <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">
                  {formatCurrency(item.amount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.count} transaksi</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

function UpcomingBillingCard({
  loading,
  subscription,
  billings,
}: {
  loading?: boolean
  subscription: Subscription | null
  billings: UpcomingBilling[]
}) {
  const rows = useMemo(
    () => buildUpcomingBillingRows(subscription, billings),
    [subscription, billings],
  )
  const urgentCount = rows.filter((row) => row.daysLeft >= 0 && row.daysLeft <= row.reminderWindow).length

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Upcoming Billing
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-950">
            Tagihan Berikutnya
          </h2>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600">
          <HiOutlineCalendarDays className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          <Shimmer className="h-8 w-32 rounded-xl" />
          <Shimmer className="h-4 w-full rounded-xl" />
        </div>
      ) : rows.length > 0 ? (
        <div className="mt-5">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Reminder terdekat
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-950">
              {rows[0].name}
            </p>
            <p className="mt-1 text-sm leading-6 text-violet-900">
              {formatCurrency(rows[0].amount, rows[0].currency)} jatuh tempo {formatDate(rows[0].dueDate)}
            </p>
          </div>
          <span
            className={cn(
              'mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold',
              urgentCount > 0
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
            )}
          >
            {urgentCount > 0 ? `${urgentCount} tagihan perlu dicek` : 'Semua tagihan aman'}
          </span>
          <div className="mt-4 space-y-2">
            {rows.slice(0, 4).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/55 px-3 py-2.5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{row.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {row.provider} · {row.daysLeft <= 0 ? 'hari ini' : `${row.daysLeft} hari lagi`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-slate-950">
                  {formatCurrency(row.amount, row.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-sm text-slate-500">
          Belum ada reminder tagihan. Tambahkan VPS, domain, SaaS, atau langganan lain dari menu Upcoming Billing.
        </div>
      )}
    </Card>
  )
}

interface UpcomingBillingRow {
  id: string
  name: string
  provider: string
  amount: number
  currency: string
  dueDate: string
  daysLeft: number
  reminderWindow: number
}

function buildUpcomingBillingRows(
  subscription: Subscription | null,
  billings: UpcomingBilling[],
): UpcomingBillingRow[] {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const activeRows = billings
    .filter((item) => item.status === 'active')
    .map((item) => ({
      id: item.id,
      name: item.name,
      provider: item.provider || 'Reminder',
      amount: Number(item.amount),
      currency: item.currency || 'IDR',
      dueDate: item.due_date,
      daysLeft: daysUntil(item.due_date, startOfToday),
      reminderWindow: 7,
    }))

  const subscriptionDate = subscription?.next_billing_at ?? subscription?.ends_at ?? null
  const subscriptionRow =
    subscription && subscriptionDate
      ? [{
          id: `subscription-${subscription.id}`,
          name: `Langganan ${subscription.plan_name}`,
          provider: 'SAKU',
          amount: Number(subscription.amount),
          currency: subscription.currency || 'IDR',
          dueDate: subscriptionDate,
          daysLeft: daysUntil(subscriptionDate, startOfToday),
          reminderWindow: subscription.plan_code?.includes('year') ? 30 : 7,
        }]
      : []

  return [...activeRows, ...subscriptionRow].sort((a, b) => {
    const diff = a.daysLeft - b.daysLeft
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name)
  })
}

function daysUntil(dateLike: string, startOfToday: Date): number {
  const due = new Date(dateLike)
  if (Number.isNaN(due.getTime())) return 9999
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - startOfToday.getTime()) / 86_400_000)
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
          <p className="rounded-2xl bg-white/40 px-4 py-5 text-center text-sm text-slate-500 border border-white/50">
            {emptyLabel}
          </p>
        ) : (
          wallets.slice(0, 5).map((wallet) => (
            <div
              key={wallet.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-white/40 px-4 py-3 transition-all duration-300 hover:bg-white/70 hover:border-white/60 hover:shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 border border-slate-100">
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
    <div className="inline-flex rounded-xl border border-white/80 bg-white/65 p-1 text-xs font-semibold shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 transition',
            value === option.value
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-200/70'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {option.label}
        </button>
      ))}
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

function buildCategoryInsights(txns: Transaction[], categories: Category[]): CategoryInsight[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]))
  const totals = new Map<string, CategoryInsight>()

  for (const tx of txns) {
    if (tx.type !== 'expense') continue

    const id = tx.category_id || 'uncategorized'
    const current = totals.get(id) ?? {
      id,
      name: categoryMap.get(id) ?? 'Uncategorized',
      amount: 0,
      count: 0,
    }

    current.amount += Number(tx.amount)
    current.count += 1
    totals.set(id, current)
  }

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount)
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
