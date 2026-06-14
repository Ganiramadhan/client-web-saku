import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
} from 'react-icons/hi2'
import { Skeleton, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DataTableLabels {
  clearSearch?: string
  show?: string
  rows?: string
  showing?: string
  of?: string
  entries?: string
  previous?: string
  next?: string
  page?: string
}

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
  labels?: DataTableLabels
  variant?: 'default' | 'admin'
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
  labels,
  variant = 'default',
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const safeData = useMemo(() => data ?? [], [data])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedGlobalFilter(globalFilter), 250)
    return () => window.clearTimeout(timer)
  }, [globalFilter])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: safeData,
    columns,
    state: { globalFilter: debouncedGlobalFilter, sorting },
    onGlobalFilterChange: setDebouncedGlobalFilter,
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

  const admin = variant === 'admin'

  return (
    <div className={cn(
      'overflow-hidden rounded-[1.35rem] shadow-[0_18px_45px_rgba(23,18,15,0.07)] backdrop-blur-2xl',
      admin ? 'border border-[#17120f]/12 bg-[#fffaf6]/78' : 'border border-[#17120f]/10 bg-[#fffaf6]/62',
    )}>
      <div className={cn(
        'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
        admin ? 'border-b border-[#17120f]/10 bg-white/45' : 'border-b border-[#17120f]/8 bg-white/32',
      )}>
        <div className="relative w-full sm:max-w-xs">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4540]/45" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full rounded-2xl py-2.5 pl-9 pr-9 text-sm font-semibold text-[#17120f] shadow-sm transition placeholder:text-[#4f4540]/45 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
              admin ? 'border border-[#17120f]/10 bg-[#fffaf6]/95' : 'border border-[#17120f]/10 bg-[#fffaf6]/82',
            )}
          />
          {globalFilter ? (
            <button
              type="button"
              onClick={() => setGlobalFilter('')}
              aria-label={labels?.clearSearch ?? 'Clear search'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#4f4540]/45 hover:bg-white hover:text-brand-700"
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
            <thead className={cn(
              'text-left text-xs uppercase tracking-wide text-slate-500',
              admin ? 'border-b border-[#17120f]/10 bg-white/70' : 'border-b border-[#17120f]/8 bg-white/45',
            )}>
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
                          admin && 'border-r border-[#17120f]/6 last:border-r-0',
                          canSort && 'cursor-pointer select-none hover:text-[#17120f]',
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
            <tbody className={cn(admin ? 'divide-y divide-[#17120f]/8' : 'divide-y divide-[#17120f]/6')}>
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    index % 2 === 1 && 'bg-white/24',
                    admin ? 'hover:bg-white/70' : 'hover:bg-white/45',
                    onRowClick && 'cursor-pointer hover:bg-brand-50/55',
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
                    <td key={cell.id} className={cn(
                      'px-4 py-3 align-middle text-slate-700',
                      admin && 'border-r border-[#17120f]/6 last:border-r-0',
                    )}>
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
        <div className={cn(
          'flex flex-col gap-3 px-4 py-3 text-xs text-[#4f4540] sm:flex-row sm:items-center sm:justify-between',
          admin ? 'border-t border-[#17120f]/10 bg-[#fffaf6]/64' : 'border-t border-[#17120f]/8 bg-[#fffaf6]/48',
        )}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 rounded-2xl border border-[#17120f]/8 bg-white/48 px-2.5 py-1.5 text-xs font-semibold text-[#4f4540] shadow-sm shadow-[#17120f]/4">
              <span>{labels?.show ?? 'Tampilkan'}</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded-xl border border-[#17120f]/10 bg-[#fffaf6] px-2 py-1.5 text-xs font-black text-[#17120f] shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {[5, 10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>{labels?.rows ?? 'data'}</span>
            </label>
            <span className="hidden text-[#17120f]/20 sm:inline">·</span>
            <span className="rounded-2xl border border-[#17120f]/8 bg-white/40 px-2.5 py-1.5 font-semibold shadow-sm shadow-[#17120f]/4">
              {labels?.showing ?? 'Menampilkan'} <span className="font-black text-[#17120f]">{start}</span>–
              <span className="font-black text-[#17120f]">{end}</span> dari{' '}
              <span className="font-black text-[#17120f]">{totalRows}</span> {labels?.entries ?? 'entri'}
            </span>
          </div>
          <NumberedPagination
            page={pageIndex + 1}
            totalPages={table.getPageCount() || 1}
            onChange={(p) => table.setPageIndex(p - 1)}
            canPrev={table.getCanPreviousPage()}
            canNext={table.getCanNextPage()}
            labels={labels}
          />
        </div>
      ) : null}
    </div>
  )
}


function NumberedPagination({
  page, totalPages, onChange, canPrev, canNext, labels,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  canPrev: boolean
  canNext: boolean
  labels?: DataTableLabels
}) {
  const pages = buildPageList(page, totalPages)
  return (
    <nav className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-[#17120f]/10 bg-[#fffaf6]/72 p-1.5 shadow-sm shadow-[#17120f]/5 backdrop-blur-md sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible" aria-label="Pagination">
      <PageBtn
        onClick={() => onChange(1)}
        disabled={!canPrev}
        aria="First page"
      >
        <span className="sm:hidden">First</span>
        <span className="hidden sm:inline">First page</span>
      </PageBtn>
      <PageBtn
        onClick={() => onChange(page - 1)}
        disabled={!canPrev}
        aria={labels?.previous ?? 'Sebelumnya'}
      >
        Prev
      </PageBtn>
      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`gap-${i}`}
            className="inline-flex h-8 shrink-0 items-center rounded-lg px-2 text-xs font-black text-[#4f4540]/45"
            aria-hidden
          >
            …
          </span>
        ) : (
          <PageBtn
            key={p}
            active={p === page}
            onClick={() => onChange(p)}
            aria={`${labels?.page ?? 'Halaman'} ${p}`}
            className={p === page ? undefined : 'max-sm:hidden'}
          >
            {p}
          </PageBtn>
        ),
      )}
      <PageBtn
        onClick={() => onChange(page + 1)}
        disabled={!canNext}
        aria={labels?.next ?? 'Berikutnya'}
      >
        Next
      </PageBtn>
      <PageBtn
        onClick={() => onChange(totalPages)}
        disabled={!canNext}
        aria="Last page"
      >
        <span className="sm:hidden">Last</span>
        <span className="hidden sm:inline">Last page</span>
      </PageBtn>
    </nav>
  )
}

