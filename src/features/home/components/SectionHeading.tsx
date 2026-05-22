import { RiFlashlightLine } from 'react-icons/ri'

export function SectionHeading({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(191,219,254,0.60)', boxShadow: '0 2px 12px rgba(59,130,246,0.08)' }}>
        <RiFlashlightLine className="h-3 w-3" />{label}
      </span>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-slate-500">{description}</p>}
    </div>
  )
}
