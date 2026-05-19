import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlinePlus,
  HiOutlineCalendarDays,
  HiOutlinePlusCircle,
} from 'react-icons/hi2'

import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/ui'
import { walletApi } from '@/features/wallets/api'
import { formatCurrency, cn } from '@/lib/utils'
import type { Wallet } from '@/types/api'


export function TargetsPage() {
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })

  const pockets = useMemo<Wallet[]>(
    () =>
      (wallets.data ?? []).filter(
        (w) => w.target_amount != null && Number(w.target_amount) > 0,
      ),
    [wallets.data],
  )

  const totalSaved = pockets.reduce((s, w) => s + Number(w.balance ?? 0), 0)
  const totalTarget = pockets.reduce((s, w) => s + Number(w.target_amount ?? 0), 0)
  const overallPct =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kantong Tujuan"
        subtitle="Kelola dompet khusus untuk menabung menuju target tertentu — gaya Bank Jago."
        action={
          <Link to="/app/wallets">
            <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
              Atur di Dompet
            </Button>
          </Link>
        }
      />

      {/* Summary */}
      {pockets.length > 0 ? (
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Jumlah Kantong" value={String(pockets.length)} />
            <Stat label="Total Tertabung" value={formatCurrency(totalSaved)} />
            <Stat label="Total Target" value={formatCurrency(totalTarget)} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Progres keseluruhan</span>
              <span className="tabular-nums font-semibold text-brand-700">
                {overallPct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-brand-400/80 to-emerald-400/80"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </Card>
      ) : null}

      {/* List */}
      {wallets.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : pockets.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada Kantong Tujuan"
            description="Tandai salah satu dompet sebagai Kantong Tujuan untuk mulai menabung ke target tertentu (mis. Liburan, DP Rumah)."
            action={
              <Link to="/app/wallets">
                <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>
                  Buka Dompet
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pockets.map((w) => {
            const saved = Number(w.balance ?? 0)
            const target = Number(w.target_amount ?? 0)
            const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
            const remaining = Math.max(0, target - saved)
            const deadline = w.target_deadline ? new Date(w.target_deadline) : null
            const daysLeft = deadline
              ? Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
              : null
            const overdue = daysLeft != null && daysLeft < 0
            const completed = pct >= 100
            return (
              <div
                key={w.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">
                        {w.name}
                      </div>
                      <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">
                        🎯 {w.target_name || 'Kantong Tujuan'}
                      </h3>
                    </div>
                    {completed ? (
                      <Badge tone="green">Tercapai</Badge>
                    ) : overdue ? (
                      <Badge tone="red">Lewat tenggat</Badge>
                    ) : (
                      <Badge tone="blue">{pct}%</Badge>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-bold tabular-nums text-slate-900">
                        {formatCurrency(saved, w.currency)}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">
                        / {formatCurrency(target, w.currency)}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full bg-linear-to-r',
                          completed
                            ? 'from-emerald-400/80 to-emerald-500/80'
                            : 'from-brand-400/80 to-emerald-400/80',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Sisa{' '}
                        <span className="font-semibold tabular-nums text-slate-900">
                          {formatCurrency(remaining, w.currency)}
                        </span>
                      </span>
                      {deadline ? (
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineCalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          {deadline.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {daysLeft != null ? (
                            <span
                              className={cn(
                                'ml-1',
                                overdue
                                  ? 'text-rose-600'
                                  : daysLeft <= 7
                                    ? 'text-amber-600'
                                    : 'text-slate-500',
                              )}
                            >
                              ({overdue ? `lewat ${Math.abs(daysLeft)}h` : `${daysLeft}h lagi`})
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
                  <Link
                    to={`/app/transactions/add?wallet=${w.id}&type=income`}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    <HiOutlinePlusCircle className="h-4 w-4" /> Tambah Tabungan
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  )
}
