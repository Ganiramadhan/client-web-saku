import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function MobileFab({
  label,
  icon,
  onClick,
  href,
  className,
}: {
  label: string
  icon: ReactNode
  onClick?: () => void
  href?: string
  className?: string
}) {
  const baseClass = cn(
    'fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-900/20 transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-900/25 active:translate-y-0 active:scale-95 sm:hidden',
    className,
  )

  if (href) {
    return (
      <Link to={href} className={baseClass} aria-label={label} title={label}>
        {icon}
      </Link>
    )
  }

  return (
    <button type="button" className={baseClass} onClick={onClick} aria-label={label} title={label}>
      {icon}
    </button>
  )
}
