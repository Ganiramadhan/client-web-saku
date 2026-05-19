import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({
  size = 'md',
  withText = true,
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
  className?: string
}) {
  const dim =
    size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const text =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 group', className)}>
      <span
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm ring-1 ring-brand-500/20 transition group-hover:shadow-md',
          dim,
        )}
      >
        <img src="/icon-saku.ico" alt="SAKU" className="h-full w-full object-cover" />
      </span>
      {withText ? (
        <span
          className={cn(
            'font-bold tracking-tight text-slate-900 transition group-hover:text-brand-700',
            text,
          )}
        >
          SAKU
        </span>
      ) : null}
    </Link>
  )
}
