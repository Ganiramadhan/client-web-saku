import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineArrowPath,
  HiOutlineChartBarSquare,
  HiOutlineClock,
  HiOutlineCursorArrowRays,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineUsers,
} from 'react-icons/hi2'
import { adminUserApi } from '@/features/adminUsers/api'
import { aiLogApi } from '@/features/ai/api'
import { subscriptionApi } from '@/features/subscription/api'
import { Badge, Button, PageHeader, Shimmer } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'super_admin'
  const usersQ = useQuery({
    queryKey: ['admin-dashboard', 'users'],
    queryFn: () => adminUserApi.list({ page: 1, limit: 200 }),
  })
  const subsQ = useQuery({
    queryKey: ['admin-dashboard', 'subscriptions'],
    queryFn: () => subscriptionApi.listAllAdmin({ page: 1, limit: 200 }),
  })
  const logsQ = useQuery({
    queryKey: ['admin-dashboard', 'ai-logs'],
    queryFn: () => aiLogApi.listAll(1, 200),
  })

  const users = usersQ.data?.data ?? []
  const subscriptions = subsQ.data ?? []
  const logs = logsQ.data?.data ?? []

  const stats = useMemo(() => {
    const activeSubs = subscriptions.filter((item) => item.status === 'active' || item.status === 'trialing')
    const pendingSubs = subscriptions.filter((item) => item.status === 'pending')
    const successfulLogs = logs.filter((item) => item.status === 'success').length
    const ocrLogs = logs.filter((item) => item.feature === 'scan_receipt')
    const aiLogs = logs.filter((item) => item.feature !== 'scan_receipt')
    const paidSubs = subscriptions.filter((item) => item.status === 'active' || item.status === 'trialing' || item.status === 'expired' || item.status === 'cancelled')
    const conversionRate = users.length > 0 ? Math.round((paidSubs.length / users.length) * 100) : 0

    return {
      users: users.length,
      activeSubs: activeSubs.length,
      pendingSubs: pendingSubs.length,
      revenue: activeSubs.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      aiLogs: logs.length,
      ocrUsage: ocrLogs.length,
      aiUsage: aiLogs.length,
      aiSuccessRate: logs.length > 0 ? Math.round((successfulLogs / logs.length) * 100) : 0,
      conversionRate,
    }
  }, [logs, subscriptions, users.length])

  const userGrowth = useMemo(() => buildDailySeries(users.map((item) => item.created_at), 7), [users])
  const subscriptionSeries = useMemo(() => buildDailySeries(subscriptions.map((item) => item.created_at), 7), [subscriptions])
  const aiUsageSeries = useMemo(() => buildDailySeries(logs.map((item) => item.created_at), 7), [logs])
  const lastActivity = useMemo(() => {
    const activities = [
      ...users.map((item) => ({ id: `user-${item.id}`, label: item.name || item.email, meta: 'User registered', at: item.created_at, tone: 'blue' as const })),
      ...subscriptions.map((item) => ({ id: `sub-${item.id}`, label: item.user_name || item.user_email || 'Subscriber', meta: `${item.plan_name || item.plan_code} subscription ${item.status}`, at: item.updated_at || item.created_at, tone: 'emerald' as const })),
      ...logs.map((item) => ({ id: `log-${item.id}`, label: item.user_name || item.user_email || 'AI user', meta: `${item.feature || 'AI'} ${item.status}`, at: item.created_at, tone: item.status === 'failed' ? 'red' as const : 'amber' as const })),
    ]
    return activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6)
  }, [logs, subscriptions, users])
  const journey = [
    { label: 'Registered', value: users.length },
    { label: 'Tried AI', value: new Set(logs.map((item) => item.user_id)).size },
    { label: 'Started checkout', value: subscriptions.length },
    { label: 'Active subscriber', value: stats.activeSubs },
  ]
  const activeUsers = useMemo(() => {
    const now = Date.now()
    return [...users]
      .filter((item) => item.last_login_at && item.id !== user?.id)
      .sort((a, b) => new Date(b.last_login_at ?? 0).getTime() - new Date(a.last_login_at ?? 0).getTime())
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        name: item.name || item.email,
        email: item.email,
        lastLogin: item.last_login_at,
        online: item.last_login_at ? now - new Date(item.last_login_at).getTime() <= 30 * 60 * 1000 : false,
      }))
  }, [user?.id, users])

  const loading = usersQ.isLoading || subsQ.isLoading || logsQ.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Monitor users, subscription activity, and AI usage from one operational view."
        action={
          <Button
            variant="outline"
            leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
            onClick={() => {
              usersQ.refetch()
              subsQ.refetch()
              logsQ.refetch()
            }}
          >
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          loading={loading}
          label="Total Users"
          value={String(stats.users)}
          helper="Registered non-deleted accounts"
          Icon={HiOutlineUsers}
          tone="blue"
        />
        <AdminStatCard
          loading={loading}
          label="Active Subscriptions"
          value={String(stats.activeSubs)}
          helper={`${stats.pendingSubs} pending payments`}
          Icon={HiOutlineSparkles}
          tone="emerald"
        />
        <AdminStatCard
          loading={loading}
          label="OCR Usage"
          value={String(stats.ocrUsage)}
          helper="Receipt scans in latest logs"
          Icon={HiOutlineDocumentMagnifyingGlass}
          tone="violet"
        />
        <AdminStatCard
          loading={loading}
          label="AI Usage"
          value={String(stats.aiUsage)}
          helper={`${stats.aiSuccessRate}% success rate`}
          Icon={HiOutlineSparkles}
          tone="amber"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard loading={loading} label="Active Revenue" value={formatCurrency(stats.revenue)} helper="From active or trialing subscriptions" Icon={HiOutlineChartBarSquare} tone="violet" />
        <AdminStatCard loading={loading} label="Conversion Rate" value={`${stats.conversionRate}%`} helper="Users with subscription history" Icon={HiOutlineCursorArrowRays} tone="blue" />
        <AdminStatCard loading={loading} label="Pending Payments" value={String(stats.pendingSubs)} helper="Checkout sessions awaiting payment" Icon={HiOutlineClock} tone="amber" />
        <AdminStatCard loading={loading} label="Recently Active" value={String(activeUsers.length)} helper="Users with login activity" Icon={HiOutlineUsers} tone="emerald" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <AdminPanel title="User Growth" actionLabel="View users" to={isSuperAdmin ? '/super-admin/users' : '/admin/users'} loading={usersQ.isLoading}>
          <MiniBarChart series={userGrowth} />
        </AdminPanel>
        <AdminPanel title="Active Users" actionLabel="View users" to={isSuperAdmin ? '/super-admin/users' : '/admin/users'} loading={usersQ.isLoading}>
          <ActiveUsersList users={activeUsers} />
        </AdminPanel>
        <AdminPanel title="Subscription Trend" actionLabel="View subscriptions" to={isSuperAdmin ? '/super-admin/subscriptions' : '/admin/subscriptions'} loading={subsQ.isLoading}>
          <MiniBarChart series={subscriptionSeries} tone="emerald" />
        </AdminPanel>
        <AdminPanel title="User Journey" actionLabel="View subscriptions" to={isSuperAdmin ? '/super-admin/subscriptions' : '/admin/subscriptions'} loading={loading}>
          <JourneyChart rows={journey} />
        </AdminPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Latest Subscriptions"
          actionLabel="View subscriptions"
          to={isSuperAdmin ? '/super-admin/subscriptions' : '/admin/subscriptions'}
          loading={subsQ.isLoading}
        >
          <div className="divide-y divide-slate-100">
            {subscriptions.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{item.user_name || item.user_email}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.plan_name || item.plan_code}</p>
                  </div>
                  <Badge tone={item.status === 'active' ? 'green' : item.status === 'pending' ? 'amber' : 'gray'}>
                    {item.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{formatCurrency(Number(item.amount || 0), item.currency)}</span>
                  <span>{formatDateTime(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Latest AI Logs"
          actionLabel="View AI logs"
          to="/super-admin/ai-logs"
          loading={logsQ.isLoading}
        >
          <div className="divide-y divide-slate-100">
            {logs.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{item.user_name || item.user_email || 'Unknown user'}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.feature || 'AI request'}</p>
                  </div>
                  <Badge tone={item.status === 'success' ? 'green' : item.status === 'failed' ? 'red' : 'amber'}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="AI Activity" actionLabel="View AI logs" to="/super-admin/ai-logs" loading={logsQ.isLoading}>
          <MiniBarChart series={aiUsageSeries} tone="amber" />
        </AdminPanel>

        <AdminPanel
          title="Last Activity"
          actionLabel="View AI logs"
          to="/super-admin/ai-logs"
          loading={loading}
        >
          <div className="divide-y divide-slate-100">
            {lastActivity.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{item.label}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.meta}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-slate-400">{formatDateTime(item.at)}</span>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>
    </div>
  )
}

function AdminStatCard({
  label,
  value,
  helper,
  Icon,
  tone,
  loading,
}: {
  label: string
  value: string
  helper: string
  Icon: typeof HiOutlineUsers
  tone: 'blue' | 'emerald' | 'violet' | 'amber'
  loading?: boolean
}) {
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
  }[tone]

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl border ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {loading ? <Shimmer className="mt-5 h-8 w-28 rounded-xl" /> : <p className="mt-5 text-3xl font-black text-slate-950">{value}</p>}
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  )
}

