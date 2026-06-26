import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RiArrowRightLine,
  RiChatSmile3Line,
  RiReceiptLine,
  RiSparklingLine,
  RiWallet3Line,
} from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { smoothScrollTo } from '../components/landingUtils'

export function HeroSection({ isAuthed }: { isAuthed: boolean }) {
  const { locale } = useLocale()
  const isId = locale === 'id'

  const copy = isId
    ? {
        eyebrow: 'Asisten keuangan harian berbasis AI',
        title: 'Uang harian lebih kebaca, tanpa spreadsheet.',
        accent: 'Catat lewat chat, scan struk, lalu lihat pola pengeluaranmu.',
        desc: 'SAKU membantu mahasiswa, karyawan, dan freelancer mencatat transaksi lebih cepat, mengelola banyak wallet, dan mengambil keputusan belanja dengan lebih tenang.',
        primary: 'Mulai Gratis',
        secondary: 'Lihat Cara Kerja',
      }
    : {
        eyebrow: 'AI-powered personal finance assistant',
        title: 'Make daily money easier to understand.',
        accent: 'Chat transactions, scan receipts, then see your spending patterns.',
        desc: 'SAKU helps students, employees, and freelancers track money faster, manage multiple wallets, and make calmer spending decisions.',
        primary: 'Start Free',
        secondary: 'See How It Works',
      }

  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(max-width: 767px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)

    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <section
      id="home"
      className="relative overflow-hidden pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-28 lg:pt-12"
    >
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16 lg:px-8 xl:gap-20">
        <div className="relative pt-7 lg:pt-10 xl:pt-12">
          <div className="inline-flex rotate-[-1deg] items-center gap-2 rounded-full border border-[#17120f]/60 bg-[#fddf82] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#17120f] shadow-[0_10px_24px_rgba(23,18,15,0.08)]">
            <RiSparklingLine className="h-3.5 w-3.5" />
            {copy.eyebrow}
          </div>

          <h1 className="mt-7 max-w-3xl text-[2.2rem] font-black leading-[0.94] tracking-[-0.05em] text-[#17120f] sm:text-[3.2rem] lg:text-[3.9rem] xl:text-[4.2rem]">
            {copy.title}
          </h1>

          <p className="mt-6 max-w-xl text-lg font-black leading-tight text-brand-600 sm:text-xl">
            {copy.accent}
          </p>

          <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#4f4540] sm:text-base">
            {copy.desc}
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link to={isAuthed ? '/app' : '/register'}>
              <button className="saku-primary-action group inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black transition-all duration-200">
                {copy.primary}
                <RiArrowRightLine className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <button
              onClick={() => smoothScrollTo('how-it-works')}
              className="saku-secondary-action inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black transition-all duration-200"
            >
              {copy.secondary}
            </button>
          </div>
        </div>

        <div className="relative mt-4 lg:mt-3 lg:justify-self-end xl:mt-5">
          <DoodleBubble
            className="right-0 top-4 hidden rotate-6 lg:block"
            label="Rp"
          />

          <HeroPreview isMobile={isMobile} isId={isId} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => smoothScrollTo('features')}
        className="absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#4f4540]/70 transition hover:text-brand-700 lg:flex"
        aria-label={isId ? 'Scroll ke fitur' : 'Scroll to features'}
      >
        <span>{isId ? 'Scroll' : 'Scroll'}</span>
        <span className="grid h-9 w-6 animate-bounce place-items-start rounded-full border-2 border-[#17120f]/40 bg-[#fffaf6] p-1 shadow-sm shadow-[#17120f]/10">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
        </span>
      </button>
    </section>
  )
}

