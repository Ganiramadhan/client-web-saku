import type { IconType } from 'react-icons'

export function SubStatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string
  value: string
  Icon: IconType
  tone: 'blue' | 'emerald' | 'amber' | 'violet'
}) {
  const styles = {
    blue: 'border-blue-100 bg-blue-50/60 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    violet: 'border-violet-100 bg-violet-50/60 text-violet-700',
  }
  return (
    <div className="group rounded-2xl border border-white/80 bg-white/68 p-4 shadow-lg shadow-slate-200/30 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-extrabold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-105 ${styles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
