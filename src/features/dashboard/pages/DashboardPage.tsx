import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { walletApi } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import { categoryApi } from '@/features/categories/api'
import { subscriptionApi, type Subscription } from '@/features/subscription/api'
import { upcomingBillingApi, type UpcomingBilling } from '@/features/billing/api'
import { Card, PageHeader, Shimmer, EmptyState, Button } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Category, Transaction } from '@/types/api'

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
    subtitle: 'Lihat kondisi keuangan hari ini, keputusan terpenting, dan aktivitas terbaru.',
    savingRate: 'Saving rate',
    cashflowTitle: 'Briefing cashflow',
    cashflowDesc: 'Ringkasan realtime dari transaksi, saldo wallet, dan tagihan terdekat.',
    projectedSpending: 'Proyeksi pengeluaran',
    safeDailySpend: 'Budget fleksibel harian',
    noSafeSpend: 'Belum ada ruang aman',
    categoryProjection: 'Proyeksi per kategori',
    categoryProjectionHelper: 'Perkiraan komposisi pengeluaran sampai akhir bulan.',
    categoryProjectionEmpty: 'Belum ada pengeluaran berkategori.',
    otherCategories: 'Kategori lainnya',
    updatedAt: 'Diperbarui',
    aiPriority: 'Prioritas AI',
    aiPriorityCategory: 'kategori terbesar bulan ini. Cek detailnya sebelum menambah pengeluaran baru.',
    aiPriorityBills: 'Siapkan dana untuk tagihan terdekat.',
    aiPriorityPositive: 'Cashflow aman. Pertahankan ritme, lalu alokasikan surplus ke target atau dana darurat.',
    aiPriorityDeficit: 'Pengeluaran sudah melewati pemasukan bulan ini. Review transaksi terbesar dan tahan belanja non-esensial.',
    aiPriorityStart: 'Mulai dengan mencatat pemasukan, saldo wallet, atau transaksi pertama agar briefing lebih akurat.',
    projectedHelper: 'Estimasi hingga akhir bulan dari ritme pengeluaran saat ini.',
    dailyRoomHelper: 'Batas pengeluaran non-esensial per hari setelah menyisihkan tagihan.',
    reviewNow: 'Review sekarang',
    manageBills: 'Atur tagihan',
    recordTransaction: 'Catat transaksi',
    protectGoal: 'Lihat target',
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
    subtitle: 'See today’s financial position, your most important decision, and recent activity.',
    savingRate: 'Saving rate',
    cashflowTitle: 'Cashflow briefing',
    cashflowDesc: 'Realtime summary from transactions, wallet balance, and upcoming bills.',
    projectedSpending: 'Projected spending',
    safeDailySpend: 'Daily flexible budget',
    noSafeSpend: 'No safe room yet',
    categoryProjection: 'Category projection',
    categoryProjectionHelper: 'Estimated spending composition through month-end.',
    categoryProjectionEmpty: 'No categorized spending yet.',
    otherCategories: 'Other categories',
    updatedAt: 'Updated',
    aiPriority: 'AI priority',
    aiPriorityCategory: 'is the largest category this month. Review it before adding new spending.',
    aiPriorityBills: 'Set aside money for the closest bill.',
    aiPriorityPositive: 'Cashflow is safe. Keep the rhythm, then move surplus into goals or emergency funds.',
    aiPriorityDeficit: 'Spending is already above income this month. Review the largest transactions and pause non-essential spending.',
    aiPriorityStart: 'Start by recording income, wallet balance, or your first transaction so the briefing gets more accurate.',
    projectedHelper: 'Estimated month-end spending from your current pace.',
    dailyRoomHelper: 'Daily non-essential spending limit after setting bills aside.',
    reviewNow: 'Review now',
    manageBills: 'Manage bills',
    recordTransaction: 'Record transaction',
    protectGoal: 'View goals',
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
      : totalBalance
    const rawDailyRoom = (availableCashflow - unpaidBills) / remainingDays
    const dailyRoom = Math.max(0, rawDailyRoom)
    const dailyRoomHelper = rawDailyRoom > 0
      ? copy.dailyRoomHelper
      : monthSummary.income > 0 && monthSummary.saved < 0
        ? locale === 'id'
          ? `Belum aman karena pengeluaran melampaui pemasukan sebesar ${formatCurrency(Math.abs(monthSummary.saved))}.`
          : `Not safe yet because spending exceeds income by ${formatCurrency(Math.abs(monthSummary.saved))}.`
        : unpaidBills > availableCashflow
          ? locale === 'id'
            ? `Dana tersedia belum menutup ${formatCurrency(unpaidBills)} tagihan aktif.`
            : `Available funds do not yet cover ${formatCurrency(unpaidBills)} in active bills.`
          : locale === 'id'
            ? 'Catat pemasukan agar batas harian dapat dihitung lebih akurat.'
            : 'Record income so the daily limit can be calculated more accurately.'
    const topCategory = categoryInsights[0]
    const nextBill = [...activeBills]
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
    const hasAnySignal = totalBalance > 0 || monthSummary.income > 0 || monthSummary.expense > 0 || activeBills.length > 0
    const deficit = Math.abs(monthSummary.saved)
    let priorityTitle: string = locale === 'id' ? 'Cashflow masih aman' : 'Cashflow is on track'
    let priorityDescription: string = copy.aiPriorityPositive
    let priorityActionLabel: string = copy.protectGoal
    let priorityActionTo: string = '/app/targets'
    if (!hasAnySignal) {
      priorityTitle = locale === 'id' ? 'Bangun data pertama' : 'Build your first data'
      priorityDescription = copy.aiPriorityStart
      priorityActionLabel = copy.recordTransaction
      priorityActionTo = '/app/transactions/add'
    } else if (monthSummary.income > 0 && monthSummary.saved < 0) {
      priorityTitle = locale === 'id'
        ? `Kurangi gap ${formatCurrency(deficit)}`
        : `Reduce the ${formatCurrency(deficit)} gap`
      priorityDescription = `${copy.aiPriorityDeficit}${topCategory ? ` ${topCategory.name} ${locale === 'id' ? `menyerap ${formatCurrency(topCategory.amount)}` : `accounts for ${formatCurrency(topCategory.amount)}`}.` : ''}`
      priorityActionLabel = copy.reviewNow
      priorityActionTo = '/app/transactions'
    } else if (nextBill) {
      priorityTitle = locale === 'id' ? `Siapkan ${nextBill.name}` : `Prepare for ${nextBill.name}`
      priorityDescription = `${copy.aiPriorityBills} ${formatCurrency(Number(nextBill.amount ?? 0), nextBill.currency || 'IDR')} ${locale === 'id' ? 'jatuh tempo' : 'is due'} ${formatDate(nextBill.due_date)}.`
      priorityActionLabel = copy.manageBills
      priorityActionTo = '/app/upcoming-billings'
    } else if (topCategory && topCategory.amount > 0 && monthSummary.expense > 0) {
      priorityTitle = `${topCategory.name} · ${Math.round((topCategory.amount / monthSummary.expense) * 100)}%`
      priorityDescription = `${topCategory.name} ${copy.aiPriorityCategory} (${formatCurrency(topCategory.amount)}).`
      priorityActionLabel = copy.reviewNow
      priorityActionTo = '/app/transactions'
    }

    return {
      projectedExpense,
      dailyRoom,
      dailyRoomLabel: rawDailyRoom <= 0 ? copy.noSafeSpend : formatCurrency(dailyRoom),
      dailyRoomHelper,
      priorityTitle,
      priorityDescription,
      priorityActionLabel,
      priorityActionTo,
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

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          loading={wallets.isLoading}
          label={t.dashboard.totalBalance}
          value={formatCurrency(totalBalance)}
          Icon={HiOutlineBanknotes}
          tone="brand"
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
        dailyRoomHelper={cashflowBriefing.dailyRoomHelper}
        categoryInsights={categoryInsights}
        priorityTitle={cashflowBriefing.priorityTitle}
        priorityDescription={cashflowBriefing.priorityDescription}
        priorityActionLabel={cashflowBriefing.priorityActionLabel}
        priorityActionTo={cashflowBriefing.priorityActionTo}
        updatedAtLabel={cashflowBriefing.updatedAtLabel}
        copy={copy}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <Card>
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

        <UpcomingBillingCard
          loading={activeSubscription.isLoading || upcomingBillings.isLoading}
          subscription={activeSubscription.data ?? null}
          billings={upcomingBillings.data ?? []}
          copy={copy}
        />
      </section>

      <section>
        <Card>
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
                {Array.from({ length: 4 }).map((_, index) => (
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
                {recentTxns.data!.data.slice(0, 5).map((tx) => (
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
      </section>
    </div>
  )
}

function CashflowBriefing({
  loading,
  projectedExpense,
  dailyRoomLabel,
  dailyRoomHelper,
  categoryInsights,
  priorityTitle,
  priorityDescription,
  priorityActionLabel,
  priorityActionTo,
  updatedAtLabel,
  copy,
}: {
  loading?: boolean
  projectedExpense: number
  dailyRoomLabel: string
  dailyRoomHelper: string
  categoryInsights: CategoryInsight[]
  priorityTitle: string
  priorityDescription: string
  priorityActionLabel: string
  priorityActionTo: string
  updatedAtLabel: string
  copy: DashboardCopy
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#17120f]/14 bg-[#fffaf6]/92 shadow-[0_18px_45px_rgba(23,18,15,0.08)]">
      <div className="border-b border-[#17120f]/10 bg-brand-100/45 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_1.4fr]">
        <BriefingItem label={copy.projectedSpending} value={formatCurrency(projectedExpense)} helper={copy.projectedHelper} loading={loading} tone="rose" />
        <BriefingItem label={copy.safeDailySpend} value={dailyRoomLabel} helper={dailyRoomHelper} loading={loading} tone="emerald" />
        <div className="flex min-h-[170px] flex-col rounded-2xl border border-brand-200 bg-brand-100/70 p-4 shadow-sm shadow-[#17120f]/5">
          <p className="text-[11px] font-black uppercase tracking-wide text-brand-800">{copy.aiPriority}</p>
          {loading ? (
            <div className="mt-3 space-y-2">
              <Shimmer className="h-6 w-3/4 rounded-xl bg-white/60" />
              <Shimmer className="h-12 rounded-xl bg-white/60" />
            </div>
          ) : (
            <>
              <h3 className="mt-2 text-lg font-black text-[#17120f]">{priorityTitle}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#4f4540]">{priorityDescription}</p>
              <Link
                to={priorityActionTo}
                className="mt-4 inline-flex items-center justify-between rounded-xl border border-[#17120f]/14 bg-[#fffaf6] px-3 py-2 text-xs font-black text-[#17120f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fddf82]/70"
              >
                {priorityActionLabel}
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <CategoryProjectionDonut
            loading={loading}
            insights={categoryInsights}
            projectedExpense={projectedExpense}
            copy={copy}
          />
        </div>
      </div>
    </section>
  )
}

const CATEGORY_CHART_COLORS = ['#ec5b4f', '#f4b942', '#34a886', '#8b7cf6']

function CategoryProjectionDonut({
  loading,
  insights,
  projectedExpense,
  copy,
}: {
  loading?: boolean
  insights: CategoryInsight[]
  projectedExpense: number
  copy: DashboardCopy
}) {
  const total = insights.reduce((sum, item) => sum + item.amount, 0)
  const visible = insights.slice(0, 3)
  const otherAmount = insights.slice(3).reduce((sum, item) => sum + item.amount, 0)
  const rows = [
    ...visible,
    ...(otherAmount > 0
      ? [{ id: 'other', name: copy.otherCategories, amount: otherAmount, count: 0 }]
      : []),
  ]
  let offset = 0
  const gradient = rows.length > 0 && total > 0
    ? `conic-gradient(${rows.map((row, index) => {
        const start = offset
        offset += (row.amount / total) * 100
        return `${CATEGORY_CHART_COLORS[index]} ${start}% ${offset}%`
      }).join(', ')})`
    : 'conic-gradient(#e7e0db 0 100%)'
  const topShare = total > 0 ? Math.round((rows[0]?.amount ?? 0) / total * 100) : 0

  return (
    <div className="rounded-2xl border border-[#17120f]/12 bg-[#fffaf6] p-4 shadow-sm shadow-[#17120f]/5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wide text-[#4f4540]/70">{copy.categoryProjection}</p>
        <p className="mt-1 text-xs leading-5 text-[#4f4540]/65">{copy.categoryProjectionHelper}</p>
      </div>
      {loading ? (
        <div className="mt-4 flex items-center gap-4">
          <Shimmer className="h-24 w-24 shrink-0 rounded-full" />
          <div className="w-full space-y-2">
            <Shimmer className="h-4 w-full rounded-lg" />
            <Shimmer className="h-4 w-4/5 rounded-lg" />
            <Shimmer className="h-4 w-3/5 rounded-lg" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-xs leading-5 text-[#4f4540]/75">{copy.categoryProjectionEmpty}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="relative grid h-28 w-28 shrink-0 place-items-center self-center rounded-full"
            style={{ background: gradient }}
            role="img"
            aria-label={`${copy.categoryProjection}: ${rows[0].name} ${topShare}%`}
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fffaf6] text-center shadow-inner">
              <span className="text-base font-black text-[#17120f]">{topShare}%</span>
            </div>
          </div>
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((row, index) => {
              const share = Math.round((row.amount / total) * 100)
              const projectedAmount = projectedExpense * (row.amount / total)
              return (
                <div key={row.id} className="rounded-xl border border-[#17120f]/8 bg-white/55 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_CHART_COLORS[index] }} />
                    <span className="min-w-0 flex-1 truncate font-bold text-[#4f4540]">{row.name}</span>
                    <span className="shrink-0 font-black text-[#17120f]">{share}%</span>
                  </div>
                  <p className="mt-2 text-xs font-black text-[#17120f]">{formatCurrency(projectedAmount)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function BriefingItem({
  label,
  value,
  helper,
  loading,
  tone,
}: {
  label: string
  value: string
  helper: string
  loading?: boolean
  tone: 'blue' | 'emerald' | 'rose'
}) {
  const toneClass = {
    blue: 'bg-[#ffe4dc]/70 text-[#17120f] border-brand-200',
    emerald: 'bg-[#ecfdf5]/80 text-[#134e4a] border-emerald-100',
    rose: 'bg-[#ffe4dc]/80 text-[#7f2d23] border-brand-100',
  }[tone]
  return (
    <div className={`flex min-h-[170px] flex-col rounded-2xl border p-4 shadow-sm shadow-[#17120f]/5 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-wide opacity-70">{label}</p>
      {loading ? (
        <Shimmer className="mt-3 h-6 w-28 rounded-xl bg-white/60" />
      ) : (
        <>
          <p className="mt-2 text-xl font-black">{value}</p>
          <p className="mt-3 text-xs leading-5 opacity-75">{helper}</p>
        </>
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
          <Link
            to="/app/upcoming-billings"
            className="mt-5 flex items-center justify-between rounded-xl border border-[#17120f]/14 bg-[#fffaf6] px-3 py-2.5 text-xs font-black text-[#17120f] shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-100"
          >
            {copy.monitorBilling}
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6">
          <p className="text-sm text-slate-500">{copy.emptyBilling}</p>
          <Link
            to="/app/upcoming-billings"
            className="mt-4 inline-flex items-center gap-1 text-xs font-black text-brand-700 hover:underline"
          >
            {copy.manageBills}
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
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

export default DashboardPage
