import { useEffect, useState } from 'react'
import { RiArrowRightLine, RiBrainLine, RiChatSmile3Line, RiPieChart2Line, RiRepeatLine, RiScanLine, RiWallet3Line } from 'react-icons/ri'
import { useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { SectionHeading } from '../components/SectionHeading'

export function FeaturesSection() {
  const t = useT()
  const { locale } = useLocale()
  const isId = locale === 'id'
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )
  const features = [
    {
      Icon: RiChatSmile3Line,
      title: isId ? 'Asisten Transaksi AI' : 'AI Transaction Assistant',
      desc: isId ? 'Catat transaksi dengan bahasa natural lewat chat AI.' : 'Record transactions naturally with AI-powered chat automation.',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
    },
    {
      Icon: RiScanLine,
      title: isId ? 'OCR Receipt Scanner' : 'OCR Receipt Scanner',
      desc: isId ? 'Scan struk dan review data transaksi yang diekstrak AI.' : 'Scan receipts instantly and review extracted transaction data.',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
    },
    {
      Icon: RiWallet3Line,
      title: isId ? 'Multiple Wallet' : 'Multiple Wallet',
      desc: isId ? 'Pantau cash, rekening, e-wallet, dan kantong tujuan dalam satu tempat.' : 'Track cash, bank accounts, e-wallets, and savings pockets in one workspace.',
      color: 'text-sky-600',
      bg: 'rgba(240,249,255,0.92)',
      border: 'rgba(186,230,253,0.75)',
    },
    {
      Icon: RiPieChart2Line,
      title: isId ? 'Budget Tracking' : 'Budget Tracking',
      desc: isId ? 'Tetapkan target, lihat sisa ruang belanja, dan cegah budget bocor.' : 'Set targets, see safe spending room, and prevent budget leaks.',
      color: 'text-emerald-600',
      bg: 'rgba(236,253,245,0.90)',
      border: 'rgba(167,243,208,0.70)',
    },
    {
      Icon: RiRepeatLine,
      title: isId ? 'Recurring Transaction' : 'Recurring Transactions',
      desc: isId ? 'Kelola transaksi berulang dan upcoming billing agar cashflow lebih mudah diprediksi.' : 'Manage recurring transactions and upcoming bills so cashflow is easier to predict.',
      color: 'text-amber-600',
      bg: 'rgba(255,251,235,0.90)',
      border: 'rgba(253,230,138,0.70)',
    },
    {
      Icon: RiBrainLine,
      title: isId ? 'Financial Insight' : 'Financial Insight',
      desc: isId ? 'Dapatkan ringkasan cashflow, pola pengeluaran, dan rekomendasi yang bisa ditindaklanjuti.' : 'Get cashflow summaries, spending patterns, and actionable recommendations.',
      color: 'text-indigo-600',
      bg: 'rgba(238,242,255,0.90)',
      border: 'rgba(199,210,254,0.70)',
    },
  ]

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.features}
          title={t.landing.featuresTitle}
          description={t.landing.featuresSubtitle}
        />

        {isMobile ? (
          <div className="mt-10 grid gap-2.5">
            {features.map((item, index) => (
              <div key={item.title} className="landing-mobile-hover rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md hover:shadow-blue-100/40">
                <div className="flex items-start gap-3">
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xs font-black', item.color)}>
                    <item.Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-300">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="text-sm font-extrabold text-slate-950">{item.title}</h3>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
            <div
              key={item.title}
              className="landing-mobile-hover group relative overflow-hidden rounded-3xl border border-white/80 bg-white/76 p-6 shadow-sm shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:bg-white/95 hover:shadow-xl hover:shadow-blue-100/40"
            >
              <div
                className={cn(
                'relative inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105',
                  item.color
                )}
                style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <item.Icon className="h-5 w-5" />
              </div>

              <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-blue-950">
                {item.title}
              </h3>

              <p className="relative mt-3 text-sm leading-6 text-slate-600">
                {item.desc}
              </p>

              <div className="relative mt-6 flex items-center gap-2 text-sm font-medium text-slate-400 transition-all duration-300 group-hover:text-slate-700">
                {isId ? 'Lihat fitur' : 'Explore feature'}
                <RiArrowRightLine className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
