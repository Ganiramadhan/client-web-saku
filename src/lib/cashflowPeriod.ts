export const CASHFLOW_START_DAY_KEY = 'saku-cashflow-start-day'
export const CASHFLOW_START_DAY_EVENT = 'saku-cashflow-start-day-change'
export const DEFAULT_CASHFLOW_START_DAY = 1

export interface CashflowPeriod {
  start: Date
  nextStart: Date
  end: Date
  cycleDays: number
  elapsedDays: number
  remainingDays: number
}

export function readCashflowStartDay(): number {
  if (typeof window === 'undefined') return DEFAULT_CASHFLOW_START_DAY
  return normalizeCashflowStartDay(window.localStorage.getItem(CASHFLOW_START_DAY_KEY))
}

export function writeCashflowStartDay(day: number): number {
  const normalized = normalizeCashflowStartDay(day)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CASHFLOW_START_DAY_KEY, String(normalized))
    window.dispatchEvent(new CustomEvent(CASHFLOW_START_DAY_EVENT, { detail: normalized }))
  }
  return normalized
}

export function normalizeCashflowStartDay(value: unknown): number {
  const day = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(day)) return DEFAULT_CASHFLOW_START_DAY
  return Math.min(31, Math.max(1, Math.round(day)))
}

export function getCashflowPeriod(reference: Date, startDay: number): CashflowPeriod {
  const normalizedDay = normalizeCashflowStartDay(startDay)
  const startCandidate = dateForMonthDay(reference.getFullYear(), reference.getMonth(), normalizedDay)
  const start = reference.getTime() >= startCandidate.getTime()
    ? startCandidate
    : dateForMonthDay(reference.getFullYear(), reference.getMonth() - 1, normalizedDay)
  const nextStart = dateForMonthDay(start.getFullYear(), start.getMonth() + 1, normalizedDay)
  const end = new Date(nextStart.getTime() - 1)
  const startOfToday = startOfDay(reference)
  const cycleDays = Math.max(1, daysBetween(start, nextStart))
  const elapsedDays = Math.min(cycleDays, Math.max(1, daysBetween(start, startOfToday) + 1))
  const remainingDays = Math.max(1, cycleDays - elapsedDays + 1)

  return { start, nextStart, end, cycleDays, elapsedDays, remainingDays }
}

export function formatCashflowPeriod(period: CashflowPeriod, locale: 'id' | 'en'): string {
  return `${formatPeriodDate(period.start, locale)} - ${formatPeriodDate(period.end, locale)}`
}

function dateForMonthDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDay), 0, 0, 0, 0)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function daysBetween(from: Date, to: Date): number {
  const fromDay = startOfDay(from).getTime()
  const toDay = startOfDay(to).getTime()
  return Math.round((toDay - fromDay) / 86_400_000)
}

function formatPeriodDate(date: Date, locale: 'id' | 'en'): string {
  return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit',
    month: 'short',
  })
}
