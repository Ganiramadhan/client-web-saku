import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { formatRupiah, parseRupiah } from '@/lib/utils'

export { DataTable, type DataTableProps, type DataTableLabels } from './DataTable'
export { AdminDataTable } from './AdminDataTable'
export { DataListPagination } from './DataListPagination'
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
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl border font-black cursor-pointer transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100'

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  const variants: Record<ButtonVariant, string> = {
    primary:
      'border-[#17120f]/20 bg-brand-300 text-[#17120f] shadow-sm shadow-[#17120f]/10 hover:bg-brand-200 hover:shadow-md focus:ring-brand-500/30',

    secondary:
      'border-[#17120f]/15 bg-[#17120f] text-white shadow-sm shadow-[#17120f]/10 hover:bg-[#2a211d] hover:shadow-md focus:ring-slate-500/30',

    outline:
      'border-[#17120f]/16 bg-[#fffaf6] text-[#17120f] shadow-sm shadow-[#17120f]/5 hover:bg-[#fddf82]/70 hover:shadow-md focus:ring-slate-300/30',

    ghost:
      'border-transparent bg-transparent text-[#17120f] shadow-none hover:border-[#17120f]/12 hover:bg-[#fffaf6]/80 hover:shadow-sm focus:ring-slate-300/30',

    danger:
      'border-[#b4533f]/18 bg-[#ffe4dc] text-[#7f2d23] shadow-sm shadow-[#b4533f]/8 hover:bg-[#ffd3c7] hover:text-[#6f241b] hover:shadow-md focus:ring-[#ff9d8d]/35',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
      ) : (
        leftIcon
      )}

      {!loading && children}

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
        <span className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label}
        </span>
      ) : null}

      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 shadow-sm backdrop-blur-xl transition-all duration-150 placeholder:text-slate-400',
          'bg-[#fffaf6] hover:bg-white focus:outline-none',
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-[#17120f]/18 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/18',
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
          'w-full rounded-xl border bg-[#fffaf6] px-3 py-2.5 text-sm shadow-sm transition',
          'focus:outline-none',
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-[#17120f]/18 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/18',
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

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, className, ...rest },
    ref,
  ) {
    return (
      <label className="block">
        {label ? (
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            {label}
          </span>
        ) : null}

        <textarea
          ref={ref}
          rows={3}
          className={cn(
            `
            w-full
            rounded-xl
            border
            px-3
            py-2.5
            text-sm
            text-slate-900
            shadow-sm
            transition-all
            duration-150

            placeholder:text-slate-400

            hover:bg-white

            focus:outline-none
            focus:ring-2
            resize-none
            `,

            error
              ? `
                border-rose-300
                bg-white/80
                focus:border-rose-500
                focus:ring-rose-500/30
              `
              : `
                border-[#17120f]/18
                bg-[#fffaf6]
                focus:border-brand-300
                focus:ring-brand-500/18
              `,

            className,
          )}
          {...rest}
        />

        {error ? (
          <span className="mt-1 block text-xs text-rose-600">
            {error}
          </span>
        ) : null}
      </label>
    )
  },
)

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[1.5rem] border border-[#17120f]/14 bg-[#fffaf6]/92 p-6 shadow-[0_18px_45px_rgba(23,18,15,0.08)] transition-all duration-300',
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
    gray: 'border border-[#17120f]/12 bg-[#fffaf6] text-[#17120f]',
    green: 'border border-emerald-200 bg-emerald-100 text-emerald-900',
    red: 'border border-rose-200 bg-rose-100 text-rose-900',
    amber: 'border border-[#17120f]/12 bg-[#fddf82]/75 text-[#17120f]',
    blue: 'border border-brand-200 bg-brand-100 text-[#17120f]',
    violet: 'border border-violet-200 bg-violet-100 text-violet-900',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black',
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
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[#17120f]/20 bg-[#fffaf6]/80 px-6 py-12 text-center shadow-sm shadow-[#17120f]/5">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#17120f]/15 bg-brand-100 text-[#17120f]">
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
        <h1 className="text-2xl font-black tracking-tight text-[#17120f]">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
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
  mobilePlacement = 'bottom',
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  mobilePlacement?: 'bottom' | 'center'
}) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    document.body.classList.add('saku-modal-open')
    return () => {
      document.body.classList.remove('saku-modal-open')
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null
  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center sm:items-center sm:p-4',
        mobilePlacement === 'center'
          ? 'items-center p-4'
          : 'items-end p-0',
      )}
    >
      <div
        className="animate-overlay-in absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-panel-in relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden border border-[#17120f]/12 bg-[#fffaf6] shadow-[0_24px_70px_rgba(23,18,15,0.16)]',
          mobilePlacement === 'center' ? 'rounded-2xl' : 'rounded-t-2xl sm:rounded-2xl',
          widths[size],
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-[#17120f]/10 px-6 py-4">
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
          <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-[#17120f]/10 bg-[#f6eee8]/70 px-6 py-3 sm:flex-row sm:items-center">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
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
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const pages = buildPaginationPages(safePage, totalPages)

  return (
    <div className="mt-4 flex flex-col gap-3 px-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page <strong>{safePage}</strong> / {totalPages}
      </span>
      <div className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/45 p-1 shadow-sm shadow-slate-200/40 backdrop-blur-md sm:w-auto sm:flex-wrap sm:overflow-visible">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onChange(1)}
          className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent px-3 text-xs font-semibold text-slate-600 transition-all duration-200 ease-out hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
        >
          <span className="sm:hidden">First</span>
          <span className="hidden sm:inline">First page</span>
        </button>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onChange(safePage - 1)}
          className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent px-3 text-xs font-semibold text-slate-600 transition-all duration-200 ease-out hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
        >
          Prev
        </button>
        {pages.map((item, index) =>
          item === '...' ? (
            <span key={`gap-${index}`} className="inline-flex h-8 shrink-0 items-center rounded-lg px-2 text-xs font-bold text-slate-400" aria-hidden>
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === safePage ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 shrink-0 rounded-lg border px-2 text-xs font-semibold transition-all duration-200 ease-out',
                item === safePage
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-200/50'
                  : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm',
                item !== safePage && 'max-sm:hidden',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onChange(safePage + 1)}
          className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent px-3 text-xs font-semibold text-slate-600 transition-all duration-200 ease-out hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
        >
          Next
        </button>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onChange(totalPages)}
          className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent px-3 text-xs font-semibold text-slate-600 transition-all duration-200 ease-out hover:border-white/70 hover:bg-white/70 hover:text-brand-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:shadow-none"
        >
          <span className="sm:hidden">Last</span>
          <span className="hidden sm:inline">Last page</span>
        </button>
      </div>
    </div>
  )
}

function buildPaginationPages(page: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = new Set<number>([page - 1, page, page + 1])
  if (page <= 2) {
    pages.add(1)
    pages.add(2)
    pages.add(3)
  }
  if (page >= totalPages - 1) {
    pages.add(totalPages - 2)
    pages.add(totalPages - 1)
    pages.add(totalPages)
  }
  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)
  const out: Array<number | '...'> = []
  if ((sorted[0] ?? 1) > 1) out.push('...')
  for (const item of sorted) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number' && item - prev > 1) out.push('...')
    out.push(item)
  }
  if ((sorted[sorted.length - 1] ?? totalPages) < totalPages) out.push('...')
  return out
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
