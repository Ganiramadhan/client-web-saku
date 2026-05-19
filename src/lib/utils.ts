import clsx, { type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'IDR', locale = 'id-ID'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`
  }
}

export function formatDate(input: string | Date, locale = 'id-ID'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(input: string | Date, locale = 'id-ID'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

/* ─── Rupiah helpers (no decimals, dot thousands separator) ─────── */

export function formatRupiah(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}

/** Strip everything but digits and convert to a number (0 if empty). */
export function parseRupiah(s: string): number {
  const digits = s.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}
