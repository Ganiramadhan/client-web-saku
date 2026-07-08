import { type ComponentType } from 'react'
import {
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingLibrary,
  HiOutlineCreditCard,
  HiOutlineUserGroup,
  HiOutlineWallet,
} from 'react-icons/hi2'
import type { WalletType } from '@/types/api'

export type LegacyWalletType = 'personal' | 'business' | 'shared'

export const TYPE_THEME: Record<
  WalletType,
  {
    Icon: ComponentType<{ className?: string }>
    iconBg: string
    iconText: string
    dot: string
    border: string
  }
> = {
  cash: {
    Icon: HiOutlineBanknotes,
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100',
  },
  bank_account: {
    Icon: HiOutlineBuildingLibrary,
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-700',
    dot: 'bg-sky-500',
    border: 'border-sky-100',
  },
  e_wallet: {
    Icon: HiOutlineWallet,
    iconBg: 'bg-brand-50',
    iconText: 'text-brand-700',
    dot: 'bg-brand-500',
    border: 'border-brand-100',
  },
  credit_card: {
    Icon: HiOutlineCreditCard,
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-100',
  },
  investment: {
    Icon: HiOutlineBuildingOffice2,
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-700',
    dot: 'bg-violet-500',
    border: 'border-violet-100',
  },
  savings: {
    Icon: HiOutlineUserGroup,
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-100',
  },
}

export const WALLET_TYPE_OPTIONS: { value: WalletType; label: string; description: string; example: string }[] = [
  { value: 'cash', label: 'Cash', description: 'Uang tunai yang disimpan secara fisik.', example: 'Dompet fisik, uang kas kecil' },
  { value: 'bank_account', label: 'Bank', description: 'Rekening utama atau kantong bank.', example: 'BCA, BRI, Mandiri, BNI, CIMB, Jago, Blu' },
  { value: 'e_wallet', label: 'E-Wallet', description: 'Saldo aplikasi pembayaran digital.', example: 'GoPay, OVO, DANA, ShopeePay, LinkAja, AstraPay' },
  { value: 'credit_card', label: 'Kartu Kredit', description: 'Limit kartu kredit atau paylater yang perlu dipantau tagihannya.', example: 'Visa, Mastercard, PayLater' },
  { value: 'savings', label: 'Tabungan', description: 'Kantong khusus untuk tujuan atau rencana tertentu.', example: 'Dana darurat, liburan, self reward' },
  { value: 'investment', label: 'Investasi', description: 'Aset investasi yang ingin dipantau sebagai bagian dari kekayaan.', example: 'Saham, Reksa Dana, ETF, Deposito, Emas' },
]
