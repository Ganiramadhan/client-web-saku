import { useMemo, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineChevronUpDown,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2'
import { Skeleton, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  searchPlaceholder?: string
  toolbar?: ReactNode
  emptyTitle?: string
  emptyAction?: ReactNode
  getRowId?: (row: T, index: number) => string
  disablePagination?: boolean
  initialPageSize?: number
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  data,
  columns,
  loading,
  searchPlaceholder = 'Cari…',
  toolbar,
  emptyTitle = 'Belum ada data',
  emptyAction,
  getRowId,
  disablePagination,
  initialPageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const safeData = useMemo(() => data ?? [], [data])

  const table = useReactTable({
    data: safeData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
    getRowId,
    initialState: { pagination: { pageSize: initialPageSize } },
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min(totalRows, (pageIndex + 1) * pageSize)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {globalFilter ? (
            <button
              type="button"
              onClick={() => setGlobalFilter('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : totalRows === 0 ? (
        <div className="p-10">
          <EmptyState title={emptyTitle} action={emptyAction} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const canSort = h.column.getCanSort()
                    const sortDir = h.column.getIsSorted()
                    return (
                      <th
                        key={h.id}
                        className={cn(
                          'px-4 py-3 font-semibold',
                          canSort && 'cursor-pointer select-none hover:text-slate-700',
                        )}
                        onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {canSort ? (
                            sortDir === 'asc' ? (
                              <HiOutlineChevronUp className="h-3 w-3" />
                            ) : sortDir === 'desc' ? (
                              <HiOutlineChevronDown className="h-3 w-3" />
                            ) : (
                              <HiOutlineChevronUpDown className="h-3 w-3 opacity-40" />
                            )
                          ) : null}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-slate-50/60',
                    onRowClick && 'cursor-pointer transition-colors hover:bg-brand-50/40',
                  )}
                  onClick={
                    onRowClick
                      ? (e) => {
                          const target = e.target as HTMLElement
                          if (target.closest('button, a, input, select, textarea, [data-stop-row]')) return
                          onRowClick(row.original)
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!disablePagination && totalRows > 0 ? (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Tampilkan</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {[5, 10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>data</span>
            </label>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span>
              Menampilkan <span className="font-medium text-slate-700">{start}</span>–
              <span className="font-medium text-slate-700">{end}</span> dari{' '}
              <span className="font-medium text-slate-700">{totalRows}</span> entri
            </span>
          </div>
          <NumberedPagination
            page={pageIndex + 1}
            totalPages={table.getPageCount() || 1}
            onChange={(p) => table.setPageIndex(p - 1)}
            canPrev={table.getCanPreviousPage()}
            canNext={table.getCanNextPage()}
          />
        </div>
      ) : null}
    </div>
  )
}


function NumberedPagination({
  page, totalPages, onChange, canPrev, canNext,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  canPrev: boolean
  canNext: boolean
}) {
  const pages = buildPageList(page, totalPages)
  return (
    <nav className="inline-flex items-center gap-1" aria-label="Pagination">
      <PageBtn
        onClick={() => onChange(page - 1)}
        disabled={!canPrev}
        aria="Sebelumnya"
      >
        <HiOutlineChevronLeft className="h-3.5 w-3.5" />
      </PageBtn>
      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`gap-${i}`}
            className="px-1.5 text-slate-400"
            aria-hidden
          >
            …
          </span>
        ) : (
          <PageBtn
            key={p}
            active={p === page}
            onClick={() => onChange(p)}
            aria={`Halaman ${p}`}
          >
            {p}
          </PageBtn>
        ),
      )}
      <PageBtn
        onClick={() => onChange(page + 1)}
        disabled={!canNext}
        aria="Berikutnya"
      >
        <HiOutlineChevronRight className="h-3.5 w-3.5" />
      </PageBtn>
    </nav>
  )
}

function PageBtn({
  children, active, disabled, onClick, aria,
}: {
  children: ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  aria?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={aria}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-xs font-medium transition',
        active
          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-white',
      )}
    >
      {children}
    </button>
  )
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | '…')[] = [1]
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)
  if (left > 2) pages.push('…')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('…')
  pages.push(total)
  return pages
}
