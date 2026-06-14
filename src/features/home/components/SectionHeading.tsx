import { RiFlashlightLine } from 'react-icons/ri'

export function SectionHeading({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#17120f] bg-[#fddf82] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#17120f] shadow-[3px_3px_0_#17120f]">
        <RiFlashlightLine className="h-3 w-3" />{label}
      </span>
      <h2 className="mt-5 text-3xl font-black tracking-tight text-[#17120f] sm:text-5xl leading-[1.02]">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-[#4f4540]">{description}</p>}
    </div>
  )
}
