import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDocumentMagnifyingGlass,
} from 'react-icons/hi2'
import { aiLogApi } from '@/features/ai/api'
import { AdminDataTable, AdminMetricCard, Badge, Button, PageHeader } from '@/components/ui'
import { useT } from '@/i18n'
import { formatDateTime } from '@/lib/utils'
import type { AIProcessingLog as AILog } from '@/types/api'

export function AILogsPage() {
  const t = useT()
  const [page, setPage] = useState(1)
  const limit = 10
  const q = useQuery({
    queryKey: ['ai-logs', page, limit],
    queryFn: () => aiLogApi.listAll(page, limit),
  })

  const rows = useMemo(() => q.data?.data ?? [], [q.data?.data])
  const meta = q.data?.meta ?? null
  const stats = useMemo(() => {
    const successful = rows.filter((log) => log.status === 'success').length
    const measuredLatency = rows.filter((log) => log.latency_ms != null)
    return {
      total: meta?.total ?? rows.length,
      successRate: rows.length > 0 ? Math.round((successful / rows.length) * 100) : 0,
      receiptScans: rows.filter((log) => log.feature === 'scan_receipt').length,
      averageLatency: measuredLatency.length > 0
        ? Math.round(measuredLatency.reduce((sum, log) => sum + Number(log.latency_ms || 0), 0) / measuredLatency.length)
        : 0,
    }
  }, [meta?.total, rows])

  const columns = useMemo<ColumnDef<AILog>[]>(
    () => [
      {
        id: 'no',
        header: '#',
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-slate-400">
            {(page - 1) * limit + row.index + 1}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: 'user',
        header: 'User',
        accessorFn: (l) => l.user_name ?? '',
        cell: ({ row }) => (
          <div className="min-w-[190px]">
            <div className="font-semibold text-slate-900">{row.original.user_name || '—'}</div>
            {row.original.user_email ? (
              <div className="text-xs text-slate-500">{row.original.user_email}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: 'date',
        header: t.transactions.date,
        accessorFn: (l) => l.created_at,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-slate-700">
            {formatDateTime(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'feature',
        header: t.ai.feature,
        accessorFn: (l) => l.feature ?? '',
        cell: ({ row }) => <Badge tone="violet">{row.original.feature ?? '—'}</Badge>,
      },
      {
        id: 'status',
        header: t.ai.status,
        accessorFn: (l) => l.status,
        cell: ({ row }) => {
          const log = row.original
          return (
            <div>
              <Badge
                tone={
                  log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'amber'
                }
              >
                {log.status}
              </Badge>
              {log.error_message ? (
                <div
                  className="mt-1 max-w-[260px] truncate text-xs text-rose-600"
                  title={log.error_message}
                >
                  {log.error_message}
                </div>
              ) : null}
            </div>
          )
        },
      },
      {
        id: 'confidence',
        header: t.ai.confidence,
        accessorFn: (l) => l.confidence_score ?? 0,
        cell: ({ row }) => {
          const c = row.original.confidence_score
          if (c == null) return <span className="text-slate-400">—</span>
          const pct = (c * 100).toFixed(0)
          return (
            <span
              className={
                c < 0.7
                  ? 'rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
                  : 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
              }
            >
              {pct}%
            </span>
          )
        },
      },
      {
        id: 'latency',
        header: () => <span className="block text-right">{t.ai.latency}</span>,
        accessorFn: (l) => l.latency_ms ?? 0,
        cell: ({ row }) => (
          <div className="text-right text-slate-500">
            {row.original.latency_ms != null ? `${row.original.latency_ms}ms` : '—'}
          </div>
        ),
      },
      {
        id: 'model',
        header: t.ai.model,
        accessorFn: (l) => l.model_version ?? '',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">{row.original.model_version || '—'}</span>
        ),
      },
    ],
    [limit, page, t],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.ai.title}
        subtitle={t.ai.subtitle}
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
        <AdminMetricCard label="Total Requests" value={stats.total} helper="AI processing logs recorded" Icon={HiOutlineBolt} tone="brand" loading={q.isLoading} />
        <AdminMetricCard label="Success Rate" value={`${stats.successRate}%`} helper="Successful requests on this page" Icon={HiOutlineCheckCircle} tone="emerald" loading={q.isLoading} />
        <AdminMetricCard label="Receipt Scans" value={stats.receiptScans} helper="OCR usage on this page" Icon={HiOutlineDocumentMagnifyingGlass} tone="violet" loading={q.isLoading} />
        <AdminMetricCard label="Avg. Latency" value={`${stats.averageLatency}ms`} helper="Measured processing time" Icon={HiOutlineClock} tone="amber" loading={q.isLoading} />
      </section>

      <AdminDataTable
        data={rows}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder="Search user, model, or error..."
        emptyTitle="No AI logs yet"
        getRowId={(r) => r.id}
        serverPagination={meta ? {
          page: meta.page,
          pageSize: meta.limit,
          totalPages: meta.total_pages,
          totalRows: meta.total,
          onPageChange: setPage,
        } : undefined}
      />
    </div>
  )
}
