import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineWallet,
} from 'react-icons/hi2'
import { walletApi } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import { categoryApi } from '@/features/categories/api'
import { subscriptionApi, type Subscription } from '@/features/subscription/api'
import { upcomingBillingApi, type UpcomingBilling } from '@/features/billing/api'
import { budgetApi } from '@/features/budgets/api'
import { savingsGoalApi } from '@/features/targets/api'
import { Card, PageHeader, Shimmer, EmptyState, Button } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import type { Budget, Category, SavingsGoal, Transaction, Wallet } from '@/types/api'

type TrendRange = 'today' | '7d' | '30d' | '6mo'

const DashboardTrendChart = lazy(() =>
  import('../components/DashboardTrendChart').then((module) => ({ default: module.DashboardTrendChart })),
)

interface CategoryInsight {
  id: string
  name: string
  amount: number
  count: number
}

interface DashboardGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  remaining: number
  days_left?: number | null
}

const TONE = {
  brand: {
    bg: 'rgba(255, 228, 220, 0.62)',
    border: '1px solid rgba(23, 18, 15, 0.16)',
    iconBg: 'rgba(255, 111, 97, 0.22)',
    iconBorder: '1px solid rgba(23, 18, 15, 0.16)',
    icon: 'text-brand-700',
    value: 'text-[#17120f]',
  },
  emerald: {
    bg: 'rgba(236, 253, 245, 0.55)',
    border: '1px solid rgba(167, 243, 208, 0.70)',
    iconBg: 'rgba(209, 250, 229, 0.90)',
    iconBorder: '1px solid rgba(167, 243, 208, 0.80)',
    icon: 'text-emerald-700',
    value: 'text-[#134e4a]',
  },
  rose: {
    bg: 'rgba(255, 228, 220, 0.55)',
    border: '1px solid rgba(255, 157, 141, 0.46)',
    iconBg: 'rgba(255, 228, 220, 0.90)',
    iconBorder: '1px solid rgba(255, 157, 141, 0.48)',
    icon: 'text-[#b4533f]',
    value: 'text-[#7f2d23]',
  },
  slate: {
    bg: 'rgba(253, 223, 130, 0.45)',
    border: '1px solid rgba(23, 18, 15, 0.16)',
    iconBg: 'rgba(253, 223, 130, 0.72)',
    iconBorder: '1px solid rgba(23, 18, 15, 0.16)',
    icon: 'text-[#17120f]',
    value: 'text-[#17120f]',
  },
}

