import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({
  size = 'md',
  className,
  withText = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  withText?: boolean
}) {
  const logoSize =
    size === 'sm'
      ? withText ? 'h-12' : 'h-10'
      : size === 'lg'
      ? 'h-20'
      : 'h-16'

  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center group',
        className,
      )}
    >
      <img
        src="/logo.png"
        alt="SAKU"
        className={cn(
          logoSize,
          withText ? 'w-auto' : 'w-10',
          'object-contain transition-all duration-200 group-hover:scale-105'
        )}
        draggable={false}
      />
    </Link>
  )
}
