import { cn, formatCurrency } from '@/lib/utils'

export function SummaryCard({
  label,
  helper,
  value,
  tone,
  compact,
}: {
  label: string
  helper?: string
  value: number
  tone: 'emerald' | 'rose' | 'slate'
  compact?: boolean
}) {
  const isNet = tone === 'slate'
  const isIncome = tone === 'emerald' || (isNet && value >= 0)
  const signedValue = isNet && value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value)
  
  const glassStyle = isNet
    ? value >= 0
      ? {
          background: 'rgba(255, 255, 255, 0.68)',
          border: '1px solid rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        }
      : {
          background: 'rgba(255, 255, 255, 0.68)',
          border: '1px solid rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        }
    : isIncome
    ? {
        background: 'rgba(255, 255, 255, 0.68)',
        border: '1px solid rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
      }
    : {
        background: 'rgba(255, 255, 255, 0.68)',
        border: '1px solid rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
      }

  const colour = isIncome
    ? 'text-emerald-700'
    : 'text-rose-700'

  return (
    <div
      style={glassStyle}
      className={cn(
        'group relative overflow-hidden rounded-2xl px-5 py-4 shadow-lg shadow-slate-200/30 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md',
        compact && 'lg:px-4',
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/35 blur-2xl transition group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </div>
          {helper ? <p className="mt-1 text-[11px] font-medium text-slate-400">{helper}</p> : null}
        </div>
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black',
            isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
          )}
        >
          {isIncome ? '+' : '-'}
        </span>
      </div>
      <div className={cn('relative mt-3 font-black tracking-tight tabular-nums', colour, compact ? 'text-lg' : 'text-xl')}>
        {signedValue}
      </div>
    </div>
  )
}