const DASHBOARD_COPY = {
  id: {
    subtitle: 'Dashboard ini fokus ke keputusan harian: sisa ruang belanja, proyeksi akhir bulan, tagihan dekat, dan prioritas AI.',
    savingRate: 'Saving rate',
    cashflowTitle: 'Briefing cashflow',
    cashflowDesc: 'Ringkasan realtime dari transaksi, saldo wallet, dan tagihan terdekat.',
    projectedSpending: 'Proyeksi pengeluaran',
    safeDailySpend: 'Ruang belanja harian',
    noSafeSpend: 'Tahan belanja dulu',
    updatedAt: 'Diperbarui',
    aiPriority: 'Prioritas AI',
    aiPriorityCategory: 'kategori terbesar bulan ini. Cek detailnya sebelum menambah pengeluaran baru.',
    aiPriorityBills: 'Siapkan dana untuk tagihan terdekat.',
    aiPriorityPositive: 'Cashflow aman. Pertahankan ritme, lalu alokasikan surplus ke target atau dana darurat.',
    aiPriorityDeficit: 'Pengeluaran sudah melewati pemasukan bulan ini. Review transaksi terbesar dan tahan belanja non-esensial.',
    aiPriorityStart: 'Mulai dengan mencatat pemasukan, saldo wallet, atau transaksi pertama agar briefing lebih akurat.',
    trendDescription: 'Perbandingan pemasukan dan pengeluaran berdasarkan periode.',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    recentDescription: 'Aktivitas transaksi terbaru dari semua wallet.',
    actionTitle: 'Prioritas hari ini',
    actionDesc: 'Fokus ke keputusan yang paling membantu: kategori terbesar, tagihan terdekat, dan target yang perlu dijaga.',
    categoryTitle: 'Kategori Pengeluaran',
    categoryDesc: 'Ringkasan kategori terbesar bulan ini dari transaksi yang sudah tercatat.',
    emptyInsight: 'Belum ada pengeluaran bulan ini. Insight kategori akan muncul setelah ada transaksi.',
    reviewTransactions: 'Review transaksi',
    budgetActive: 'Budget sudah aktif',
    activeLimit: 'Aktifkan limit',
    trendToday: 'Tren Hari Ini',
    trend7d: 'Tren 7 Hari',
    trend30d: 'Tren 30 Hari',
    trend6mo: 'Tren 6 Bulan',
    tabToday: 'Hari ini',
    tab7d: '7 Hari',
    tab30d: '30 Hari',
    tab6mo: '6 Bulan',
    monthlyInsight: 'Insight Bulan Ini',
    positiveInsight: 'Bagus, pemasukan kamu masih lebih besar dari pengeluaran bulan ini.',
    negativeInsight: 'Pengeluaran bulan ini lebih besar dari pemasukan. Coba cek kategori terbesar.',
    aiInsight: 'AI Insight',
    categoryAbsorbs: 'menyerap',
    categorySpendSuffix: 'dari pengeluaran bulan ini.',
    categoryAdvice: 'Cek transaksi di kategori ini sebelum menambah pengeluaran baru. Kamu juga bisa mengubah insight ini jadi batas harian.',
    perDay: 'hari',
    transactionsCount: 'transaksi',
    upcomingEyebrow: 'Upcoming Billing',
    upcomingTitle: 'Tagihan Berikutnya',
    closestReminder: 'Reminder terdekat',
    dueOn: 'jatuh tempo',
    billsNeedReview: 'tagihan perlu dicek',
    billsSafe: 'Semua tagihan aman',
    todayLower: 'hari ini',
    daysLeft: 'hari lagi',
    emptyBilling: 'Belum ada reminder tagihan. Tambahkan VPS, domain, SaaS, atau langganan lain dari menu Upcoming Billing.',
    walletDesc: 'Saldo dari wallet yang kamu miliki.',
    actionBadge: 'Aksi',
    recurringTitle: 'Tagihan terdekat',
    recurringWithCategory: 'Kategori',
    recurringDesc: 'muncul cukup sering. Pertimbangkan jadwal recurring agar arus kas lebih mudah diprediksi.',
    recurringEmpty: 'Kalau kamu membayar layanan yang sama beberapa bulan berturut-turut, jadikan recurring agar tidak terlewat.',
    setupBilling: 'Atur tagihan',
    nextMonthBills: 'Tagihan bulan depan',
    monthlyBillsEstimate: 'Estimasi tagihan rutin:',
    setAsideEarly: 'Sisihkan lebih awal dari dompet utama.',
    monthlyBillsEmpty: 'Tambahkan tagihan rutin untuk melihat estimasi pengeluaran bulan depan.',
    monitorBilling: 'Pantau billing',
    goalRecommendation: 'Target → Rekomendasi Harian',
    reduceDaily: 'Kalau kurangi jajan',
    youCanAdd: 'kamu bisa menambah tabungan sekitar',
    monthlyAndAdvance: 'dan target berpotensi maju sekitar',
    days: 'hari',
    monthUnit: 'bulan',
    remainingTarget: 'Sisa target',
    viewTarget: 'Lihat target',
    noActiveGoal: 'Belum ada target aktif',
    noActiveGoalDesc: 'Buat target seperti DP rumah, dana darurat, atau liburan. SAKU akan ubah target menjadi rekomendasi harian.',
    createTarget: 'Buat target',
    dailyBudgetCreated: 'Budget harian berhasil dibuat.',
    startTitle: 'Mulai dari 3 langkah cepat',
    startDesc: 'Tambahkan data pertama agar SAKU bisa membaca cashflow dan memberi insight yang lebih relevan.',
    startTransaction: 'Catat transaksi',
    startTransactionDesc: 'Masukkan pemasukan atau pengeluaran pertama untuk membangun ringkasan cashflow.',
    startScan: 'Scan struk',
    startScanDesc: 'Coba OCR untuk mengubah foto struk menjadi transaksi siap review.',
    startAi: 'Tanya AI',
    startAiDesc: 'Gunakan chat untuk bertanya pola pengeluaran atau mencatat transaksi dengan bahasa natural.',
  },
  en: {
    subtitle: 'This dashboard focuses on daily decisions: spending room, month-end projection, upcoming bills, and AI priorities.',
    savingRate: 'Saving rate',
    cashflowTitle: 'Cashflow briefing',
    cashflowDesc: 'Realtime summary from transactions, wallet balance, and upcoming bills.',
    projectedSpending: 'Projected spending',
    safeDailySpend: 'Daily spending room',
    noSafeSpend: 'Pause spending',
    updatedAt: 'Updated',
    aiPriority: 'AI priority',
    aiPriorityCategory: 'is the largest category this month. Review it before adding new spending.',
    aiPriorityBills: 'Set aside money for the closest bill.',
    aiPriorityPositive: 'Cashflow is safe. Keep the rhythm, then move surplus into goals or emergency funds.',
    aiPriorityDeficit: 'Spending is already above income this month. Review the largest transactions and pause non-essential spending.',
    aiPriorityStart: 'Start by recording income, wallet balance, or your first transaction so the briefing gets more accurate.',
    trendDescription: 'Income and spending comparison by selected period.',
    income: 'Income',
    expense: 'Spending',
    recentDescription: 'Latest transaction activity across all wallets.',
    actionTitle: 'Today priority',
    actionDesc: 'Focus on the most helpful decisions: top category, closest bill, and goals to protect.',
    categoryTitle: 'Spending Categories',
    categoryDesc: 'Largest spending categories this month based on recorded transactions.',
    emptyInsight: 'No spending this month yet. Category insights will appear after transactions are recorded.',
    reviewTransactions: 'Review transactions',
    budgetActive: 'Budget already active',
    activeLimit: 'Activate limit',
    trendToday: 'Today Trend',
    trend7d: '7-Day Trend',
    trend30d: '30-Day Trend',
    trend6mo: '6-Month Trend',
    tabToday: 'Today',
    tab7d: '7 Days',
    tab30d: '30 Days',
    tab6mo: '6 Months',
    monthlyInsight: 'This Month Insight',
    positiveInsight: 'Nice, your income is still higher than spending this month.',
    negativeInsight: 'Spending is higher than income this month. Review the largest category.',
    aiInsight: 'AI Insight',
    categoryAbsorbs: 'takes',
    categorySpendSuffix: 'of this month spending.',
    categoryAdvice: 'Review transactions in this category before adding new spending. You can also turn this insight into a daily limit.',
    perDay: 'day',
    transactionsCount: 'transactions',
    upcomingEyebrow: 'Upcoming Billing',
    upcomingTitle: 'Next Bills',
    closestReminder: 'Closest reminder',
    dueOn: 'due on',
    billsNeedReview: 'bills need review',
    billsSafe: 'All bills are on track',
    todayLower: 'today',
    daysLeft: 'days left',
    emptyBilling: 'No bill reminders yet. Add VPS, domain, SaaS, or other subscriptions from Upcoming Billing.',
    walletDesc: 'Balance from wallets you own.',
    actionBadge: 'Action',
    recurringTitle: 'Closest bill',
    recurringWithCategory: 'Category',
    recurringDesc: 'appears often enough. Consider a recurring schedule so cashflow is easier to predict.',
    recurringEmpty: 'If you pay the same service for multiple months, make it recurring so it is not missed.',
    setupBilling: 'Set billing',
    nextMonthBills: 'Next month bills',
    monthlyBillsEstimate: 'Estimated recurring bills:',
    setAsideEarly: 'Set aside funds earlier from your main wallet.',
    monthlyBillsEmpty: 'Add recurring bills to see next month spending estimates.',
    monitorBilling: 'Monitor billing',
    goalRecommendation: 'Goal → Daily Recommendation',
    reduceDaily: 'If you reduce discretionary spending by',
    youCanAdd: 'per day, you can add around',
    monthlyAndAdvance: 'and potentially move the goal forward by',
    days: 'days',
    monthUnit: 'month',
    remainingTarget: 'Remaining target',
    viewTarget: 'View target',
    noActiveGoal: 'No active goal yet',
    noActiveGoalDesc: 'Create goals such as a home down payment, emergency fund, or vacation. SAKU will turn them into daily recommendations.',
    createTarget: 'Create target',
    dailyBudgetCreated: 'Daily budget created.',
    startTitle: 'Start with 3 quick steps',
    startDesc: 'Add your first data so SAKU can read cashflow and provide more relevant insights.',
    startTransaction: 'Record transaction',
    startTransactionDesc: 'Add your first income or expense to build a cashflow summary.',
    startScan: 'Scan receipt',
    startScanDesc: 'Try OCR to turn a receipt photo into a review-ready transaction.',
    startAi: 'Ask AI',
    startAiDesc: 'Use chat to ask about spending patterns or record transactions naturally.',
  },
} as const

