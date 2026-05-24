import { HiOutlineArrowDownCircle, HiOutlineArrowUpCircle, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2'
import { Badge, Button, Modal } from '@/components/ui'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/api'
import { resolveCategoryIcon } from './TransactionCategoryCell'
import type { TransactionCopy } from '../constants/copy'

export function DetailModal({
  tx,
  walletName,
  categoryName,
  onClose,
  onEdit,
  onDelete,
  copy,
}: {
  tx: Transaction | null
  walletName?: string
  categoryName?: string
  onClose: () => void
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
  copy: TransactionCopy
}) {
  if (!tx) return null

  const isIncome = tx.type === 'income'
  const { Icon: CatIcon } = resolveCategoryIcon(categoryName)

  const sourceLabel =
    tx.source && tx.source !== 'manual'
      ? tx.source === 'ai_ocr'
        ? 'Hasil Scan AI'
        : tx.source === 'import'
          ? 'Impor'
          : tx.source === 'api'
            ? 'API'
            : tx.source
      : null

  return (
    <Modal
      open={Boolean(tx)}
      onClose={onClose}
      title={`${copy.detail} ${copy.add.replace(/^Tambah |^Add /i, '')}`}
      description={copy.summary}
      size="md"
      footer={
        <>
          {onEdit ? (
            <Button
              variant="outline"
              leftIcon={<HiOutlinePencilSquare className="h-4 w-4" />}
              onClick={() => onEdit(tx)}
            >
              {copy.edit}
            </Button>
          ) : null}

          {onDelete ? (
            <Button
              variant="danger"
              leftIcon={<HiOutlineTrash className="h-4 w-4" />}
              onClick={() => onDelete(tx)}
            >
              {copy.delete}
            </Button>
          ) : null}
        </>
      }
    >
      <div
        className={cn(
          `
          relative
          overflow-hidden
          rounded-3xl
          border
          p-5
          backdrop-blur-xl
          `,
          isIncome
            ? 'border-emerald-100 bg-emerald-50/60'
            : 'border-rose-100 bg-rose-50/60',
        )}
        style={{
          boxShadow:
            '0 10px 32px rgba(15,23,42,.04), inset 0 1px 0 rgba(255,255,255,.9)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              `
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              bg-white
              shadow-sm
              `,
              isIncome
                ? 'border-emerald-100 text-emerald-700'
                : 'border-rose-100 text-rose-700',
            )}
          >
            <CatIcon className="h-7 w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={isIncome ? 'green' : 'red'}>
                {isIncome ? (
                  <HiOutlineArrowDownCircle className="h-3.5 w-3.5" />
                ) : (
                  <HiOutlineArrowUpCircle className="h-3.5 w-3.5" />
                )}
                <span className="ml-1 font-semibold">
                  {isIncome ? copy.income : copy.expense}
                </span>
              </Badge>

              {sourceLabel ? <Badge tone="violet">{sourceLabel}</Badge> : null}
            </div>

            <div className="mt-1.5 truncate text-xs font-bold uppercase tracking-wider text-slate-500">
              {categoryName ?? '—'}
            </div>

            <div
              className={cn(
                'mt-1 text-2xl font-black tabular-nums sm:text-3xl',
                isIncome ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {isIncome ? '+ ' : '- '}
              {formatCurrency(Number(tx.amount))}
            </div>

            <div className="mt-1 text-xs font-medium text-slate-500">
              {formatDate(tx.transaction_date)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <InfoTile label={copy.wallet} value={walletName ?? '—'} />

        <InfoTile label={copy.merchant} value={tx.merchant_name || '—'} />

        <InfoTile
          label={copy.description}
          value={
            <span className="block whitespace-pre-wrap text-slate-700">
              {tx.description || '—'}
            </span>
          }
          className="col-span-2"
        />

        {typeof tx.confidence_score === 'number' ? (
          <InfoTile
            label="AI Confidence"
            value={
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      tx.confidence_score >= 0.8
                        ? 'bg-emerald-500'
                        : tx.confidence_score >= 0.5
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                    )}
                    data-pct={(tx.confidence_score * 100).toFixed(0)}
                    style={{
                      width: `${(tx.confidence_score * 100).toFixed(0)}%`,
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-slate-700">
                  {(tx.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            }
            className="col-span-2"
          />
        ) : null}
      </div>
    </Modal>
  )
}

function InfoTile({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/60 bg-white/40 px-4 py-3 shadow-inner backdrop-blur-md transition-all duration-300 hover:bg-white/60',
        className
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}
