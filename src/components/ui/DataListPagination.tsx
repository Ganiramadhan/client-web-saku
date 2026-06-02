import type { ReactNode } from 'react'
import type { DataTableLabels } from './DataTable'
import { cn } from '@/lib/utils'

export function DataListPagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  labels,
}: {
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  labels?: DataTableLabels
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  if (totalRows <= 0) return null
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize + 1
  const end = Math.min(totalRows, safePage * pageSize)

  return (
    <div className="mt-4 flex flex-col gap-3 px-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span>{labels?.show ?? 'Tampilkan'}</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-md border border-white/80 bg-white/80 px-1.5 py-1 text-xs text-slate-700 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {[6, 12, 24, 48].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>{labels?.rows ?? 'data'}</span>
        </label>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span>
          {labels?.showing ?? 'Menampilkan'} <span className="font-medium text-slate-700">{start}</span>-
          <span className="font-medium text-slate-700">{end}</span> dari{' '}
          <span className="font-medium text-slate-700">{totalRows}</span> {labels?.entries ?? 'entri'}
        </span>
      </div>

      <nav className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/60 bg-white/35 p-1 shadow-sm shadow-slate-200/40 backdrop-blur-md sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible" aria-label="Pagination">
        <PageButton
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
          aria="First page"
        >
          <span className="sm:hidden">First</span>
          <span className="hidden sm:inline">First page</span>
        </PageButton>
        <PageButton
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria={labels?.previous ?? 'Sebelumnya'}
        >
          Prev
        </PageButton>
        {buildPageList(safePage, totalPages).map((item, index) =>
          item === '...' ? (
            <span
              key={`gap-${index}`}
              className="inline-flex h-8 shrink-0 items-center rounded-lg px-2 text-xs font-bold text-slate-400"
              aria-hidden
            >
              ...
            </span>
          ) : (
            <PageButton
              key={item}
              active={item === safePage}
              onClick={() => onPageChange(item)}
              aria={`${labels?.page ?? 'Halaman'} ${item}`}
              className={item === safePage ? undefined : 'max-sm:hidden'}
            >
              {item}
            </PageButton>
          ),
        )}
        <PageButton
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria={labels?.next ?? 'Berikutnya'}
        >
          Next
        </PageButton>
        <PageButton
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria="Last page"
        >
          <span className="sm:hidden">Last</span>
          <span className="hidden sm:inline">Last page</span>
        </PageButton>
      </nav>
    </div>
  )
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  aria,
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
        'inline-flex h-8 min-w-[2rem] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-all duration-200 ease-out',
        active
          ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-200/50'
          : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-600 hover:shadow-none',
        className,
      )}
    >
      {children}
    </button>
  )
}

function buildPageList(page: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = new Set<number>([page - 1, page, page + 1])
  if (page <= 2) {
    pages.add(1)
    pages.add(2)
    pages.add(3)
  }
  if (page >= totalPages - 1) {
    pages.add(totalPages - 2)
    pages.add(totalPages - 1)
    pages.add(totalPages)
  }
  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)
  const out: Array<number | '...'> = []
  if ((sorted[0] ?? 1) > 1) out.push('...')
  for (const item of sorted) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number' && item - prev > 1) out.push('...')
    out.push(item)
  }
  if ((sorted[sorted.length - 1] ?? totalPages) < totalPages) out.push('...')
  return out
}
