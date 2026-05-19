import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { aiLogApi } from '@/features/ai/api'
import { Badge, DataTable, PageHeader, Pagination } from '@/components/ui'
import { useT } from '@/i18n'
import { formatDateTime } from '@/lib/utils'
import type { AIProcessingLog as AILog } from '@/types/api'

export function AILogsPage() {
  const t = useT()
  const [page, setPage] = useState(1)
  const limit = 50
  const q = useQuery({
    queryKey: ['ai-logs', page, limit],
    queryFn: () => aiLogApi.listAll(page, limit),
  })

  const rows = q.data?.data ?? []
  const meta = q.data?.meta ?? null

  const columns = useMemo<ColumnDef<AILog>[]>(
    () => [
      {
        id: 'user',
        header: 'User',
        accessorFn: (l) => l.user_name ?? '',
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <div className="font-medium text-slate-900">{row.original.user_name || '—'}</div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  return (
    <div>
      <PageHeader title={t.ai.title} subtitle={t.ai.subtitle} />

      <DataTable
        data={rows}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder="Cari user, model, error…"
        emptyTitle={t.common.empty}
        getRowId={(r) => r.id}
      />

      {meta && meta.total_pages > 1 ? (
        <div className="mt-4">
          <Pagination page={meta.page} totalPages={meta.total_pages} onChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}
