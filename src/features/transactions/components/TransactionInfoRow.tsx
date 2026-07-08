import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

export function TransactionInfoRow({
  Icon,
  label,
  value,
  multiline,
}: {
  Icon: ComponentType<{ className?: string }>
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/85 bg-white/70 text-slate-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div
          className={cn(
            'mt-0.5 text-sm text-slate-900',
            multiline ? 'whitespace-pre-wrap font-medium' : 'truncate font-bold',
          )}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
