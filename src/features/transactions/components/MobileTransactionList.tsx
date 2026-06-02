import { useMemo, useState } from 'react'
import {
  HiOutlineArrowDownCircle,
  HiOutlineArrowUpCircle,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/api'
import { resolveCategoryIcon } from './TransactionCategoryCell'
import type { TransactionCopy } from '../constants/copy'

export function MobileTransactionList({
  loading,
  items,
  walletMap,
  categoryMap,
  onView,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelected,
  copy,
}: {
  loading: boolean
  items: Transaction[]
  walletMap: Map<string, string>
  categoryMap: Map<string, string>
  onView: (tx: Transaction) => void
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
  selectedIds: Set<string>
  onToggleSelected: (id: string) => void
  copy: TransactionCopy
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = useMemo(() => {
    if (!search) return items
    const s = search.toLowerCase()
    return items.filter((tx) => {
      const cat = (categoryMap.get(tx.category_id) ?? '').toLowerCase()
      const wlt = (walletMap.get(tx.wallet_id) ?? '').toLowerCase()
      const desc = (tx.merchant_name || tx.description || '').toLowerCase()
      return cat.includes(s) || wlt.includes(s) || desc.includes(s)
    })
  }, [items, search, walletMap, categoryMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = buildMobilePageList(safePage, totalPages)
  const start = (safePage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  if (!loading && items.length === 0) return null

  return (
    <div className="space-y-3 md:hidden">
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder={copy.searchPlaceholder}
        className="w-full rounded-xl border border-white/60 bg-white/40 px-3.5 py-2.5 text-sm shadow-sm backdrop-blur-md focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-300"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/30 border border-white/40" />
          ))}
        </div>
      ) : (
        <>
          {visible.map((tx, i) => {
            const isIncome = tx.type === 'income'
            const cat = categoryMap.get(tx.category_id) ?? '—'
            const wlt = walletMap.get(tx.wallet_id) ?? '—'
            const { Icon: CatIcon, tone: catTone } = resolveCategoryIcon(cat)
            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md hover:bg-white/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tx.id)}
                      onChange={() => onToggleSelected(tx.id)}
                      aria-label={copy.detail}
                      className="mt-3 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-brand-600 transition hover:scale-110 focus:ring-brand-500"
                    />
                    <div className={'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/10 ' + catTone}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          #{start + i + 1}
                        </span>
                        <Badge tone={isIncome ? 'green' : 'red'}>
                          {isIncome ? (
                            <HiOutlineArrowDownCircle className="h-3 w-3" />
                          ) : (
                            <HiOutlineArrowUpCircle className="h-3 w-3" />
                          )}
                          <span className="ml-1 font-semibold">{isIncome ? copy.income : copy.expense}</span>
                        </Badge>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold text-slate-900">{cat}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(tx.transaction_date)} · {wlt}
                      </p>
                      {(tx.merchant_name || tx.description) && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {tx.merchant_name || tx.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={
                      'shrink-0 text-right text-base font-black ' +
                      (isIncome ? 'text-emerald-700' : 'text-rose-700')
                    }
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-white/60 pt-2">
                  <button
                    onClick={() => onView(tx)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white/80 transition-all"
                  >
                    <HiOutlineEye className="h-4 w-4" />
                    <span className="sr-only">{copy.detail}</span>
                  </button>
                  <button
                    onClick={() => onEdit(tx)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white/80 transition-all"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5" /> {copy.edit}
                  </button>
                  <button
                    onClick={() => onDelete(tx)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-all"
                  >
                    <HiOutlineTrash className="h-3.5 w-3.5" /> {copy.delete}
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              {copy.emptyTitle}
            </div>
          ) : null}

          {filtered.length > pageSize ? (
            <div className="px-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">
                {safePage}/{totalPages}
              </span>
              <div className="no-scrollbar mt-2 flex items-center gap-1 overflow-x-auto rounded-xl border border-white/60 bg-white/40 p-1 shadow-sm shadow-slate-200/40 backdrop-blur-md">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage(1)}
                  aria-label="First page"
                  className="h-8 shrink-0 rounded-lg border border-transparent bg-transparent px-2.5 font-semibold transition-all duration-200 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
                >
                  First
                </button>
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="h-8 shrink-0 rounded-lg border border-transparent bg-transparent px-2.5 font-semibold transition-all duration-200 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
                >
                  Prev
                </button>
                {pageItems.map((item, index) =>
                  item === '...' ? (
                    <span key={`gap-${index}`} className="inline-flex h-8 shrink-0 items-center rounded-lg px-2 font-bold text-slate-400" aria-hidden>
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      aria-current={item === safePage ? 'page' : undefined}
                      className={
                        'h-8 min-w-8 shrink-0 rounded-lg border px-2 font-semibold transition-all duration-200 ' +
                        (item === safePage
                          ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-200/50'
                          : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm')
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className="h-8 shrink-0 rounded-lg border border-transparent bg-transparent px-2.5 font-semibold transition-all duration-200 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
                >
                  Next
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(totalPages)}
                  aria-label="Last page"
                  className="h-8 shrink-0 rounded-lg border border-transparent bg-transparent px-2.5 font-semibold transition-all duration-200 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
                >
                  Last
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function buildMobilePageList(page: number, totalPages: number): Array<number | '...'> {
  const out: Array<number | '...'> = []
  if (page > 1) out.push('...')
  out.push(page)
  if (page < totalPages) out.push('...')
  return out
}
