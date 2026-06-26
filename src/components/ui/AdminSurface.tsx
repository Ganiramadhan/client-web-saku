import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AdminMetricTone = 'brand' | 'emerald' | 'amber' | 'violet' | 'slate'

export function AdminMetricCard({
  label,
  value,
  helper,
  Icon,
  tone = 'brand',
  loading,
}: {
  label: string
  value: string | number
  helper?: string
  Icon: ComponentType<{ className?: string }>
  tone?: AdminMetricTone
  loading?: boolean
}) {
  const tones: Record<AdminMetricTone, string> = {
    brand: 'border-brand-200 bg-brand-100 text-brand-800',
    emerald: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    amber: 'border-[#17120f]/12 bg-[#fddf82]/75 text-[#17120f]',
    violet: 'border-violet-200 bg-violet-100 text-violet-800',
    slate: 'border-[#17120f]/12 bg-[#f6eee8] text-[#17120f]',
  }

  return (
    <div className="group rounded-[1.5rem] border border-[#17120f]/14 bg-[#fffaf6]/92 p-5 shadow-[0_16px_38px_rgba(23,18,15,0.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(23,18,15,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-[#6f625b]">{label}</p>
          {loading ? (
            <div className="shimmer mt-3 h-8 w-24 rounded-xl" />
          ) : (
            <p className="mt-2 truncate text-2xl font-black tracking-tight text-[#17120f]">{value}</p>
          )}
        </div>
        <span className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition duration-300 group-hover:-rotate-3 group-hover:scale-105',
          tones[tone],
        )}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {helper ? <p className="mt-3 text-xs leading-5 text-[#6f625b]">{helper}</p> : null}
    </div>
  )
}

export function AdminPanel({
  title,
  description,
  action,
  loading,
  className,
  children,
}: {
  title?: string
  description?: string
  action?: ReactNode
  loading?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn(
      'overflow-hidden rounded-[1.5rem] border border-[#17120f]/14 bg-[#fffaf6]/92 shadow-[0_18px_45px_rgba(23,18,15,0.08)]',
      className,
    )}>
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-[#17120f]/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-black text-[#17120f]">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs leading-5 text-[#6f625b]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="shimmer h-16 rounded-2xl" />
            ))}
          </div>
        ) : children}
      </div>
    </section>
  )
}
