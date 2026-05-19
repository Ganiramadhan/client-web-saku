import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { formatRupiah, parseRupiah } from '@/lib/utils'

export { DataTable, type DataTableProps } from './DataTable'
export { RSelect, type SelectOption } from './RSelect'
export { DateInput, type DateInputProps } from './DateInput'


type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...rest },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus:ring-brand-500/40',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500/40',
    outline:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-300/40',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300/40',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/40',
  }
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon ? rightIcon : null}
    </button>
  )
})


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
          className,
        )}
        {...rest}
      />
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
})


interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, children, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  )
})

/* ─── Textarea ─────────────────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
          className,
        )}
        {...rest}
      />
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  )
})


export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}


type BadgeTone = 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'violet'

export function Badge({
  children,
  tone = 'gray',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  const tones: Record<BadgeTone, string> = {
    gray: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}


export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}


export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}


export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}) {
  if (!open) return null
  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="animate-overlay-in absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-panel-in relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200',
          'rounded-t-2xl sm:rounded-2xl',
          widths[size],
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {description ? (
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="-m-1 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3 sm:flex-row sm:items-center">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ─── Skeleton / Shimmer ──────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md', className)} />
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md', className)} />
}

/* ─── Spinner ──────────────────────────────────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent',
        className,
      )}
    />
  )
}


export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        Page <strong>{page}</strong> / {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}


interface CurrencyInputProps {
  label?: string
  error?: string
  hint?: string
  value: number
  onChange: (n: number) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function CurrencyInput({
  label,
  error,
  hint,
  value,
  onChange,
  placeholder = '0',
  disabled,
  autoFocus,
  className,
}: CurrencyInputProps) {
  const display = value > 0 ? formatRupiah(value) : ''
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <div
        className={cn(
          'flex w-full items-stretch overflow-hidden rounded-lg border bg-white shadow-sm transition focus-within:ring-2',
          error
            ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-500/30'
            : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-500/30',
          disabled && 'opacity-60',
          className,
        )}
      >
        <span className="flex select-none items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
          Rp
        </span>
        <input
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={display}
          placeholder={placeholder}
          onChange={(e) => onChange(parseRupiah(e.target.value))}
          className="w-full bg-transparent px-3 py-2 text-left text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}
