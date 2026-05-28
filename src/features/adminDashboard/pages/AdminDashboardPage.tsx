import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineArrowPath,
  HiOutlineChartBarSquare,
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
    queryFn: () => aiLogApi.listAll(1, 20),
  })

  const users = usersQ.data?.data ?? []
  const subscriptions = subsQ.data ?? []
  const logs = logsQ.data?.data ?? []

  const stats = useMemo(() => {
    const activeSubs = subscriptions.filter((item) => item.status === 'active' || item.status === 'trialing')
    const pendingSubs = subscriptions.filter((item) => item.status === 'pending')
    const successfulLogs = logs.filter((item) => item.status === 'success').length

    return {
      users: users.length,
      activeSubs: activeSubs.length,
      pendingSubs: pendingSubs.length,
      revenue: activeSubs.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      aiLogs: logs.length,
      aiSuccessRate: logs.length > 0 ? Math.round((successfulLogs / logs.length) * 100) : 0,
    }
  }, [logs, subscriptions, users.length])

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
          label="Active Revenue"
          value={formatCurrency(stats.revenue)}
          helper="From active or trialing subscriptions"
          Icon={HiOutlineChartBarSquare}
          tone="violet"
        />
        <AdminStatCard
          loading={loading}
          label="AI Success Rate"
          value={`${stats.aiSuccessRate}%`}
          helper={`${stats.aiLogs} latest AI logs sampled`}
          Icon={HiOutlineSparkles}
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Latest Subscriptions"
          actionLabel="View subscriptions"
          to={isSuperAdmin ? '/super-admin/subscriptions' : '/admin/subscriptions'}
          loading={subsQ.isLoading}
        >
          <div className="space-y-3">
            {subscriptions.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
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
          <div className="space-y-3">
            {logs.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
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
