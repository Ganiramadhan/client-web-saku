import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineHashtag,
  HiOutlineIdentification,
  HiOutlineSparkles,
  HiOutlineUsers,
} from 'react-icons/hi2'

import { AdminDataTable, AdminMetricCard, Badge, Button, Modal, PageHeader } from '@/components/ui'
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
  active: 'Active',
  trialing: 'Trial',
  pending: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
  failed: 'Failed',
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

const shortOrder = (value?: string) => value ? `${value.slice(0, 14)}...` : '-'
const paymentLabel = (row: AdminSubscription) => {
  if (row.payment_type) return row.payment_type
  if (row.status === 'active' || row.status === 'trialing') return 'Confirmed'
  if (row.status === 'pending') return 'Waiting payment'
  return 'No payment'
}

export function SubscribersPage() {
  const t = useT()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [viewing, setViewing] = useState<AdminSubscription | null>(null)

  const q = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => subscriptionApi.listAllAdmin({ page: 1, limit: 200 }),
  })

  const rows = useMemo(() => q.data ?? [], [q.data])
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
      { value: 'all', label: 'All plans' },
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
        header: 'Subscriber',
        accessorFn: (r) => `${r.user_name} ${r.user_email}`,
        cell: ({ row }) => {
          const r = row.original
          const initial = (r.user_name || r.user_email || '?').charAt(0).toUpperCase()
          return (
            <div className="flex min-w-[220px] items-center gap-3">
              {r.user_photo_url ? (
                <img
                  src={r.user_photo_url}
                  alt={r.user_name || r.user_email}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-[#17120f] ring-2 ring-[#fffaf6] shadow-sm">
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
        header: 'Plan',
        accessorFn: (r) => r.plan_name,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex min-w-[140px] flex-col items-start gap-1">
              <Badge tone="violet">{r.plan_name || r.plan_code}</Badge>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">{r.plan_code}</span>
            </div>
          )
        },
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (r) => r.amount,
        cell: ({ row }) => (
          <div className="min-w-[120px]">
            <div className="text-sm font-extrabold tabular-nums text-slate-900">{fmtIDR(row.original.amount, row.original.currency)}</div>
            <div className="text-[11px] text-slate-400">{row.original.currency}</div>
          </div>
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
        id: 'order',
        header: 'Order',
        cell: ({ row }) => (
          <div className="flex min-w-[150px] flex-col text-xs text-slate-600">
            <span className="font-mono text-[11px] text-slate-700" title={row.original.order_id}>{shortOrder(row.original.order_id)}</span>
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              <HiOutlineCreditCard className="h-3 w-3" />
              {paymentLabel(row.original)}
            </span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Action</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setViewing(row.original)}
              className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700"
              title="Details"
            >
              <HiOutlineEye className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.subscribers}
        subtitle="All users with SAKU subscriptions."
        action={
          <Button
            variant="outline"
            onClick={() => q.refetch()}
            loading={q.isFetching}
            leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
          >
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total Subscribers" value={stats.total} helper="All subscription records" Icon={HiOutlineUsers} tone="brand" loading={q.isLoading} />
        <AdminMetricCard label="Active / Trial" value={stats.active} helper="Currently receiving plan access" Icon={HiOutlineCheckCircle} tone="emerald" loading={q.isLoading} />
        <AdminMetricCard label="Pending Payments" value={stats.pending} helper="Checkout awaiting confirmation" Icon={HiOutlineClock} tone="amber" loading={q.isLoading} />
        <AdminMetricCard label="Active Revenue" value={fmtIDR(stats.revenue)} helper="Active and trial subscriptions" Icon={HiOutlineBanknotes} tone="violet" loading={q.isLoading} />
      </section>

      <AdminDataTable
        data={filtered}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder="Search name, email, or order..."
        emptyTitle="No subscribers yet"
        getRowId={(r) => r.id}
        toolbar={
          <>
            <div className="min-w-[150px]">
              <RSelect
                value={status}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'trialing', label: 'Trial' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'failed', label: 'Failed' },
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
      <SubscriptionDetailModal subscription={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function SubscriptionDetailModal({
  subscription,
  onClose,
}: {
  subscription: AdminSubscription | null
  onClose: () => void
}) {
  if (!subscription) return null
  return (
    <Modal
      open={Boolean(subscription)}
      onClose={onClose}
      size="md"
      title="Subscription Detail"
      description={`${subscription.user_name || '-'} - ${subscription.plan_name || subscription.plan_code}`}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div>
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Subscription</p>
            <h3 className="mt-1 truncate text-lg font-extrabold text-slate-950">
              {subscription.plan_name || subscription.plan_code}
            </h3>
            <p className="mt-1 truncate text-sm text-slate-500">
              {subscription.user_name || '-'} · {subscription.user_email || '-'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(subscription.status)}>{statusLabel[subscription.status] || subscription.status}</Badge>
            <Badge tone="blue">{paymentLabel(subscription)}</Badge>
          </div>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          <DetailRow Icon={HiOutlineBanknotes} label="Amount" value={fmtIDR(subscription.amount, subscription.currency)} helper={subscription.currency} />
          <DetailRow Icon={HiOutlineSparkles} label="Plan code" value={subscription.plan_code} />
          <DetailRow Icon={HiOutlineHashtag} label="Order ID" value={subscription.order_id || '-'} helper={subscription.payment_type || 'Payment type not recorded'} />
          <DetailRow Icon={HiOutlineCalendarDays} label="Period" value={`${fmtDate(subscription.starts_at)} - ${fmtDate(subscription.ends_at)}`} />
          <DetailRow Icon={HiOutlineClock} label="Trial ends" value={fmtDate(subscription.trial_ends_at)} />
          <DetailRow Icon={HiOutlineIdentification} label="Created" value={fmtDate(subscription.created_at)} helper={`Updated ${fmtDate(subscription.updated_at)}`} />
        </div>
      </div>
    </Modal>
  )
}

function DetailRow({
  Icon,
  label,
  value,
  helper,
}: {
  Icon: typeof HiOutlineUsers
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value || '-'}</p>
        {helper ? <p className="mt-0.5 break-words text-xs text-slate-500">{helper}</p> : null}
      </div>
    </div>
  )
}
