import { HiOutlineBanknotes } from 'react-icons/hi2'
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
  const net30d = totalIncome30d - totalExpense30d
  const savingRate =
    totalIncome30d > 0 ? Math.max(0, Math.min(100, Math.round((net30d / totalIncome30d) * 100))) : 0

  return (
    <section className="rounded-xl border border-white/80 bg-white/72 p-5 shadow-sm backdrop-blur-2xl">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <HiOutlineBanknotes className="h-4 w-4 text-slate-700" />
            Total Saldo
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {formatCurrency(totalBalance)}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Total saldo dari {wallets.length} dompet aktif.
          </p>

          <div
            className={[
              'mt-4 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold',
              net30d >= 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700',
            ].join(' ')}
          >
            Net 30 hari: {net30d >= 0 ? '+' : ''}
            {formatCurrency(net30d)}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryMetric label="Pemasukan 30d" value={formatCurrency(totalIncome30d)} tone="emerald" />
          <SummaryMetric label="Pengeluaran 30d" value={formatCurrency(totalExpense30d)} tone="rose" />
          <SummaryMetric label="Saving Rate" value={`${savingRate}%`} tone="slate" />
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
    tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-600' : 'text-slate-950'

  return (
    <div className="rounded-xl border border-slate-200 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-2 truncate text-lg font-bold tabular-nums', valueClass)}>{value}</p>
    </div>
  )
}
