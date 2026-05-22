import { Link } from 'react-router-dom'
import { HiOutlineArrowTrendingUp } from 'react-icons/hi2'
import { RiArrowDownLine, RiArrowRightLine, RiArrowUpLine, RiChatSmile3Line, RiScanLine, RiShieldCheckLine, RiSparklingLine, RiTimeLine } from 'react-icons/ri'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { smoothScrollTo } from '../components/landingUtils'

export function HeroSection({ isAuthed }: { isAuthed: boolean }) {
  const t = useT()
  return (
    <section id="home" className="relative overflow-hidden py-16 sm:py-24">
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8">
        <div className="animate-[fadeInUp_0.7s_ease_forwards]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-blue-700" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(191,219,254,0.70)', boxShadow: '0 2px 12px rgba(59,130,246,0.10)' }}>
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
            <button onClick={() => smoothScrollTo('how-it-works')} className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,232,240,0.80)' }}>
              {t.landing.ctaSecondary}
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { Icon: RiChatSmile3Line, value: 'NLP', label: 'Chat to record', color: 'text-blue-600', bg: 'rgba(239,246,255,0.80)' },
              { Icon: RiScanLine, value: 'AI OCR', label: 'Receipt scanner', color: 'text-violet-600', bg: 'rgba(245,243,255,0.80)' },
              { Icon: RiTimeLine, value: '24/7', label: 'Always available', color: 'text-emerald-600', bg: 'rgba(236,253,245,0.80)' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,232,240,0.70)' }}>
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
        <div className="animate-[fadeInUp_0.7s_ease_0.2s_forwards] opacity-0">
          <HeroPreview />
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes floatY { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
        @keyframes shimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </section>
  )
}

function HeroPreview() {
  return (
    <div className="relative" style={{ animation: 'floatY 6s ease-in-out infinite' }}>
      <div className="pointer-events-none absolute inset-[-40px] -z-10 rounded-[3rem] opacity-60 blur-3xl" style={{ background: 'radial-gradient(ellipse, #bfdbfe 0%, #e0e7ff 50%, transparent 75%)' }} />
      <div className="rounded-2xl p-1.5" style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 32px 80px rgba(0,0,0,0.10), 0 8px 24px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,1)' }}>
        <div className="rounded-[1.4rem] p-5" style={{ background: 'rgba(248,250,255,0.88)' }}>
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
        </div>
      </div>
      {/* Floating badges */}
      <div className="absolute -bottom-4 -left-6 hidden rounded-xl px-4 py-3 sm:flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', animation: 'floatY 7s ease-in-out 1s infinite' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600" style={{ border: '1px solid rgba(167,243,208,0.60)' }}>
          <RiShieldCheckLine className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Secure & Private</p>
          <p className="text-[10px] text-slate-400">Your data stays yours</p>
        </div>
      </div>
      <div className="absolute -top-4 -right-4 hidden rounded-xl px-4 py-2.5 sm:flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', animation: 'floatY 5s ease-in-out 2s infinite' }}>
        <RiSparklingLine className="h-4 w-4 text-amber-500" />
        <p className="text-xs font-bold text-slate-700">AI-powered insights</p>
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
