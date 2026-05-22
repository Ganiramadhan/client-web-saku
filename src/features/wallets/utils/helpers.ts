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

export function labelForType(type?: string): string {
  const normalized = normalizeWalletType(type)
  return WALLET_TYPE_OPTIONS.find((option) => option.value === normalized)?.label ?? 'Dompet'
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

export function formatRelativeFromMs(ms: number | null): string {
  if (!ms) return 'Belum ada aktivitas'

  const diff = Date.now() - ms

  if (diff < 60_000) return 'Baru saja'

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`

  return new Date(ms).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  })
}
