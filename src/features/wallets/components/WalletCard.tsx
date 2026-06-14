import { HiOutlineClock, HiOutlinePencilSquare, HiOutlineStar, HiOutlineTrash } from 'react-icons/hi2'
import { useLocale } from '@/i18n'
import { formatCurrency, cn } from '@/lib/utils'
import type { Wallet } from '@/types/api'
import { TYPE_THEME, normalizeWalletType, labelForType, getTargetProgress, formatRelativeFromMs } from '../utils'

export interface WalletStat {
  income: number
  expense: number
  count: number
  lastAt: number | null
}

export function WalletCard({
  wallet,
  stat,
  onEdit,
  onDelete,
  onSetDefault,
  setDefaultLoading,
}: {
  wallet: Wallet
  stat?: WalletStat
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  setDefaultLoading?: boolean
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        default: 'Default',
        setDefault: 'Jadikan dompet utama',
        edit: 'Edit',
        delete: 'Hapus',
        balance: 'Saldo',
        income30d: 'Masuk 30d',
        expense30d: 'Keluar 30d',
        net: 'net',
        tx30d: 'tx 30d',
        targetPocket: 'Kantong Tujuan',
        until: 's/d',
        noTarget: 'Target nominal belum ditetapkan.',
      }
    : {
        default: 'Default',
        setDefault: 'Set as default wallet',
        edit: 'Edit',
        delete: 'Delete',
        balance: 'Balance',
        income30d: 'Income 30d',
        expense30d: 'Spending 30d',
        net: 'net',
        tx30d: 'tx 30d',
        targetPocket: 'Target Pocket',
        until: 'until',
        noTarget: 'Target amount has not been set.',
      }
  const type = normalizeWalletType(wallet.type)
  const theme = TYPE_THEME[type]
  const Icon = theme.Icon
  const income = stat?.income ?? 0
  const expense = stat?.expense ?? 0
  const count = stat?.count ?? 0
  const net = income - expense
  const lastActivity = formatRelativeFromMs(stat?.lastAt ?? null, locale)
  const targetProgress = getTargetProgress(wallet)

  return (
    <article className="overflow-hidden rounded-[1.25rem] border border-[#17120f]/10 bg-[#fffaf6]/72 shadow-sm shadow-[#17120f]/5 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white/86 hover:shadow-md">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#17120f]/10 bg-white/72 shadow-sm',
                theme.iconText,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-base font-black text-[#17120f]">{wallet.name}</h3>
                {wallet.is_default ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                    <HiOutlineStar className="h-3 w-3" />
                    {copy.default}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#4f4540]/65">
                {labelForType(wallet.type, locale)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-[#17120f]/10 bg-white/70 p-1 shadow-sm">
            {!wallet.is_default ? (
              <button
                type="button"
                onClick={onSetDefault}
                disabled={setDefaultLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
                title={copy.setDefault}
              >
                <HiOutlineStar className="h-4 w-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
              title={copy.edit}
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              title={copy.delete}
            >
              <HiOutlineTrash className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-[#4f4540]/65">{copy.balance}</p>
          <p className="mt-1 truncate text-2xl font-black tabular-nums text-[#17120f] sm:text-3xl">
            {formatCurrency(Number(wallet.balance ?? 0), wallet.currency)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <MiniStat label={copy.income30d} value={formatCurrency(income, wallet.currency)} tone="emerald" />
          <MiniStat label={copy.expense30d} value={formatCurrency(expense, wallet.currency)} tone="rose" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4f4540]/70">
          <span className={cn('font-black tabular-nums', net >= 0 ? 'text-emerald-800' : 'text-brand-700')}>
            {net >= 0 ? '+' : ''}
            {formatCurrency(net, wallet.currency)} {copy.net}
          </span>
          <span className="inline-flex items-center gap-1">
            <HiOutlineClock className="h-3.5 w-3.5" />
            {count} {copy.tx30d} · {lastActivity}
          </span>
        </div>
      </div>

      {targetProgress !== null ? (
        <div className="border-t border-emerald-50 bg-linear-to-b from-emerald-50/45 to-white/60 px-5 pb-4 pt-1">
          <TargetProgressSection wallet={wallet} progress={targetProgress} copy={copy} locale={locale} />
        </div>
      ) : null}
    </article>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'rose'
}) {
  const valueClass = tone === 'emerald' ? 'text-emerald-700' : 'text-rose-600'

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 truncate text-xs font-bold tabular-nums', valueClass)}>{value}</p>
    </div>
  )
}

function TargetProgressSection({
  wallet,
  progress,
  copy,
  locale,
}: {
  wallet: Wallet
  progress: number
  copy: {
    targetPocket: string
    until: string
    noTarget: string
  }
  locale: 'id' | 'en'
}) {
  const targetAmount = Number(wallet.target_amount ?? 0)
  const hasTargetAmount = targetAmount > 0

  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-white/86 p-4 shadow-sm shadow-emerald-100/30">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-semibold text-slate-800">{wallet.target_name || copy.targetPocket}</p>

        <p className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold tabular-nums text-emerald-700">
          {progress}%
        </p>
      </div>

      {hasTargetAmount ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              {formatCurrency(Number(wallet.balance ?? 0), wallet.currency)} /{' '}
              {formatCurrency(targetAmount, wallet.currency)}
            </span>

            {wallet.target_deadline ? (
              <span>
                {copy.until}{' '}
                {new Date(wallet.target_deadline).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">{copy.noTarget}</p>
      )}
    </div>
  )
}