function HeroPreview({ isMobile, isId }: { isMobile: boolean; isId: boolean }) {
  return (
    <div className="relative mx-auto mt-4 max-w-[680px] lg:mt-0 xl:mt-0">
      <div className="saku-coral-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-[50%_45%_55%_40%] border border-[#17120f]/30 bg-[#fffaf6]/70" />
        <div className="absolute -bottom-7 left-8 h-20 w-20 rotate-12 rounded-[1.5rem] border border-[#17120f]/30 bg-[#fddf82]/70" />

        <div className="relative grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-[saku-float_6s_ease-in-out_infinite] rounded-[1.5rem] border border-[#17120f]/60 bg-[#fffaf6] p-4 shadow-[0_16px_38px_rgba(23,18,15,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#4f4540]">
                  {isId ? 'Saldo terbaca' : 'Readable balance'}
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-tight text-[#17120f] sm:text-4xl">
                  Rp 4.820.000
                </h2>
              </div>

              <span className="rounded-full border border-[#17120f]/50 bg-emerald-100 px-3 py-1 text-xs font-black text-[#17120f]">
                +18%
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                [RiChatSmile3Line, isId ? 'Chat' : 'Chat', '35rb'],
                [RiReceiptLine, isId ? 'Struk' : 'Receipt', '18'],
                [RiWallet3Line, 'Wallet', '5'],
              ].map(([Icon, label, value]) => {
                const I = Icon as typeof RiChatSmile3Line

                return (
                  <div
                    key={label as string}
                    className="rounded-2xl border border-[#17120f]/35 bg-[#f6eee8] p-3 text-center"
                  >
                    <I className="mx-auto h-5 w-5 text-[#17120f]" />

                    <p className="mt-2 text-[11px] font-black text-[#4f4540]">
                      {label as string}
                    </p>

                    <p className="text-sm font-black text-[#17120f]">
                      {value as string}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[#17120f]/45 bg-[#fddf82] p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-[#17120f]">
                <span>{isId ? 'Budget makan' : 'Food budget'}</span>
                <span>72%</span>
              </div>

              <div className="h-3 rounded-full border border-[#17120f]/45 bg-[#fffaf6]">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: '72%' }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-[#17120f]/70 bg-[#17120f] p-4 text-white shadow-[0_16px_38px_rgba(23,18,15,0.12)]">
              <div className="flex items-center gap-2">
                <RiSparklingLine className="h-5 w-5 text-brand-300" />

                <p className="text-xs font-black uppercase tracking-widest text-brand-100">
                  AI Insight
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/80">
                {isId
                  ? 'Ruang belanja aman hari ini sekitar Rp185rb.'
                  : 'Safe spending room today is around Rp185k.'}
              </p>
            </div>

            <div className="animate-[saku-float_7s_ease-in-out_infinite_0.6s] rounded-[1.5rem] border border-[#17120f]/60 bg-[#fffaf6] p-4 shadow-[0_16px_38px_rgba(23,18,15,0.10)]">
              <p className="text-xs font-black uppercase tracking-widest text-[#4f4540]">
                {isId ? 'Preview chat' : 'Chat preview'}
              </p>

              <div className="mt-3 rounded-2xl border border-[#17120f]/40 bg-[#f6eee8] px-3 py-2 text-sm font-black text-[#17120f]">
                beli nasi padang 35rb
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#17120f]/40 bg-brand-100 px-3 py-2">
                <span className="text-sm font-black text-[#17120f]">
                  {isId ? 'Makanan' : 'Food'}
                </span>

                <span className="text-sm font-black text-[#17120f]">
                  -Rp35.000
                </span>
              </div>
            </div>
          </div>
        </div>

        {!isMobile ? (
          <div className="relative mt-4 flex items-center justify-between border-t border-[#17120f]/25 pt-4 text-xs font-black text-[#17120f]">
            <span>{isId ? 'Chat AI' : 'AI Chat'}</span>
            <span>{isId ? 'Scan Struk' : 'Receipt Scan'}</span>
            <span>{isId ? 'Insight Harian' : 'Daily Insight'}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DoodleBubble({
  className,
  label,
  small = false,
}: {
  className?: string
  label: string
  small?: boolean
}) {
  return (
    <svg
      className={`pointer-events-none absolute z-20 ${
        small ? 'h-20 w-24' : 'h-28 w-36'
      } ${className ?? ''}`}
      viewBox="0 0 140 100"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="saku-doodle-line"
        d="M20 30C30 10 92 8 118 25C136 37 131 66 106 76C78 86 44 81 28 66C15 55 11 42 20 30Z"
        fill="#fffaf6"
        strokeWidth="3"
      />

      <path
        className="saku-doodle-line"
        d="M34 67L28 84L46 73"
        fill="#fffaf6"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        className="saku-doodle-line"
        d="M24 18L28 26L36 30L28 34L24 42L20 34L12 30L20 26Z"
        fill="#fddf82"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <path
        className="saku-doodle-line"
        d="M112 14L115 20L122 23L115 26L112 33L109 26L102 23L109 20Z"
        fill="#ff9d8d"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <text
        x="70"
        y="58"
        textAnchor="middle"
        fontSize={small ? '22' : '28'}
        fontWeight="900"
        fill="#ff6f61"
      >
        {label}
      </text>
    </svg>
  )
}

export default HeroSection
