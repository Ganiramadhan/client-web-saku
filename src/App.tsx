import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppRoutes } from '@/routes'
import { useSEO } from '@/lib/seo'
import { initSessionActivity } from '@/lib/sessionActivity'
import { analyticsEvents, identifyAnalyticsUser, initAnalytics, trackEvent, trackPageView } from '@/lib/analytics'
import { useAuthStore } from '@/stores/authStore'

const PAGE_SEO: Array<{ pattern: RegExp; title: string; description: string; noIndex?: boolean }> = [
  { pattern: /^\/$/, title: 'SAKU — AI Financial Assistant Indonesia by Ganipedia', description: 'SAKU membantu mencatat transaksi, scan struk, wallet, budget, tagihan, dan insight cashflow pribadi dengan bantuan AI.' },
  { pattern: /^\/login/, title: 'Masuk', description: 'Masuk ke dashboard SAKU untuk mengelola keuangan pribadi.', noIndex: true },
  { pattern: /^\/register/, title: 'Daftar', description: 'Buat akun SAKU dan mulai mencatat keuangan pribadi.', noIndex: true },
  { pattern: /^\/forgot-password/, title: 'Reset Password', description: 'Pulihkan akses akun SAKU dengan OTP email.', noIndex: true },
  { pattern: /^\/privacy/, title: 'Privacy Policy', description: 'Kebijakan Privasi SAKU untuk data akun, transaksi, struk, analitik, keamanan, dan layanan pihak ketiga.' },
  { pattern: /^\/terms/, title: 'Terms of Service', description: 'Syarat penggunaan SAKU untuk pencatatan keuangan, AI, pembayaran, dan tanggung jawab pengguna.' },
  { pattern: /^\/cookies/, title: 'Cookies Policy', description: 'Kebijakan cookie SAKU untuk preferensi privasi, analytics, localStorage, dan pengalaman website.' },
  { pattern: /^\/contact/, title: 'Contact SAKU', description: 'Kontak resmi SAKU untuk bantuan akun, pembayaran, produk, dan laporan keamanan.' },
  { pattern: /^\/about/, title: 'About SAKU', description: 'Tentang SAKU, aplikasi personal finance untuk transaksi, wallet, budget, scan struk, dan insight AI.' },
  { pattern: /^\/blog/, title: 'SAKU Journal', description: 'Artikel SAKU tentang personal finance, AI financial assistant, wallet, budget, OCR receipt scanner, dan kebiasaan finansial pengguna Indonesia.' },
  { pattern: /^\/app\/transactions/, title: 'Transaksi', description: 'Kelola riwayat pemasukan dan pengeluaran di SAKU.', noIndex: true },
  { pattern: /^\/app\/wallets/, title: 'Dompet', description: 'Kelola dompet, saldo, dan kantong tujuan di SAKU.', noIndex: true },
  { pattern: /^\/app\/upcoming-billings/, title: 'Upcoming Billing', description: 'Pantau tagihan rutin dan jatuh tempo berikutnya.', noIndex: true },
  { pattern: /^\/app/, title: 'Dashboard', description: 'Ringkasan keuangan pribadi di SAKU.', noIndex: true },
]

export default function App() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  useEffect(() => {
    const stopSessionActivity = initSessionActivity()
    initAnalytics()
    return stopSessionActivity
  }, [])
  const match = PAGE_SEO.find((item) => item.pattern.test(location.pathname)) ?? PAGE_SEO[0]
  useSEO({
    title: match.title,
    description: match.description,
    noIndex: match.noIndex,
    canonical: `https://saku.ganipedia.com${location.pathname}`,
  })
  useEffect(() => {
    const path = `${location.pathname}${location.search}`
    trackPageView(path)
    if (location.pathname === '/') {
      trackEvent(analyticsEvents.landingPageViewed)
    }
  }, [location.pathname, location.search])
  useEffect(() => {
    identifyAnalyticsUser(user?.id, user?.role)
  }, [user?.id, user?.role])
  return <AppRoutes />
}
