import {
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineChartBar,
} from 'react-icons/hi2'
import { useLocale } from '@/i18n'
import { formatCurrency, cn } from '@/lib/utils'
import type { Wallet, WalletType } from '@/types/api'

export interface WalletStat {
  income: number
  expense: number
  count: number
  lastAt: number | null
}

export function WalletsSummaryCard({
  wallets,
  totalBalance,
  totalIncome30d,
  totalExpense30d,
}: {
  wallets: Wallet[]
  totalBalance: number
  totalIncome30d: number
  totalExpense30d: number
  byType?: Record<WalletType, number>
  walletStats?: Map<string, WalletStat>
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        totalBalance: 'Total Saldo',
        activeWallets: (count: number) => `Total saldo dari ${count} dompet aktif.`,
        net30d: 'Net 30 hari',
        income30d: 'Pemasukan 30d',
        expense30d: 'Pengeluaran 30d',
        savingRate: 'Saving Rate',
      }
    : {
        totalBalance: 'Total Balance',
        activeWallets: (count: number) => `Total balance from ${count} active wallets.`,
        net30d: '30-day net',
        income30d: 'Income 30d',
        expense30d: 'Spending 30d',
        savingRate: 'Saving Rate',
      }
  const net30d = totalIncome30d - totalExpense30d
  const savingRate =
    totalIncome30d > 0 ? Math.max(0, Math.min(100, Math.round((net30d / totalIncome30d) * 100))) : 0

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border-[1.5px] border-[#17120f]/55 bg-[#fffaf6] p-5 shadow-[0_20px_55px_rgba(23,18,15,0.1)] sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-brand-400" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-100/65 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#fddf82]/30 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[1.1fr_1.4fr] lg:items-end">
        <div className="relative min-h-[290px] overflow-hidden rounded-[1.4rem] border border-[#17120f]/14 bg-brand-100/70 p-5 pb-28 min-[560px]:min-h-[230px] min-[560px]:pb-6 sm:p-6">
          <MoneyDoodle />

          <div className="relative z-10 max-w-full min-[560px]:max-w-[58%] lg:max-w-[64%]">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#17120f]/14 bg-[#fffaf6]/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#4f4540] shadow-sm">
              <HiOutlineBanknotes className="h-4 w-4 text-brand-700" />
              {copy.totalBalance}
            </div>

            <p className="mt-5 break-words text-3xl font-black tracking-tight text-[#17120f] sm:text-4xl">
              {formatCurrency(totalBalance)}
            </p>

            <p className="mt-3 text-sm leading-6 text-[#4f4540]">
              {copy.activeWallets(wallets.length)}
            </p>

            <div
              className={[
                'mt-4 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black shadow-sm',
                net30d >= 0
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                  : 'border-brand-200 bg-[#fff3ee]/90 text-brand-800',
              ].join(' ')}
            >
              {net30d >= 0 ? (
                <HiOutlineArrowTrendingUp className="h-4 w-4" />
              ) : (
                <HiOutlineArrowTrendingDown className="h-4 w-4" />
              )}
              {copy.net30d}: {net30d >= 0 ? '+' : ''}
              {formatCurrency(net30d)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:pb-1">
          <SummaryMetric
            label={copy.income30d}
            value={formatCurrency(totalIncome30d)}
            tone="emerald"
            Icon={HiOutlineArrowTrendingUp}
          />
          <SummaryMetric
            label={copy.expense30d}
            value={formatCurrency(totalExpense30d)}
            tone="rose"
            Icon={HiOutlineArrowTrendingDown}
          />
          <SummaryMetric
            label={copy.savingRate}
            value={`${savingRate}%`}
            tone="slate"
            Icon={HiOutlineChartBar}
          />
        </div>
      </div>
    </section>
  )
}

function SummaryMetric({
  label,
  value,
  tone,
  Icon,
}: {
  label: string
  value: string
  tone: 'emerald' | 'rose' | 'slate'
  Icon: typeof HiOutlineBanknotes
}) {
  const valueClass =
    tone === 'emerald' ? 'text-emerald-800' : tone === 'rose' ? 'text-brand-700' : 'text-[#17120f]'
  const iconClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
      : tone === 'rose'
        ? 'border-brand-200 bg-brand-100 text-brand-800'
        : 'border-[#17120f]/12 bg-[#fddf82]/70 text-[#17120f]'

  return (
    <div className="group flex min-h-[132px] flex-col justify-between rounded-[1.25rem] border border-[#17120f]/12 bg-[#fffaf6]/86 p-4 shadow-[0_12px_30px_rgba(23,18,15,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(23,18,15,0.09)]">
      <div className="flex items-start justify-between gap-2">
        <p className="pt-1 text-xs font-bold leading-5 text-[#4f4540]/70">{label}</p>
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition group-hover:-rotate-3', iconClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={cn('mt-4 truncate text-lg font-black tabular-nums', valueClass)}>{value}</p>
    </div>
  )
}

function MoneyDoodle() {
  return (
    <svg
      viewBox="0 0 240 210"
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-1 right-1 block h-[112px] w-[128px] opacity-75 min-[400px]:h-[128px] min-[400px]:w-[146px] min-[560px]:-bottom-3 min-[560px]:-right-2 min-[560px]:h-[215px] min-[560px]:w-[245px] min-[560px]:opacity-100"
      fill="none"
    >
      <path d="M40 170c26 14 57 20 91 16 31-4 53-17 69-36" stroke="#17120F" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="5 8" opacity=".24" />
      <path d="M177 31c4-11 11-17 21-20M183 39c11-5 21-5 30-1" stroke="#17120F" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <path d="M51 56c-7-7-15-10-24-9M49 64c-10 1-17 6-23 14" stroke="#17120F" strokeWidth="3" strokeLinecap="round" opacity=".45" />

      <g transform="rotate(-7 137 111)">
        <rect x="74" y="62" width="126" height="82" rx="17" fill="#FDDF82" stroke="#17120F" strokeWidth="3" />
        <rect x="84" y="72" width="106" height="62" rx="12" stroke="#17120F" strokeWidth="2" strokeDasharray="5 5" opacity=".72" />
        <circle cx="137" cy="103" r="22" fill="#FFFAF6" stroke="#17120F" strokeWidth="2.5" />
        <path d="M143 91c-3-3-13-3-14 3-2 9 17 5 15 14-1 7-13 7-17 2M136 85v36" stroke="#17120F" strokeWidth="3" strokeLinecap="round" />
        <path d="M92 83h17M165 123h17" stroke="#17120F" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      </g>

      <g>
        <circle cx="71" cy="147" r="29" fill="#FF9D8D" stroke="#17120F" strokeWidth="3" />
        <circle cx="71" cy="147" r="20" stroke="#17120F" strokeWidth="2" strokeDasharray="4 4" opacity=".65" />
        <path d="M76 136c-3-3-12-3-13 3-1 8 15 5 14 12-1 7-11 7-15 3M70 130v34" stroke="#17120F" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g transform="rotate(13 172 160)">
        <rect x="143" y="143" width="58" height="43" rx="11" fill="#FFF8F4" stroke="#17120F" strokeWidth="3" />
        <path d="M155 157h30M155 166h19" stroke="#EC5B4F" strokeWidth="3" strokeLinecap="round" />
      </g>

      <path d="M210 93l4 9 9 4-9 4-4 9-4-9-9-4 9-4 4-9Z" fill="#FFFAF6" stroke="#17120F" strokeWidth="2" />
      <path d="M48 104l3 6 6 3-6 3-3 7-3-7-7-3 7-3 3-6Z" fill="#FFFAF6" stroke="#17120F" strokeWidth="2" />
    </svg>
  )
}
