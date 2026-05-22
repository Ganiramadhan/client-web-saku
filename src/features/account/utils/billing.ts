import type { BillingCycle, UpcomingBilling } from '@/features/billing/api'

export function billingCycleLabel(cycle: BillingCycle): string {
  if (cycle === 'weekly') return 'Mingguan'
  if (cycle === 'yearly') return 'Tahunan'
  return 'Bulanan'
}

export function nextBillingDate(item: UpcomingBilling): Date {
  const date = new Date(item.due_date)
  if (item.cycle === 'weekly') date.setDate(date.getDate() + 7)
  else if (item.cycle === 'yearly') date.setFullYear(date.getFullYear() + 1)
  else date.setMonth(date.getMonth() + 1)
  return date
}

export function sanitizeReferralCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}