type DashboardCopy = {
  [K in keyof typeof DASHBOARD_COPY.id]: string
}

export function DashboardPage() {
  const t = useT()
  const { locale } = useLocale()
  const copy = DASHBOARD_COPY[locale]
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [trendRange, setTrendRange] = useState<TrendRange>('7d')
  const [now, setNow] = useState(() => new Date())
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

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
    staleTime: 45 * 1000,
    refetchInterval: 60 * 1000,
  })

  const recentTxns = useQuery({
    queryKey: ['transactions', { limit: 6 }],
    queryFn: () => transactionApi.list({ limit: 6, page: 1 }),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  const monthTxns = useQuery({
    queryKey: ['transactions', 'month'],
    queryFn: () =>
      transactionApi.list({
        from: monthStart.toISOString(),
        to: now.toISOString(),
        limit: 1000,
      }),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  const longRangeTxns = useQuery({
    queryKey: ['transactions', '6mo', isMobile ? 'mobile' : 'desktop'],
    queryFn: () =>
      transactionApi.list({
        from: sixMonthStart.toISOString(),
        to: now.toISOString(),
        limit: isMobile ? 360 : 1200,
      }),
    staleTime: 60 * 1000,
  })

  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const activeSubscription = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
    staleTime: 60 * 1000,
  })

  const upcomingBillings = useQuery({
    queryKey: ['upcoming-billings'],
    queryFn: upcomingBillingApi.list,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  const budgets = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetApi.list,
    staleTime: 60 * 1000,
  })

  const goals = useQuery({
    queryKey: ['savings-goals'],
    queryFn: savingsGoalApi.list,
    staleTime: 60 * 1000,
  })

  const createBudget = useMutation({
    mutationFn: budgetApi.create,
    onSuccess: (_budget, payload) => {
      trackEvent(analyticsEvents.budgetCreated, {
        feature_name: 'budget',
        amount: payload.limit_amount,
      })
      toast.success(copy.dailyBudgetCreated)
      qc.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
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
  const dashboardGoals = useMemo(
    () => buildDashboardGoals(goals.data ?? [], wallets.data ?? [], now),
    [goals.data, wallets.data, now],
  )

  const cashflowBriefing = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = Math.max(1, now.getDate())
    const remainingDays = Math.max(1, daysInMonth - dayOfMonth + 1)
    const projectedExpense = dayOfMonth > 0 ? (monthSummary.expense / dayOfMonth) * daysInMonth : monthSummary.expense
    const activeBills = (upcomingBillings.data ?? []).filter((bill) => bill.status !== 'paused')
    const unpaidBills = activeBills
      .reduce((sum, bill) => sum + Number(bill.amount ?? 0), 0)
    const availableCashflow = monthSummary.income > 0
      ? monthSummary.income - monthSummary.expense
      : totalBalance - monthSummary.expense
    const rawDailyRoom = (availableCashflow - unpaidBills) / remainingDays
    const dailyRoom = Math.max(0, rawDailyRoom)
    const topCategory = categoryInsights[0]
    const nextBill = [...activeBills]
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
    const hasAnySignal = totalBalance > 0 || monthSummary.income > 0 || monthSummary.expense > 0 || activeBills.length > 0
    const deficit = Math.abs(monthSummary.saved)
    const priority =
      !hasAnySignal
        ? copy.aiPriorityStart
        : monthSummary.income > 0 && monthSummary.saved < 0
          ? `${copy.aiPriorityDeficit} ${locale === 'id' ? 'Gap bulan ini' : 'Current gap'}: ${formatCurrency(deficit)}${topCategory ? ` · ${topCategory.name} ${locale === 'id' ? 'paling besar' : 'is the largest'}.` : '.'}`
          : nextBill
            ? `${copy.aiPriorityBills} ${nextBill.name}: ${formatCurrency(Number(nextBill.amount ?? 0), nextBill.currency || 'IDR')} (${formatDate(nextBill.due_date)}).`
            : topCategory && topCategory.amount > 0 && monthSummary.expense > 0
              ? `${topCategory.name} ${copy.aiPriorityCategory} (${formatCurrency(topCategory.amount)}).`
              : copy.aiPriorityPositive

    return {
      projectedExpense,
      dailyRoom,
      dailyRoomLabel: rawDailyRoom <= 0 ? copy.noSafeSpend : formatCurrency(dailyRoom),
      priority,
      updatedAtLabel: now.toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }, [categoryInsights, copy, locale, monthSummary.expense, monthSummary.income, monthSummary.saved, now, totalBalance, upcomingBillings.data])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.common.welcome}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle={copy.subtitle}
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          loading={wallets.isLoading}
          label={t.dashboard.totalBalance}
          value={formatCurrency(totalBalance)}
          Icon={HiOutlineBanknotes}
          tone="brand"
        />

        <StatCard
          loading={monthTxns.isLoading}
          label={copy.savingRate}
          value={`${monthSummary.savingRate.toFixed(0)}%`}
          Icon={HiOutlineLightBulb}
          tone={monthSummary.savingRate >= 20 ? 'emerald' : 'slate'}
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

      <CashflowBriefing
        loading={monthTxns.isLoading || upcomingBillings.isLoading}
        projectedExpense={cashflowBriefing.projectedExpense}
        dailyRoomLabel={cashflowBriefing.dailyRoomLabel}
        priority={cashflowBriefing.priority}
        updatedAtLabel={cashflowBriefing.updatedAtLabel}
        copy={copy}
      />

      <section className="grid gap-6 xl:grid-cols-3">
        <AiCategoryInsight
          loading={monthTxns.isLoading || categories.isLoading}
          insights={categoryInsights}
          expense={monthSummary.expense}
          budgets={budgets.data ?? []}
          walletId={(wallets.data ?? []).find((wallet) => wallet.is_default)?.id ?? wallets.data?.[0]?.id ?? ''}
          onCreateDailyBudget={(categoryId, limitAmount) =>
            createBudget.mutate({
              wallet_id: (wallets.data ?? []).find((wallet) => wallet.is_default)?.id ?? wallets.data?.[0]?.id ?? '',
              category_id: categoryId,
              limit_amount: limitAmount,
              period: 'daily',
            })
          }
          creatingBudget={createBudget.isPending}
          copy={copy}
        />

        <UpcomingBillingCard
          loading={activeSubscription.isLoading || upcomingBillings.isLoading}
          subscription={activeSubscription.data ?? null}
          billings={upcomingBillings.data ?? []}
          copy={copy}
        />
      </section>

      <FinancialActionEngine
        loading={monthTxns.isLoading || upcomingBillings.isLoading || goals.isLoading}
        insights={categoryInsights}
        expense={monthSummary.expense}
        billings={upcomingBillings.data ?? []}
        goals={dashboardGoals}
        copy={copy}
      />

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                {getTrendTitle(trendRange, copy)}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {copy.trendDescription}
              </p>
            </div>

            <RangeTabs value={trendRange} onChange={setTrendRange} copy={copy} />
          </div>

          {longRangeTxns.isLoading ? (
            <Shimmer className="h-72 w-full rounded-2xl" />
          ) : isMobile ? (
            <MobileTrendSummary data={trendData} copy={copy} />
          ) : (
            <Suspense fallback={<Shimmer className="h-72 w-full rounded-2xl" />}>
              <DashboardTrendChart
                data={trendData}
                trendRange={trendRange}
                incomeLabel={copy.income}
                expenseLabel={copy.expense}
              />
            </Suspense>
          )}
        </Card>

        <MonthlyInsight
          income={monthSummary.income}
          expense={monthSummary.expense}
          saved={monthSummary.saved}
          savingRate={monthSummary.savingRate}
          loading={monthTxns.isLoading}
          copy={copy}
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
                {copy.recentDescription}
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
                            ? 'border border-emerald-100 bg-[#ecfdf5] text-emerald-700'
                            : 'border border-brand-100 bg-[#ffe4dc] text-[#b4533f]',
                        )}
                        style={{
                          background: tx.type === 'income' ? 'rgba(209, 250, 229, 0.60)' : 'rgba(255, 228, 220, 0.72)',
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
                        tx.type === 'income' ? 'text-emerald-700' : 'text-[#b4533f]',
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
          description={copy.walletDesc}
        />
      </section>
    </div>
  )
}

function CashflowBriefing({
  loading,
  projectedExpense,
  dailyRoomLabel,
  priority,
  updatedAtLabel,
  copy,
}: {
  loading?: boolean
  projectedExpense: number
  dailyRoomLabel: string
  priority: string
  updatedAtLabel: string
  copy: DashboardCopy
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#17120f]/14 bg-[#fffaf6]/92 shadow-[0_18px_45px_rgba(23,18,15,0.08)]">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex min-w-0 flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#17120f]/14 bg-brand-200 text-[#17120f] shadow-sm shadow-[#17120f]/8">
              <HiOutlineSparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-[#17120f]">{copy.cashflowTitle}</h2>
              <p className="mt-0.5 text-xs text-[#4f4540]">{copy.cashflowDesc}</p>
            </div>
          </div>
          <p className="mt-4 inline-flex w-fit rounded-full border border-[#17120f]/14 bg-[#fddf82]/75 px-3 py-1 text-[11px] font-black text-[#17120f]">
            {copy.updatedAt} {updatedAtLabel}
          </p>
        </div>
        <div className="grid gap-3 lg:w-[68%] lg:grid-cols-3">
          <BriefingItem label={copy.projectedSpending} value={formatCurrency(projectedExpense)} loading={loading} tone="rose" />
          <BriefingItem label={copy.safeDailySpend} value={dailyRoomLabel} loading={loading} tone="emerald" />
          <BriefingItem label={copy.aiPriority} value={priority} loading={loading} tone="blue" compact />
        </div>
      </div>
    </section>
  )
}

function BriefingItem({
  label,
  value,
  loading,
  tone,
  compact,
}: {
  label: string
  value: string
  loading?: boolean
  tone: 'blue' | 'emerald' | 'rose'
  compact?: boolean
}) {
  const toneClass = {
    blue: 'bg-[#ffe4dc]/70 text-[#17120f] border-brand-200',
    emerald: 'bg-[#ecfdf5]/80 text-[#134e4a] border-emerald-100',
    rose: 'bg-[#ffe4dc]/80 text-[#7f2d23] border-brand-100',
  }[tone]
  return (
    <div className={`rounded-2xl border p-4 shadow-sm shadow-[#17120f]/5 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-wide opacity-70">{label}</p>
      {loading ? (
        <Shimmer className="mt-3 h-6 w-28 rounded-xl bg-white/60" />
      ) : (
        <p className={`${compact ? 'mt-2 line-clamp-2 text-sm leading-5' : 'mt-2 text-xl'} font-black`}>
          {value}
        </p>
      )}
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
      className="group relative overflow-hidden rounded-2xl p-4 sm:p-6 sm:transition-transform sm:duration-200 sm:hover:-translate-y-0.5"
      style={{
        background: color.bg,
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: color.border,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.80)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-sm:hidden">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      </div>

      <div className="relative flex items-center justify-between gap-3 sm:gap-4">
        <p className="min-w-0 text-xs font-semibold text-slate-600 sm:text-sm">{label}</p>

        <div
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-2xl', color.icon)}
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
        <p className={cn('relative mt-4 break-words text-xl font-extrabold tracking-tight sm:text-3xl', color.value)}>
          {value}
        </p>
      )}
    </div>
  )
}

function MobileTrendSummary({ data, copy }: { data: ReturnType<typeof buildTrendData>; copy: DashboardCopy }) {
  const income = data.reduce((sum, item) => sum + item.income, 0)
  const expense = data.reduce((sum, item) => sum + item.expense, 0)
  const maxValue = Math.max(1, income, expense)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-100 bg-[#ecfdf5]/80 p-4">
          <p className="text-xs font-bold text-emerald-700">{copy.income}</p>
          <p className="mt-2 text-lg font-extrabold text-[#134e4a]">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-[#ffe4dc]/80 p-4">
          <p className="text-xs font-bold text-[#b4533f]">{copy.expense}</p>
          <p className="mt-2 text-lg font-extrabold text-[#7f2d23]">{formatCurrency(expense)}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="space-y-3">
          {data.slice(-6).map((item) => (
            <div key={item.label} className="grid grid-cols-[54px_1fr] items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-400">{item.label}</span>
              <div className="space-y-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-[#ecfdf5]">
                  <div className="h-full rounded-full bg-[#7ddfc0]" style={{ width: `${Math.max(4, (item.income / maxValue) * 100)}%` }} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#ffe4dc]">
                  <div className="h-full rounded-full bg-[#ff9d8d]" style={{ width: `${Math.max(4, (item.expense / maxValue) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MonthlyInsight({
  income,
  expense,
  saved,
  savingRate,
  loading,
  copy,
}: {
  income: number
  expense: number
  saved: number
  savingRate: number
  loading?: boolean
  copy: DashboardCopy
}) {
  const isPositive = saved >= 0

  return (
    <div
      className="rounded-2xl p-6 text-[#17120f] transition-all duration-300"
      style={{
        background: 'rgba(255, 250, 246, 0.92)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid rgba(23, 18, 15, 0.14)',
        boxShadow: '0 18px 45px rgba(23, 18, 15, 0.08)',
      }}
    >
      <p className="text-xs font-black uppercase tracking-wide text-brand-700">
        {copy.monthlyInsight}
      </p>

      {loading ? (
        <div className="mt-5 space-y-3">
          <Shimmer className="h-8 w-40 bg-brand-100" />
          <Shimmer className="h-4 w-full bg-brand-50" />
          <Shimmer className="h-4 w-2/3 bg-brand-50" />
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-[#17120f]">
            {formatCurrency(saved)}
          </h3>

          <p className="mt-3 text-sm leading-6 text-[#4f4540]">
            {isPositive
              ? copy.positiveInsight
              : copy.negativeInsight}
          </p>

          <div className="mt-6 space-y-3">
            <InsightRow label={copy.income} value={formatCurrency(income)} />
            <InsightRow label={copy.expense} value={formatCurrency(expense)} />
            <InsightRow label={copy.savingRate} value={`${savingRate.toFixed(0)}%`} />
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#17120f]/8">
            <div
              className={cn('h-full rounded-full', isPositive ? 'bg-[#7ddfc0]' : 'bg-[#ff9d8d]')}
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
      <span className="text-[#4f4540]/70">{label}</span>
      <span className="font-semibold text-[#17120f]">{value}</span>
    </div>
  )
}

function FinancialActionEngine({
  loading,
  insights,
  expense,
  billings,
  goals,
  copy,
}: {
  loading?: boolean
  insights: CategoryInsight[]
  expense: number
  billings: UpcomingBilling[]
  goals: DashboardGoal[]
  copy: DashboardCopy
}) {
  const top = insights[0]
  const topPct = top && expense > 0 ? Math.round((top.amount / expense) * 100) : 0
  const activeBills = billings
    .filter((item) => item.status === 'active')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const nextBill = activeBills[0]
  const monthlyBills = activeBills.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const activeGoal = goals
    .filter((goal) => Number(goal.remaining ?? 0) > 0)
    .sort((a, b) => Number(a.days_left ?? 9999) - Number(b.days_left ?? 9999))[0]
  const dailyCut = 20_000
  const monthlyExtra = dailyCut * 30
  const daysAdvanced = activeGoal ? Math.max(7, Math.round(monthlyExtra / Math.max(1, Number(activeGoal.remaining)) * Number(activeGoal.days_left ?? 180))) : 0

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-700">
              AI Focus
            </p>
            <h2 className="mt-1 text-base font-black text-[#17120f]">
              {copy.actionTitle}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#4f4540]">
              {copy.actionDesc}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#17120f]/14 bg-brand-200 text-[#17120f] shadow-sm shadow-[#17120f]/8">
            <HiOutlineSparkles className="h-5 w-5" />
          </div>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Shimmer key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <ActionCard
              tone="blue"
              title={top ? `${top.name} ${copy.categoryAbsorbs} ${topPct}%` : copy.activeLimit}
              description={
                top
                  ? `${copy.categoryAdvice}`
                  : copy.emptyInsight
              }
              actionLabel={top ? copy.reviewTransactions : copy.activeLimit}
              to="/app/transactions"
              copy={copy}
            />
            <ActionCard
              tone="yellow"
              title={nextBill ? nextBill.name : copy.recurringTitle}
              description={
                nextBill
                  ? `${formatCurrency(Number(nextBill.amount || 0))} ${copy.dueOn} ${formatDate(nextBill.due_date)}. ${copy.setAsideEarly}`
                  : copy.monthlyBillsEmpty
              }
              actionLabel={copy.setupBilling}
              to="/app/upcoming-billings"
              copy={copy}
            />
            <ActionCard
              tone="emerald"
              title={copy.nextMonthBills}
              description={
                monthlyBills > 0
                  ? `${copy.monthlyBillsEstimate} ${formatCurrency(monthlyBills)}. ${copy.setAsideEarly}`
                  : copy.monthlyBillsEmpty
              }
              actionLabel={copy.monitorBilling}
              to="/app/upcoming-billings"
              copy={copy}
            />
          </div>
        )}
      </Card>

      <Card className="border-brand-100/80 bg-[#fffaf6]/88">
        <p className="text-xs font-black uppercase tracking-wide text-brand-700">
          {copy.goalRecommendation}
        </p>
        {loading ? (
          <div className="mt-5 space-y-3">
            <Shimmer className="h-8 w-36 rounded-xl" />
            <Shimmer className="h-20 rounded-2xl" />
          </div>
        ) : activeGoal ? (
          <>
            <h2 className="mt-2 text-base font-black text-[#17120f]">{activeGoal.name}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#4f4540]">
              {copy.reduceDaily} {formatCurrency(dailyCut)}/{copy.perDay}, {copy.youCanAdd} {formatCurrency(monthlyExtra)}/{copy.monthUnit} {copy.monthlyAndAdvance} {daysAdvanced} {copy.days}.
            </p>
            <div className="mt-4 rounded-2xl border border-[#17120f]/10 bg-[#fddf82]/42 p-3">
              <p className="text-xs font-black text-[#6f5a16]">{copy.remainingTarget}</p>
              <p className="mt-1 text-xl font-black text-[#17120f]">
                {formatCurrency(Number(activeGoal.remaining ?? 0))}
              </p>
            </div>
            <Link
              to="/app/targets"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#17120f]/14 bg-brand-500 px-4 py-2 text-sm font-black text-[#17120f] shadow-sm shadow-brand-200/60 transition hover:-translate-y-0.5 hover:bg-brand-300"
            >
              {copy.viewTarget}
            </Link>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-base font-black text-[#17120f]">{copy.noActiveGoal}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#4f4540]">
              {copy.noActiveGoalDesc}
            </p>
            <Link
              to="/app/targets"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#17120f]/14 bg-brand-500 px-4 py-2 text-sm font-black text-[#17120f] shadow-sm shadow-brand-200/60 transition hover:-translate-y-0.5 hover:bg-brand-300"
            >
              {copy.createTarget}
            </Link>
          </>
        )}
      </Card>
    </section>
  )
}

function ActionCard({
  title,
  description,
  actionLabel,
  to,
  tone,
  copy,
}: {
  title: string
  description: string
  actionLabel: string
  to: string
  tone: 'blue' | 'yellow' | 'emerald'
  copy: DashboardCopy
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
      : tone === 'yellow'
        ? 'border-[#17120f]/14 bg-[#fddf82]/75 text-[#17120f]'
        : 'border-brand-200 bg-brand-100 text-[#17120f]'

  return (
    <div className="rounded-2xl border border-[#17120f]/14 bg-[#fffaf6] p-4 shadow-sm shadow-[#17120f]/6">
      <div className={cn('mb-3 inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', toneClass)}>
        {copy.actionBadge}
      </div>
      <h3 className="text-sm font-black text-[#17120f]">{title}</h3>
      <p className="mt-2 min-h-16 text-xs leading-5 text-[#4f4540]">{description}</p>
      <Link
        to={to}
        className="mt-3 inline-flex items-center gap-1 text-xs font-black text-brand-700 hover:underline"
      >
        {actionLabel}
        <HiOutlineArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function AiCategoryInsight({
  loading,
  insights,
  expense,
  budgets,
  walletId,
  onCreateDailyBudget,
  creatingBudget,
  copy,
}: {
  loading?: boolean
  insights: CategoryInsight[]
  expense: number
  budgets: Budget[]
  walletId: string
  onCreateDailyBudget: (categoryId: string, limitAmount: number) => void
  creatingBudget?: boolean
  copy: DashboardCopy
}) {
  const top = insights[0]
  const topPct = top && expense > 0 ? Math.round((top.amount / expense) * 100) : 0
  const hasDailyBudget = top ? budgets.some((budget) => budget.category_id === top.id && budget.period === 'daily') : false
  const suggestedDailyLimit = top ? Math.max(50_000, Math.ceil((top.amount / 30) / 10_000) * 10_000) : 50_000

  return (
    <Card className="xl:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-brand-700">
            {copy.aiInsight}
          </p>
          <h2 className="mt-1 text-base font-black text-[#17120f]">
            {copy.categoryTitle}
          </h2>
          <p className="mt-1 text-xs text-[#4f4540]">
            {copy.categoryDesc}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#17120f]/14 bg-[#fddf82]/75 text-[#17120f] shadow-sm shadow-[#17120f]/8">
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
          {copy.emptyInsight}
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 shadow-sm shadow-[#17120f]/6">
            <p className="text-sm font-black text-[#17120f]">
              {top.name} {copy.categoryAbsorbs} {topPct}% {copy.categorySpendSuffix}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#4f4540]">
              {copy.categoryAdvice}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={!walletId || hasDailyBudget}
                loading={creatingBudget}
                onClick={() => top && onCreateDailyBudget(top.id, suggestedDailyLimit)}
              >
                {hasDailyBudget ? copy.budgetActive : `${copy.activeLimit} ${formatCurrency(suggestedDailyLimit)}/${copy.perDay}`}
              </Button>
              <Link
                to="/app/transactions"
                className="inline-flex rounded-xl border border-[#17120f]/14 bg-white px-3 py-1.5 text-xs font-black text-[#17120f] shadow-sm shadow-[#17120f]/5 transition hover:-translate-y-0.5 hover:bg-[#fddf82]/70"
              >
                {copy.reviewTransactions}
              </Link>
            </div>
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
                <p className="mt-1 text-xs text-slate-500">{item.count} {copy.transactionsCount}</p>
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
  copy,
}: {
  loading?: boolean
  subscription: Subscription | null
  billings: UpcomingBilling[]
  copy: DashboardCopy
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
          <p className="text-xs font-black uppercase tracking-wide text-brand-700">
            {copy.upcomingEyebrow}
          </p>
          <h2 className="mt-1 text-base font-black text-[#17120f]">
            {copy.upcomingTitle}
          </h2>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#17120f]/14 bg-[#fddf82]/75 text-[#17120f] shadow-sm shadow-[#17120f]/8">
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
          <div className="rounded-2xl border-2 border-[#17120f] bg-[#fddf82]/70 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[#17120f]">
              {copy.closestReminder}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-950">
              {rows[0].name}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#4f4540]">
              {formatCurrency(rows[0].amount, rows[0].currency)} {copy.dueOn} {formatDate(rows[0].dueDate)}
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
            {urgentCount > 0 ? `${urgentCount} ${copy.billsNeedReview}` : copy.billsSafe}
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
                    {row.provider} · {row.daysLeft <= 0 ? copy.todayLower : `${row.daysLeft} ${copy.daysLeft}`}
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
          {copy.emptyBilling}
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
  description,
}: {
  loading?: boolean
  wallets: { id: string; name: string; balance?: number | string | null; currency?: string }[]
  title: string
  seeAllLabel: string
  emptyLabel: string
  description: string
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
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
  copy,
}: {
  value: TrendRange
  onChange: (value: TrendRange) => void
  copy: DashboardCopy
}) {
  const options: { value: TrendRange; label: string }[] = [
    { value: 'today', label: copy.tabToday },
    { value: '7d', label: copy.tab7d },
    { value: '30d', label: copy.tab30d },
    { value: '6mo', label: copy.tab6mo },
  ]

  return (
    <div className="inline-flex rounded-xl border border-[#17120f]/14 bg-[#fffaf6] p-1 text-xs font-black shadow-sm shadow-[#17120f]/6">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 transition',
            value === option.value
              ? 'bg-brand-500 text-[#17120f]'
              : 'text-[#4f4540] hover:bg-[#fddf82] hover:text-[#17120f]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function getTrendTitle(range: TrendRange, copy: DashboardCopy): string {
  if (range === 'today') return copy.trendToday
  if (range === '7d') return copy.trend7d
  if (range === '30d') return copy.trend30d
  return copy.trend6mo
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

function buildDashboardGoals(goals: SavingsGoal[], wallets: Wallet[], now: Date): DashboardGoal[] {
  const savedGoalWalletIds = new Set(goals.map((goal) => goal.wallet_id).filter(Boolean))
  const walletGoals = wallets
    .filter((wallet) => Number(wallet.target_amount ?? 0) > 0 && !savedGoalWalletIds.has(wallet.id))
    .map((wallet) => {
      const targetAmount = Number(wallet.target_amount ?? 0)
      const currentAmount = Number(wallet.balance ?? 0)
      const deadline = wallet.target_deadline ? new Date(wallet.target_deadline) : null
      const daysLeft = deadline && Number.isFinite(deadline.getTime())
        ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000))
        : null

      return {
        id: `wallet-${wallet.id}`,
        name: wallet.target_name || wallet.name,
        target_amount: targetAmount,
        current_amount: currentAmount,
        remaining: Math.max(0, targetAmount - currentAmount),
        days_left: daysLeft,
      }
    })

  return [
    ...goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      target_amount: Number(goal.target_amount ?? 0),
      current_amount: Number(goal.current_amount ?? 0),
      remaining: Number(goal.remaining ?? 0),
      days_left: goal.days_left,
    })),
    ...walletGoals,
  ]
}

export default DashboardPage
