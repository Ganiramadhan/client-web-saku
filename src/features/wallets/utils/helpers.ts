import type { Wallet, WalletType } from '@/types/api'
import { WALLET_TYPE_OPTIONS, type LegacyWalletType } from './constants'

export function normalizeWalletType(type?: string | null): WalletType {
  const legacyMap: Record<LegacyWalletType, WalletType> = {
    personal: 'cash',
    business: 'bank_account',
    shared: 'e_wallet',
  }
  if (type === 'personal' || type === 'business' || type === 'shared') return legacyMap[type]
  return WALLET_TYPE_OPTIONS.some((option) => option.value === type) ? (type as WalletType) : 'cash'
}

export function labelForType(type?: string, locale: 'id' | 'en' = 'id'): string {
  const normalized = normalizeWalletType(type)
  const labels: Record<WalletType, { id: string; en: string }> = {
    cash: { id: 'Uang Cash', en: 'Cash' },
    bank_account: { id: 'Rekening Bank', en: 'Bank Account' },
    e_wallet: { id: 'E-Wallet', en: 'E-Wallet' },
    credit_card: { id: 'Kartu Kredit', en: 'Credit Card' },
    savings: { id: 'Tabungan', en: 'Savings' },
    investment: { id: 'Investasi', en: 'Investment' },
  }
  return labels[normalized]?.[locale] ?? (locale === 'id' ? 'Dompet' : 'Wallet')
}

export function getTargetProgress(wallet: Wallet): number | null {
  const targetAmount = Number(wallet.target_amount ?? 0)
  if (!wallet.target_name && targetAmount <= 0) return null

  if (targetAmount <= 0) {
    return 0
  }

  return Math.min(
    100,
    Math.round((Number(wallet.balance ?? 0) / targetAmount) * 100),
  )
}

export function formatRelativeFromMs(ms: number | null, locale: 'id' | 'en' = 'id'): string {
  if (!ms) return locale === 'id' ? 'Belum ada aktivitas' : 'No activity yet'

  const diff = Date.now() - ms

  if (diff < 60_000) return locale === 'id' ? 'Baru saja' : 'Just now'

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return locale === 'id' ? `${minutes} menit lalu` : `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return locale === 'id' ? `${hours} jam lalu` : `${hours} hr ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return locale === 'id' ? `${days} hari lalu` : `${days} days ago`

  return new Date(ms).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit',
    month: 'short',
  })
}
