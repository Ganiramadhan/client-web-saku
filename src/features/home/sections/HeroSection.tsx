import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowTrendingUp } from 'react-icons/hi2'
import { RiArrowDownLine, RiArrowRightLine, RiArrowUpLine, RiChatSmile3Line, RiPieChart2Line, RiScanLine, RiShieldCheckLine, RiSparklingLine, RiTimeLine, RiWallet3Line } from 'react-icons/ri'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { smoothScrollTo } from '../components/landingUtils'

export function HeroSection({ isAuthed }: { isAuthed: boolean }) {
  const t = useT()
  const [isMobile, setIsMobile] = useState(() => (
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 767px)').matches
  ))

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <section id="home" className="relative overflow-hidden py-16 sm:py-24">
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-100/60">
            <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
            {t.landing.heroEyebrow}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-[3.8rem] leading-[1.06]">
            {t.landing.heroTitle.split(' ').slice(0, -2).join(' ')}<br />
            <span className="relative inline-block">
              <span className="text-brand-600">{t.landing.heroTitle.split(' ').slice(-2).join(' ')}</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 280 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 7.5C50 3 100 1.5 140 3C180 4.5 230 6 278 4" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5"/>
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-500 sm:text-[17px]">
            {t.landing.heroDesc}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={isAuthed ? '/app' : '/register'}>
              <button className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-500">
                {t.landing.ctaPrimary} <RiArrowRightLine className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <button onClick={() => smoothScrollTo('how-it-works')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-7 py-3.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-white hover:text-slate-900">
              {t.landing.ctaSecondary}
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { Icon: RiChatSmile3Line, value: 'NLP', label: 'Chat to record', color: 'text-blue-600', bg: 'rgba(239,246,255,0.80)' },
              { Icon: RiScanLine, value: 'AI OCR', label: 'Receipt scanner', color: 'text-violet-600', bg: 'rgba(245,243,255,0.80)' },
              { Icon: RiTimeLine, value: '24/7', label: 'Always available', color: 'text-emerald-600', bg: 'rgba(236,253,245,0.80)' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-sm shadow-slate-200/50">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', s.color)} style={{ background: s.bg }}>
                  <s.Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className={cn('text-xs font-extrabold', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <HeroPreview isMobile={isMobile} />
        </div>
      </div>
    </section>
  )
}

function HeroPreview({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return <MobileHeroPreview />
  }

  return <DesktopHeroPreview />
}

function MobileHeroPreview() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70 md:hidden">
        <div className="rounded-[1.35rem] bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Balance</p>
              <h2 className="mt-1.5 text-2xl font-extrabold text-slate-900 tracking-tight">Rp 24.580.000</h2>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <HiOutlineArrowTrendingUp className="h-3 w-3" />+12.4%
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-[11px] text-slate-500">Income</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">Rp 9.2jt</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="text-[11px] text-slate-500">Expenses</p>
              <p className="mt-1 text-sm font-bold text-rose-500">Rp 3.8jt</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[11px] font-bold text-blue-700">AI Insight</p>
            </div>
            <p className="text-[11px] leading-5 text-blue-700/80">Transport spending is 18% higher than last month.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DesktopHeroPreview() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70">
        <div className="rounded-[1.35rem] bg-slate-50 p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Balance</p>
              <h2 className="mt-1.5 text-3xl font-extrabold text-slate-900 tracking-tight">Rp 24.580.000</h2>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-emerald-700" style={{ background: 'rgba(209,250,229,0.80)', border: '1px solid rgba(167,243,208,0.80)' }}>
              <HiOutlineArrowTrendingUp className="h-3 w-3" />+12.4%
            </span>
          </div>
          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              { label: 'Income', value: 'Rp 9.200.000', color: 'text-emerald-600', bg: 'rgba(209,250,229,0.50)', border: 'rgba(167,243,208,0.60)', Icon: RiArrowUpLine },
              { label: 'Expenses', value: 'Rp 3.800.000', color: 'text-rose-500', bg: 'rgba(255,228,230,0.50)', border: 'rgba(254,205,211,0.60)', Icon: RiArrowDownLine },
            ].map((c) => (
              <div key={c.label} className="rounded-xl p-3.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <c.Icon className={cn('h-3 w-3', c.color)} />
                  <p className="text-[11px] text-slate-500">{c.label}</p>
                </div>
                <p className={cn('text-sm font-bold', c.color)}>{c.value}</p>
              </div>
            ))}
          </div>
          {/* Budget bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">Budget used this month</p>
              <p className="text-[11px] font-bold text-slate-600">64%</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: '64%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
            </div>
          </div>
          {/* Wallet summary */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {[
              { Icon: RiWallet3Line, label: 'Wallets', value: '4 active', color: 'text-blue-600', bg: '#eff6ff' },
              { Icon: RiPieChart2Line, label: 'Budget left', value: '36%', color: 'text-violet-600', bg: '#f5f3ff' },
              { Icon: RiShieldCheckLine, label: 'Savings', value: 'Rp 7.2jt', color: 'text-emerald-600', bg: '#ecfdf5' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: item.bg }}>
                  <item.Icon className={cn('h-4 w-4', item.color)} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
          {/* Recent */}
          <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(241,245,249,1)' }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Recent Activity</p>
              <p className="text-[11px] text-blue-500 font-medium cursor-pointer">See all</p>
            </div>
            <div className="space-y-2.5">
              <TxRow icon="🍜" title="Lunch" cat="Food & Drink" amount="-Rp 38.000" />
              <TxRow icon="🚌" title="Transport" cat="Travel" amount="-Rp 22.500" />
              <TxRow icon="💻" title="Freelance" cat="Income" amount="+Rp 5.500.000" positive />
            </div>
          </div>
          {/* AI insight */}
          <div className="mt-3 rounded-xl p-3.5" style={{ background: 'rgba(239,246,255,0.85)', border: '1px solid rgba(191,219,254,0.60)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[11px] font-bold text-blue-700">AI Insight</p>
            </div>
            <p className="text-[11px] leading-5 text-blue-600/80">Transport spending is 18% higher than last month. Consider reviewing recurring trips.</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button type="button" className="rounded-xl border border-blue-100 bg-blue-600 px-3 py-2.5 text-xs font-bold text-white">
              Record with AI
            </button>
            <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
              Scan receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TxRow({ icon, title, cat, amount, positive = false }: { icon: string; title: string; cat: string; amount: string; positive?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-slate-400">{cat}</p>
      </div>
      <p className={cn('text-sm font-bold tabular-nums shrink-0', positive ? 'text-emerald-600' : 'text-slate-700')}>{amount}</p>
    </div>
  )
}
