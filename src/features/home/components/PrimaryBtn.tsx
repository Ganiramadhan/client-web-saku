import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PrimaryBtn({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('group inline-flex items-center gap-2 rounded-2xl border-2 border-[#17120f] bg-brand-500 px-5 py-2.5 text-sm font-black text-[#17120f] shadow-[4px_4px_0_#17120f] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[7px_7px_0_#17120f] active:translate-x-0 active:translate-y-0', className)}>
      {children}
    </button>
  )
}