function PageBtn({
  children, active, disabled, onClick, aria,
  className,
}: {
  children: ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  aria?: string
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={aria}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center whitespace-nowrap rounded-xl border px-3 text-xs font-black transition-all duration-200 ease-out',
        active
          ? 'border-[#17120f]/16 bg-brand-200 text-[#17120f] shadow-sm shadow-brand-100/50'
          : 'border-transparent bg-transparent text-[#4f4540] hover:-translate-y-0.5 hover:border-[#17120f]/10 hover:bg-white/75 hover:text-brand-700 hover:shadow-sm',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[#4f4540] hover:shadow-none',
        className,
      )}
    >
      {children}
    </button>
  )
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = new Set<number>([current - 1, current, current + 1])
  if (current <= 2) {
    pages.add(1)
    pages.add(2)
    pages.add(3)
  }
  if (current >= total - 1) {
    pages.add(total - 2)
    pages.add(total - 1)
    pages.add(total)
  }
  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= total)
    .sort((a, b) => a - b)
  const out: (number | '…')[] = []
  if ((sorted[0] ?? 1) > 1) out.push('…')
  for (const item of sorted) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number' && item - prev > 1) out.push('…')
    out.push(item)
  }
  if ((sorted[sorted.length - 1] ?? total) < total) out.push('…')
  return out
}
