import { HiOutlineBanknotes } from 'react-icons/hi2'
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
    <section className="rounded-[1.35rem] border border-[#17120f]/10 bg-[#fffaf6]/72 p-5 shadow-[0_16px_38px_rgba(23,18,15,0.06)] backdrop-blur-2xl">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#17120f]/10 bg-white/72 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#4f4540]">
            <HiOutlineBanknotes className="h-4 w-4 text-brand-700" />
            {copy.totalBalance}
          </div>

          <p className="mt-4 text-3xl font-black tracking-tight text-[#17120f] sm:text-4xl">
            {formatCurrency(totalBalance)}
          </p>

          <p className="mt-3 text-sm text-[#4f4540]">
            {copy.activeWallets(wallets.length)}
          </p>

          <div
            className={[
              'mt-4 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold',
              net30d >= 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-brand-200 bg-[#fff3ee] text-brand-800',
            ].join(' ')}
          >
            {copy.net30d}: {net30d >= 0 ? '+' : ''}
            {formatCurrency(net30d)}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryMetric label={copy.income30d} value={formatCurrency(totalIncome30d)} tone="emerald" />
          <SummaryMetric label={copy.expense30d} value={formatCurrency(totalExpense30d)} tone="rose" />
          <SummaryMetric label={copy.savingRate} value={`${savingRate}%`} tone="slate" />
        </div>
      </div>
    </section>
  )
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'rose' | 'slate'
}) {
  const valueClass =
    tone === 'emerald' ? 'text-emerald-800' : tone === 'rose' ? 'text-brand-700' : 'text-[#17120f]'

  return (
    <div className="rounded-xl border border-[#17120f]/8 bg-white/64 p-4 shadow-sm shadow-[#17120f]/4">
      <p className="text-xs font-semibold text-[#4f4540]/70">{label}</p>
      <p className={cn('mt-2 truncate text-lg font-black tabular-nums', valueClass)}>{value}</p>
    </div>
  )
}
