import { Link } from 'react-router-dom'
import { HiOutlineCalendarDays, HiOutlinePlusCircle } from 'react-icons/hi2'
import { Badge, Card } from '@/components/ui'
import { useLocale } from '@/i18n'
import { cn, formatCurrency } from '@/lib/utils'
import type { Wallet } from '@/types/api'
import { TargetStat } from './TargetStat'

export function TargetSummaryCard({
  count,
  totalSaved,
  totalTarget,
  overallPct,
}: {
  count: number
  totalSaved: number
  totalTarget: number
  overallPct: number
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        pocketCount: 'Jumlah Kantong',
        saved: 'Total Tertabung',
        target: 'Total Target',
        progress: 'Progres keseluruhan',
      }
    : {
        pocketCount: 'Pocket Count',
        saved: 'Total Saved',
        target: 'Total Target',
        progress: 'Overall progress',
      }
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <TargetStat label={copy.pocketCount} value={String(count)} />
        <TargetStat label={copy.saved} value={formatCurrency(totalSaved)} />
        <TargetStat label={copy.target} value={formatCurrency(totalTarget)} />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{copy.progress}</span>
          <span className="tabular-nums font-semibold text-brand-700">{overallPct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-white/80">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${overallPct}%` }} />
        </div>
      </div>
    </Card>
  )
}

export function TargetCard({ wallet, now }: { wallet: Wallet; now: number }) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        targetPocket: 'Kantong Tujuan',
        completed: 'Tercapai',
        overdue: 'Lewat tenggat',
        remaining: 'Sisa',
        addSaving: 'Tambah Tabungan',
      }
    : {
        targetPocket: 'Target Pocket',
        completed: 'Completed',
        overdue: 'Overdue',
        remaining: 'Remaining',
        addSaving: 'Add Saving',
      }
  const saved = Number(wallet.balance ?? 0)
  const target = Number(wallet.target_amount ?? 0)
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
  const remaining = Math.max(0, target - saved)
  const deadline = wallet.target_deadline ? new Date(wallet.target_deadline) : null
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / (24 * 60 * 60 * 1000)) : null
  const overdue = daysLeft != null && daysLeft < 0
  const completed = pct >= 100

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/62 shadow-lg shadow-slate-200/30 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              {wallet.name}
            </div>
            <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">
              🎯 {wallet.target_name || copy.targetPocket}
            </h3>
          </div>
          {completed ? (
            <Badge tone="green">{copy.completed}</Badge>
          ) : overdue ? (
            <Badge tone="red">{copy.overdue}</Badge>
          ) : (
            <Badge tone="blue">{pct}%</Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {formatCurrency(saved, wallet.currency)}
            </span>
            <span className="text-xs tabular-nums text-slate-500">
              / {formatCurrency(target, wallet.currency)}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/75 ring-1 ring-white/80">
            <div
              className={cn('h-full rounded-full', completed ? 'bg-emerald-500' : 'bg-brand-600')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>
              {copy.remaining}{' '}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(remaining, wallet.currency)}
              </span>
            </span>
            {deadline ? (
              <TargetDeadline deadline={deadline} daysLeft={daysLeft} overdue={overdue} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-white/80 bg-white/45 px-5 py-3">
        <Link
          to={`/app/transactions/add?wallet=${wallet.id}&type=income`}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-200/50 transition hover:bg-brand-700 active:scale-[0.98]"
        >
          <HiOutlinePlusCircle className="h-4 w-4" /> {copy.addSaving}
        </Link>
      </div>
    </div>
  )
}

function TargetDeadline({
  deadline,
  daysLeft,
  overdue,
}: {
  deadline: Date
  daysLeft: number | null
  overdue: boolean
}) {
  const { locale } = useLocale()
  return (
    <span className="inline-flex items-center gap-1">
      <HiOutlineCalendarDays className="h-3.5 w-3.5 text-slate-400" />
      {deadline.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}
      {daysLeft != null ? (
        <span
          className={cn(
            'ml-1',
            overdue ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500',
          )}
        >
          ({overdue
            ? locale === 'id' ? `lewat ${Math.abs(daysLeft)}h` : `${Math.abs(daysLeft)}d overdue`
            : locale === 'id' ? `${daysLeft}h lagi` : `${daysLeft}d left`})
        </span>
      ) : null}
    </span>
  )
}
