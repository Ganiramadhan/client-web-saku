import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PrimaryBtn({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-200/60 transition-all duration-200 hover:-translate-y-px hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-300/50 active:translate-y-0', className)}>
      {children}
    </button>
  )
}
