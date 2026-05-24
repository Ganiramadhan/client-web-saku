import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2'
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
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/45 px-4 py-3 text-xs text-slate-500 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
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

      <nav className="inline-flex items-center gap-1" aria-label="Pagination">
        <PageButton
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria={labels?.previous ?? 'Sebelumnya'}
        >
          <HiOutlineChevronLeft className="h-3.5 w-3.5" />
        </PageButton>
        {buildPageList(safePage, totalPages).map((item, index) =>
          item === '...' ? (
            <span key={`gap-${index}`} className="px-1.5 text-slate-400" aria-hidden>...</span>
          ) : (
            <PageButton
              key={item}
              active={item === safePage}
              onClick={() => onPageChange(item)}
              aria={`${labels?.page ?? 'Halaman'} ${item}`}
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
          <HiOutlineChevronRight className="h-3.5 w-3.5" />
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
        'inline-flex h-8 min-w-[2rem] cursor-pointer items-center justify-center rounded-md border px-2 text-xs font-medium transition',
        active ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-white',
      )}
    >
      {children}
    </button>
  )
}

function buildPageList(page: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
  if (page <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
  }
  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)
  const out: Array<number | '...'> = []
  for (const item of sorted) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number' && item - prev > 1) out.push('...')
    out.push(item)
  }
  return out
}