function ActiveUsersList({
  users,
}: {
  users: Array<{ id: string; name: string; email: string; lastLogin?: string | null; online: boolean }>
}) {
  if (users.length === 0) {
    return <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-400">No recent login activity yet.</p>
  }
  return (
    <div className="divide-y divide-slate-100">
      {users.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700">
            {item.name.trim().charAt(0).toUpperCase() || 'U'}
            <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white ${item.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
            <p className="truncate text-xs text-slate-500">{item.email}</p>
          </div>
          <div className="text-right">
            <Badge tone={item.online ? 'green' : 'gray'}>{item.online ? 'Online' : 'Recent'}</Badge>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">{item.lastLogin ? formatDateTime(item.lastLogin) : '-'}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniBarChart({ series, tone = 'blue' }: { series: Array<{ label: string; value: number }>; tone?: 'blue' | 'emerald' | 'amber' }) {
  const max = Math.max(1, ...series.map((item) => item.value))
  const toneClass = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-600'
  return (
    <div className="flex h-52 items-end gap-2">
      {series.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end rounded-2xl bg-slate-50 px-1.5 pb-1.5">
            <div
              className={`${toneClass} w-full rounded-xl transition-all duration-500`}
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function JourneyChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, rows[0]?.value ?? 1)
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">{row.label}</span>
            <span className="font-black tabular-nums text-slate-950">{row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function buildDailySeries(dates: string[], days: number) {
  const now = new Date()
  const rows = Array.from({ length: days }).map((_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (days - index - 1))
    return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en-US', { weekday: 'short' }), value: 0 }
  })
  const byKey = new Map(rows.map((row) => [row.key, row]))
  dates.forEach((value) => {
    const key = new Date(value).toISOString().slice(0, 10)
    const row = byKey.get(key)
    if (row) row.value += 1
  })
  return rows.map(({ label, value }) => ({ label, value }))
}

function AdminPanel({
  title,
  actionLabel,
  to,
  loading,
  children,
}: {
  title: string
  actionLabel: string
  to: string
  loading?: boolean
  children: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        <Link to={to} className="text-xs font-bold text-blue-700 hover:underline">
          {actionLabel}
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Shimmer key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : children}
    </div>
  )
}

export default AdminDashboardPage
