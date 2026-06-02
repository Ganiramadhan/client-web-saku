import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppRoutes } from '@/routes'
import { useSEO } from '@/lib/seo'
import { initSessionActivity } from '@/lib/sessionActivity'

const PAGE_SEO: Array<{ pattern: RegExp; title: string; description: string; noIndex?: boolean }> = [
  { pattern: /^\/$/, title: 'SAKU — AI Financial Assistant', description: 'Kelola transaksi, scan struk, wallet, budget, tagihan, dan insight cashflow pribadi dengan bantuan AI.' },
  { pattern: /^\/login/, title: 'Masuk', description: 'Masuk ke dashboard SAKU untuk mengelola keuangan pribadi.', noIndex: true },
  { pattern: /^\/register/, title: 'Daftar', description: 'Buat akun SAKU dan mulai mencatat keuangan pribadi.', noIndex: true },
  { pattern: /^\/forgot-password/, title: 'Reset Password', description: 'Pulihkan akses akun SAKU dengan OTP email.', noIndex: true },
  { pattern: /^\/app\/transactions/, title: 'Transaksi', description: 'Kelola riwayat pemasukan dan pengeluaran di SAKU.', noIndex: true },
  { pattern: /^\/app\/wallets/, title: 'Dompet', description: 'Kelola dompet, saldo, dan kantong tujuan di SAKU.', noIndex: true },
  { pattern: /^\/app\/upcoming-billings/, title: 'Upcoming Billing', description: 'Pantau tagihan rutin dan jatuh tempo berikutnya.', noIndex: true },
  { pattern: /^\/app/, title: 'Dashboard', description: 'Ringkasan keuangan pribadi di SAKU.', noIndex: true },
]

export default function App() {
  const location = useLocation()
  useEffect(() => initSessionActivity(), [])
  const match = PAGE_SEO.find((item) => item.pattern.test(location.pathname)) ?? PAGE_SEO[0]
  useSEO({
    title: match.title,
    description: match.description,
    noIndex: match.noIndex,
    canonical: `https://saku.ganipedia.com${location.pathname}`,
  })
  return <AppRoutes />
}
