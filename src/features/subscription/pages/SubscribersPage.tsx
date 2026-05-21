import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineUsers,
} from 'react-icons/hi2'
import type { IconType } from 'react-icons'

import { Badge, Button, DataTable, PageHeader } from '@/components/ui'
import { RSelect } from '@/components/ui/RSelect'
import { subscriptionApi, type AdminSubscription } from '@/features/subscription/api'
import { useT } from '@/i18n'

type StatusFilter = 'all' | AdminSubscription['status']
type PlanFilter = 'all' | string

const statusTone = (s: AdminSubscription['status']) => {
  switch (s) {
    case 'active':
      return 'green'
    case 'trialing':
      return 'blue'
    case 'pending':
      return 'amber'
    case 'expired':
    case 'cancelled':
      return 'gray'
    case 'failed':
      return 'red'
    default:
      return 'gray'
  }
}

const statusLabel: Record<AdminSubscription['status'], string> = {
  active: 'Aktif',
  trialing: 'Trial',
  pending: 'Menunggu',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
}

const fmtIDR = (n: number, ccy = 'IDR') =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: ccy, maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (s?: string | null) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

export function SubscribersPage() {
  const t = useT()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [plan, setPlan] = useState<PlanFilter>('all')

  const q = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => subscriptionApi.listAllAdmin({ page: 1, limit: 200 }),
  })

  const rows = q.data ?? []
  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === 'active' || row.status === 'trialing').length,
    pending: rows.filter((row) => row.status === 'pending').length,
    revenue: rows
      .filter((row) => row.status === 'active' || row.status === 'trialing')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0),
  }), [rows])

  const planOptions = useMemo(() => {
    const set = new Map<string, string>()
    rows.forEach((r) => set.set(r.plan_code, r.plan_name || r.plan_code))
    return [
      { value: 'all', label: 'Semua paket' },
      ...Array.from(set.entries()).map(([value, label]) => ({ value, label })),
    ]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (plan !== 'all' && r.plan_code !== plan) return false
      return true
    })
  }, [rows, status, plan])

  const columns = useMemo<ColumnDef<AdminSubscription>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        cell: ({ row }) => <span className="text-gray-500">{row.index + 1}</span>,
        size: 50,
      },
      {
        id: 'user',
        header: 'Pelanggan',
        accessorFn: (r) => `${r.user_name} ${r.user_email}`,
        cell: ({ row }) => {
          const r = row.original
          const initial = (r.user_name || r.user_email || '?').charAt(0).toUpperCase()
          return (
            <div className="flex items-center gap-3">
              {r.user_photo_url ? (
                <img
                  src={r.user_photo_url}
                  alt={r.user_name || r.user_email}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white ring-2 ring-white shadow-sm">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{r.user_name || '—'}</div>
                <div className="truncate text-xs text-slate-500">{r.user_email}</div>
              </div>
            </div>
          )
        },
      },
      {
        id: 'plan',
        header: 'Paket',
        accessorFn: (r) => r.plan_name,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex flex-col">
              <Badge tone="violet">{r.plan_name || r.plan_code}</Badge>
              <span className="mt-1 text-xs text-slate-500">{r.plan_code}</span>
            </div>
          )
        },
      },
      {
        id: 'amount',
        header: 'Nominal',
        accessorFn: (r) => r.amount,
        cell: ({ row }) => (
          <span className="text-sm font-bold tabular-nums text-slate-900">{fmtIDR(row.original.amount, row.original.currency)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (r) => r.status,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex flex-col gap-1">
              <Badge tone={statusTone(r.status)}>{statusLabel[r.status] || r.status}</Badge>
              {r.is_trial ? <span className="text-[10px] uppercase tracking-wide text-blue-600">Trial</span> : null}
            </div>
          )
        },
      },
      {
        id: 'period',
        header: 'Periode',
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="text-xs leading-5 text-slate-600">
              <div>Mulai: {fmtDate(r.starts_at)}</div>
              <div>Selesai: {fmtDate(r.ends_at)}</div>
              {r.trial_ends_at ? <div>Trial s/d: {fmtDate(r.trial_ends_at)}</div> : null}
            </div>
          )
        },
      },
      {
        id: 'order',
        header: 'Order',
        cell: ({ row }) => (
          <div className="flex flex-col text-xs text-slate-600">
            <span className="font-mono text-[11px] text-slate-700">{row.original.order_id}</span>
            <span className="text-slate-500">{row.original.payment_type || '—'}</span>
          </div>
        ),
      },
      {
        id: 'createdAt',
        header: 'Dibuat',
        accessorFn: (r) => r.created_at,
        cell: ({ row }) => <span className="text-xs text-slate-600">{fmtDate(row.original.created_at)}</span>,
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.subscribers}
        subtitle="Daftar semua pengguna yang telah berlangganan SAKU."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SubStatCard label="Total Subscriber" value={String(stats.total)} Icon={HiOutlineUsers} tone="blue" />
        <SubStatCard label="Aktif / Trial" value={String(stats.active)} Icon={HiOutlineCheckCircle} tone="emerald" />
        <SubStatCard label="Belum Selesai" value={String(stats.pending)} Icon={HiOutlineClock} tone="amber" />
        <SubStatCard label="Revenue Aktif" value={fmtIDR(stats.revenue)} Icon={HiOutlineBanknotes} tone="violet" />
      </section>

      <DataTable
        data={filtered}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder="Cari nama, email, order…"
        emptyTitle="Belum ada pelanggan"
        getRowId={(r) => r.id}
        toolbar={
          <>
            <div className="min-w-[150px]">
              <RSelect
                value={status}
                options={[
                  { value: 'all', label: 'Semua status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'trialing', label: 'Trial' },
                  { value: 'pending', label: 'Menunggu' },
                  { value: 'expired', label: 'Kadaluarsa' },
                  { value: 'cancelled', label: 'Dibatalkan' },
                  { value: 'failed', label: 'Gagal' },
                ]}
                onChange={(v) => setStatus((v as StatusFilter) ?? 'all')}
              />
            </div>
            <div className="min-w-[150px]">
              <RSelect
                value={plan}
                options={planOptions}
                onChange={(v) => setPlan((v as PlanFilter) ?? 'all')}
              />
            </div>
            {status !== 'all' || plan !== 'all' ? (
              <Button
                variant="outline"
                className="border-rose-100 !bg-white text-rose-700 hover:!bg-rose-50"
                onClick={() => {
                  setStatus('all')
                  setPlan('all')
                }}
              >
                Reset Filter
              </Button>
            ) : null}
          </>
        }
      />
    </div>
  )
}

function SubStatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string
  value: string
  Icon: IconType
  tone: 'blue' | 'emerald' | 'amber' | 'violet'
}) {
  const styles = {
    blue: 'border-blue-100 bg-blue-50/60 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    violet: 'border-violet-100 bg-violet-50/60 text-violet-700',
  }
  return (
    <div className="group rounded-2xl border border-white/80 bg-white/68 p-4 shadow-lg shadow-slate-200/30 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-extrabold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-105 ${styles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
