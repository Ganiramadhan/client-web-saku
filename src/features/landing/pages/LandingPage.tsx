import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  HiOutlineBars3,
  HiOutlineChevronDown,
  HiOutlineXMark,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineDocumentCheck,
  HiOutlineEye,
} from 'react-icons/hi2'
import {
  RiBarChartGroupedFill,
  RiPieChart2Line,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiSparklingLine,
  RiBankLine,
  RiInstagramLine,
  RiLinkedinLine,
  RiGithubLine,
  RiArrowRightLine,
  RiCheckLine,
  RiScales3Line,
  RiTimeLine,
  RiBrainLine,
  RiScanLine,
  RiReceiptLine,
  RiWalletLine,
  RiLineChartLine,
  RiCalendarEventLine,
  RiLockLine,
  RiChatSmile3Line,
  RiSendPlaneLine,
  RiFlashlightLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from 'react-icons/ri'
import { Logo } from '@/components/Logo'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, cn } from '@/lib/utils'
import { useLocale, useT } from '@/i18n'
import { subscriptionApi } from '@/features/subscription/api'

function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ─── Language Switcher ─────────────────────────────────────── */
const LANGUAGES = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇺🇸' }
]
function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const { locale, setLocale } = useLocale()
  const active = LANGUAGES.find((lang) => lang.code === locale) ?? LANGUAGES[0]
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change language"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2',
          'text-xs font-bold text-slate-600 transition-all duration-300',
          'hover:-translate-y-0.5 hover:text-blue-700 active:translate-y-0',
          open && 'text-blue-700'
        )}
        style={{
          background: open
            ? 'linear-gradient(135deg, rgba(239,246,255,0.96), rgba(255,255,255,0.88))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.74), rgba(248,250,252,0.56))',
          border: open
            ? '1px solid rgba(96,165,250,0.75)'
            : '1px solid rgba(226,232,240,0.9)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          boxShadow: open
            ? '0 14px 36px rgba(37,99,235,0.16), inset 0 1px 0 rgba(255,255,255,0.95)'
            : '0 8px 22px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
        }}
      >
        <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-400/10" />

        <span className="relative grid h-6 w-6 place-items-center rounded-full bg-white/85 text-sm shadow-sm ring-1 ring-slate-200/70">
          {active.flag}
        </span>

        <span className="relative tracking-[0.14em]">
          {active.code.toUpperCase()}
        </span>

        <HiOutlineChevronDown
          className={cn(
            'relative h-3.5 w-3.5 text-slate-400 transition-all duration-300 group-hover:text-blue-600',
            open && 'rotate-180 text-blue-600'
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-[1.4rem] p-2',
            'origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200'
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
            backdropFilter: 'blur(34px) saturate(180%)',
            WebkitBackdropFilter: 'blur(34px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.96)',
            boxShadow:
              '0 28px 80px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative px-3 pb-2 pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Select Language
            </p>
          </div>

          <div className="relative space-y-1">
            {LANGUAGES.map((lang) => {
              const isActive = active.code === lang.code

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code as typeof locale)
                    setOpen(false)
                  }}
                  className={cn(
                    'group/item flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm',
                    'transition-all duration-300',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/70'
                      : 'text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-2xl text-base transition-all duration-300',
                      isActive
                        ? 'bg-white/20 ring-1 ring-white/20'
                        : 'bg-slate-50 ring-1 ring-slate-200/70 group-hover/item:bg-blue-50'
                    )}
                  >
                    {lang.flag}
                  </span>

                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-bold">
                      {lang.label}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.16em]',
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      )}
                    >
                      {lang.code}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full transition-all duration-300',
                      isActive
                        ? 'scale-100 bg-white/20 opacity-100'
                        : 'scale-75 opacity-0 group-hover/item:scale-100 group-hover/item:opacity-100'
                    )}
                  >
                    {isActive ? (
                      <RiCheckLine className="h-4 w-4 text-white" />
                    ) : (
                      <RiArrowRightLine className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
/* ─── Main Page ─────────────────────────────────────────────── */
export function LandingPage() {
  const t = useT()
  const { locale } = useLocale()
  const isAuthed = useAuthStore((s) => Boolean(s.token))
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      const sections = ['home', 'features', 'how-it-works', 'pricing', 'faq']
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 140) { setActiveSection(id); break }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: 'home', label: 'Home' },
    { href: 'features', label: t.nav.features },
    { href: 'how-it-works', label: locale === 'id' ? 'Cara Kerja' : 'How It Works' },
    { href: 'pricing', label: t.nav.pricing },
    { href: 'faq', label: t.nav.faq },
  ]

  return (
    <div className="app-surface min-h-screen overflow-x-hidden font-sans antialiased">
      {/* Animated ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-20 h-[700px] w-[700px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.35) 0%, transparent 65%)' }} />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full animate-[pulse_10s_ease-in-out_infinite_2s]" style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)' }} />
        <div className="absolute bottom-1/4 left-1/4 h-[500px] w-[500px] rounded-full animate-[pulse_9s_ease-in-out_infinite_1s]" style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.22) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 right-1/3 h-[400px] w-[400px] rounded-full animate-[pulse_11s_ease-in-out_infinite_3s]" style={{ background: 'radial-gradient(circle, rgba(253,230,138,0.18) 0%, transparent 65%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* ── Floating Pill Navbar ── */}
      <header className="fixed left-0 right-0 top-0 z-50 flex justify-center px-4 py-4">
        <div
          className={cn(
            'mx-auto w-full transition-all duration-500',
            scrolled ? 'max-w-4xl' : 'max-w-5xl'
          )}
        >
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500"
            style={{
              background: scrolled
                ? 'rgba(255,255,255,0.88)'
                : 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: scrolled
                ? '0 12px 40px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.95)'
                : '0 8px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((item) => {
                const isActive = activeSection === item.href

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => smoothScrollTo(item.href)}
                    className={cn(
                      'group relative cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/60'
                        : 'text-slate-600 hover:bg-white/80 hover:text-blue-700'
                    )}
                  >
                    {item.label}

                    {!isActive && (
                      <span className="absolute inset-x-4 -bottom-0.5 h-px scale-x-0 rounded-full bg-blue-500 transition-transform duration-300 group-hover:scale-x-100" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-2 lg:flex">
              <LanguageSwitcher />

              {isAuthed ? (
                <Link to="/app" className="cursor-pointer">
                  <PrimaryBtn>
                    Dashboard
                    <RiArrowRightLine className="h-3.5 w-3.5" />
                  </PrimaryBtn>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-blue-700"
                  >
                    {t.nav.login}
                  </Link>

                  <Link to="/register" className="cursor-pointer">
                    <PrimaryBtn>
                      {t.auth.submitRegister}
                      <RiArrowRightLine className="h-3.5 w-3.5" />
                    </PrimaryBtn>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-blue-700 lg:hidden"
              style={{
                border: '1px solid rgba(226,232,240,0.80)',
              }}
            >
              {navOpen ? (
                <HiOutlineXMark className="h-5 w-5" />
              ) : (
                <HiOutlineBars3 className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {navOpen && (
            <div
              className="mt-2 overflow-hidden rounded-2xl p-3 lg:hidden"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.92)',
                boxShadow:
                  '0 20px 60px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}
            >
              <div className="space-y-1">
                {navLinks.map((item) => {
                  const isActive = activeSection === item.href

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        smoothScrollTo(item.href)
                        setNavOpen(false)
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/60'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 grid gap-2 border-t border-slate-200/70 pt-3">
                {isAuthed ? (
                  <Link to="/app" className="cursor-pointer">
                    <PrimaryBtn className="w-full justify-center">
                      Dashboard
                    </PrimaryBtn>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="cursor-pointer">
                      <button
                        type="button"
                        className="w-full cursor-pointer rounded-xl py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
                        style={{
                          border: '1px solid rgba(226,232,240,0.80)',
                          background: 'rgba(255,255,255,0.80)',
                        }}
                      >
                        {t.nav.login}
                      </button>
                    </Link>

                    <Link to="/register" className="cursor-pointer">
                      <PrimaryBtn className="w-full justify-center">
                        {t.auth.submitRegister}
                      </PrimaryBtn>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 pt-24">
        <Hero isAuthed={isAuthed} />
        <Features />
        <HowItWorks />
        <Pricing isAuthed={isAuthed} />
        <FAQ />
      </main>
      <Footer onNavClick={smoothScrollTo} />
    </div>
  )
}

function isActiveSub(sub: Awaited<ReturnType<typeof subscriptionApi.active>> | null | undefined) {
  return sub?.status === 'active' || sub?.status === 'trialing'
}

function PrimaryBtn({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-200/60 transition-all duration-200 hover:-translate-y-px hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-300/50 active:translate-y-0', className)}>
      {children}
    </button>
  )
}

/* ─── Hero ─────────────────────────────────────────────────── */
function Hero({ isAuthed }: { isAuthed: boolean }) {
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

/* ─── Features ──────────────────────────────────────────────── */
function Features() {
  const t = useT()
  const features = [
    {
      Icon: RiChatSmile3Line,
      title: 'AI Transaction Assistant',
      desc: 'Record transactions naturally with AI-powered chat automation.',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
      hoverBorder: 'rgba(59,130,246,0.28)',
    },
    {
      Icon: RiScanLine,
      title: 'Smart Receipt Scanner',
      desc: 'Scan receipts instantly and review extracted transaction data.',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
      hoverBorder: 'rgba(139,92,246,0.28)',
    },
    {
      Icon: RiBrainLine,
      title: 'AI Financial Insights',
      desc: 'Get personalized spending insights and smarter budgeting.',
      color: 'text-indigo-600',
      bg: 'rgba(238,242,255,0.90)',
      border: 'rgba(199,210,254,0.70)',
      hoverBorder: 'rgba(99,102,241,0.28)',
    },
    {
      Icon: RiScales3Line,
      title: 'Split Bills',
      desc: 'Split expenses fairly and track shared payments easily.',
      color: 'text-pink-600',
      bg: 'rgba(255,241,246,0.90)',
      border: 'rgba(251,207,232,0.70)',
      hoverBorder: 'rgba(236,72,153,0.28)',
    },
    {
      Icon: RiCalendarEventLine,
      title: 'Bill Reminders',
      desc: 'Stay ahead of subscriptions and recurring payments.',
      color: 'text-amber-600',
      bg: 'rgba(255,251,235,0.90)',
      border: 'rgba(253,230,138,0.70)',
      hoverBorder: 'rgba(245,158,11,0.28)',
    },
    {
      Icon: RiLockLine,
      title: 'Privacy First',
      desc: 'Secure infrastructure and encrypted financial data protection.',
      color: 'text-rose-500',
      bg: 'rgba(255,241,242,0.90)',
      border: 'rgba(254,205,211,0.70)',
      hoverBorder: 'rgba(244,63,94,0.28)',
    },
  ]

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      {/* Background SVG */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute left-1/2 top-0 -translate-x-1/2 opacity-40"
          width="1200"
          height="800"
          viewBox="0 0 1200 800"
          fill="none"
        >
          <circle cx="200" cy="180" r="180" fill="url(#blueGradient)" />
          <circle cx="980" cy="260" r="220" fill="url(#purpleGradient)" />
          <circle cx="600" cy="700" r="260" fill="url(#pinkGradient)" />

          <defs>
            <radialGradient id="blueGradient">
              <stop stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="purpleGradient">
              <stop stopColor="#8B5CF6" stopOpacity="0.16" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="pinkGradient">
              <stop stopColor="#EC4899" stopOpacity="0.14" />
              <stop offset="1" stopColor="#EC4899" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.features}
          title={t.landing.featuresTitle}
          description={t.landing.featuresSubtitle}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, i) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2"
              style={{
                background: 'rgba(255,255,255,0.68)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow:
                  '0 6px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Hover Border */}
              <div
                className="absolute inset-0 rounded-3xl opacity-0 transition-all duration-500 group-hover:opacity-100"
                style={{
                  border: `1px solid ${item.hoverBorder}`,
                  boxShadow:
                    '0 24px 60px rgba(15,23,42,0.10)',
                }}
              />

              {/* Animated SVG Glow */}
              <svg
                className="absolute -right-10 -top-10 h-32 w-32 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                viewBox="0 0 200 200"
                fill="none"
              >
                <path
                  d="M42.7,-73.5C56.4,-66.4,69.1,-56.5,76.2,-43.2C83.2,-29.9,84.5,-13.2,82.1,2.3C79.8,17.9,73.8,32.3,64.5,44.6C55.2,56.9,42.7,67,28.4,73.2C14.2,79.4,-1.8,81.7,-17.2,78.7C-32.5,75.7,-47.3,67.5,-59.1,56.2C-70.8,44.9,-79.5,30.5,-82.4,14.6C-85.3,-1.2,-82.4,-18.5,-74.4,-32.8C-66.3,-47.2,-53.1,-58.5,-39,-65.7C-24.9,-72.8,-10,-75.8,4.7,-83.1C19.4,-90.4,38.9,-102.1,42.7,-73.5Z"
                  transform="translate(100 100)"
                  fill={item.hoverBorder}
                />
              </svg>

              <div
                className={cn(
                  'relative inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3',
                  item.color
                )}
                style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <item.Icon className="h-5 w-5" />
              </div>

              <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-slate-900">
                {item.title}
              </h3>

              <p className="relative mt-3 text-sm leading-6 text-slate-600">
                {item.desc}
              </p>

              <div className="relative mt-6 flex items-center gap-2 text-sm font-medium text-slate-400 transition-all duration-300 group-hover:text-slate-700">
                Explore feature
                <RiArrowRightLine className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ──────────────────────────────────────────── */
function HowItWorks() {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState<'nlp' | 'chat' | 'receipt'>('nlp')

  const tabs = [
    { id: 'nlp' as const, label: 'Record via Chat', Icon: RiChatSmile3Line },
    { id: 'chat' as const, label: 'Ask AI Insights', Icon: RiBrainLine },
    { id: 'receipt' as const, label: 'Scan Receipt', Icon: RiReceiptLine },
  ]

  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={locale === 'id' ? 'Cara Kerja' : 'How It Works'}
          title={locale === 'id' ? 'Catat uang dengan cara yang lebih pintar' : 'Track your money in smarter ways'}
          description={locale === 'id' ? 'Gunakan chat AI, insight keuangan, atau scan struk untuk mencatat dan memahami pengeluaran lebih cepat.' : 'Use AI chat, financial insights, or receipt scanning to record and understand your spending faster.'}
        />

        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex flex-wrap justify-center gap-1.5 rounded-3xl p-1.5"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow:
                '0 8px 28px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/70'
                      : 'text-slate-500 hover:bg-white/80 hover:text-blue-700'
                  )}
                >
                  <tab.Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-12">
          {activeTab === 'nlp' && <NLPSection />}
          {activeTab === 'chat' && <ChatbotSection />}
          {activeTab === 'receipt' && <ReceiptSection />}
        </div>
      </div>
    </section>
  )
}

/* ─── NLP Section ───────────────────────────────────────────── */
function NLPSection() {
  const steps = [
    {
      num: '01',
      Icon: RiSendPlaneLine,
      title: 'Type naturally',
      desc: 'Write expenses like a normal chat message.',
      example: '"lunch di warteg 35 ribu"',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
    },
    {
      num: '02',
      Icon: RiBrainLine,
      title: 'AI understands',
      desc: 'SAKU detects amount, merchant, category, and wallet.',
      example: 'Warteg · Rp 35.000 · Food',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
    },
    {
      num: '03',
      Icon: HiOutlineEye,
      title: 'Preview first',
      desc: 'Review and edit the result before saving.',
      example: 'Confirm or edit transaction',
      color: 'text-amber-600',
      bg: 'rgba(255,251,235,0.90)',
      border: 'rgba(253,230,138,0.70)',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: 'Save instantly',
      desc: 'Confirmed transactions are saved to your wallet.',
      example: 'Saved to Main Wallet',
      color: 'text-emerald-600',
      bg: 'rgba(236,253,245,0.90)',
      border: 'rgba(167,243,208,0.70)',
    },
  ]

  const chatMessages = [
    {
      sender: 'user',
      text: 'bought coffee 25k',
    },
    {
      sender: 'ai',
      preview: {
        merchant: 'Starbucks',
        amount: 'Rp 25.000',
        cat: 'Food & Drink',
        wallet: 'Main Wallet',
        emoji: '☕',
      },
    },
    {
      sender: 'user',
      text: 'gojek 18k',
    },
    {
      sender: 'ai',
      preview: {
        merchant: 'Gojek',
        amount: 'Rp 18.000',
        cat: 'Transportation',
        wallet: 'Main Wallet',
        emoji: '🛵',
      },
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          How NLP Recording Works
        </p>

        {steps.map((s) => (
          <div
            key={s.num}
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow:
                '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute inset-0 rounded-3xl border border-blue-300/30" />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />
            </div>

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105',
                  s.color
                )}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                }}
              >
                <s.Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">{s.num}</span>
                  <h4 className="text-sm font-bold text-slate-950">{s.title}</h4>
                </div>

                <p className="text-sm leading-6 text-slate-500">{s.desc}</p>

                <div className="mt-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">{s.example}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="sticky top-28 overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow:
            '0 24px 70px rgba(37,99,235,0.10), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <RiChatSmile3Line className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">SAKU AI</p>
            <p className="text-xs text-slate-400">Natural language recording</p>
          </div>

          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto bg-slate-50/60 p-5">
          {chatMessages.map((msg, i) => (
            <div key={i}>
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white shadow-md shadow-blue-200/70">
                    {msg.text}
                  </div>
                </div>
              ) : msg.preview ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] overflow-hidden rounded-3xl rounded-bl-md border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/50">
                    <div className="px-4 pb-3 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <RiSparklingLine className="h-4 w-4 text-blue-500" />
                        <p className="text-xs font-bold text-blue-600">
                          Transaction Preview
                        </p>
                      </div>

                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-2xl">{msg.preview.emoji}</span>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {msg.preview.merchant}
                          </p>
                          <p className="text-xs text-slate-400">{msg.preview.cat}</p>
                        </div>

                        <span className="ml-auto text-base font-extrabold text-rose-500">
                          -{msg.preview.amount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <RiWalletLine className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {msg.preview.wallet}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">Just now</span>
                      </div>
                    </div>

                    <div className="flex border-t border-slate-200/70">
                      <button className="flex-1 py-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50">
                        Edit
                      </button>
                      <button className="flex-1 py-3 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50">
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200/70 bg-white/60 px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2.5">
            <input
              readOnly
              placeholder='Type like "dinner 80k" or "gojek 18 ribu"…'
              className="flex-1 bg-transparent text-sm text-slate-400 placeholder-slate-300 outline-none"
            />
            <RiSendPlaneLine className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── AI Chatbot Section ────────────────────────────────────── */
function ChatbotSection() {
  const qaItems = [
    {
      Icon: RiBarChartGroupedFill,
      color: 'text-blue-500',
      bg: 'rgba(239,246,255,0.80)',
      border: 'rgba(191,219,254,0.60)',
      q: 'How much did I spend today?',
      a: 'You spent Rp 83.000 across 3 transactions.',
    },
    {
      Icon: RiPieChart2Line,
      color: 'text-violet-500',
      bg: 'rgba(245,243,255,0.80)',
      border: 'rgba(221,214,254,0.60)',
      q: 'What category is the highest?',
      a: 'Food & Drink is your top category this month.',
    },
    {
      Icon: RiLineChartLine,
      color: 'text-emerald-500',
      bg: 'rgba(236,253,245,0.80)',
      border: 'rgba(167,243,208,0.60)',
      q: 'Am I on track?',
      a: 'You used 64% of your monthly budget.',
    },
    {
      Icon: RiMoneyDollarCircleLine,
      color: 'text-amber-500',
      bg: 'rgba(255,251,235,0.80)',
      border: 'rgba(253,230,138,0.60)',
      q: 'Show my biggest expense',
      a: 'Your largest expense is Rp 750.000.',
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
          What You Can Ask
        </p>

        {qaItems.map((item) => (
          <div
            key={item.q}
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow:
                '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute inset-0 rounded-3xl border border-violet-300/30" />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
            </div>

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  item.color
                )}
                style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <item.Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-slate-900">"{item.q}"</p>
                <p className="text-sm leading-6 text-slate-500">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="sticky top-28 overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow:
            '0 24px 70px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <RiBrainLine className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Finance Assistant</p>
            <p className="text-xs text-slate-400">Ask anything about money</p>
          </div>

          <div className="ml-auto rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
            AI Powered
          </div>
        </div>

        <div className="space-y-3 bg-violet-50/40 p-5">
          <ChatBubble
            sender="ai"
            text="Hi! Ask me about spending, budgets, or financial health."
            accentColor="violet"
          />
          <ChatBubble
            sender="user"
            text="How much did I spend today?"
            accentColor="violet"
          />
          <ChatBubble
            sender="ai"
            text="You spent Rp 83.000 today across Coffee, Transport, and Lunch."
            accentColor="violet"
          />

          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-3xl rounded-bl-md border border-slate-200/80 bg-white/90 px-4 py-4 text-sm text-slate-700 shadow-lg shadow-slate-200/50">
              <p className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <RiPieChart2Line className="h-4 w-4 text-violet-500" />
                Top categories
              </p>

              {[
                { cat: 'Food & Drink', pct: 32 },
                { cat: 'Transportation', pct: 21 },
                { cat: 'Shopping', pct: 18 },
              ].map((c) => (
                <div key={c.cat} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">{c.cat}</span>
                    <span className="font-bold text-slate-800">{c.pct}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/70 bg-white/60 px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white/80 px-3 py-2.5">
            <input
              readOnly
              placeholder="Ask anything about your finances…"
              className="flex-1 bg-transparent text-sm text-slate-400 outline-none"
            />
            <RiSendPlaneLine className="h-4 w-4 text-violet-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({
  sender,
  text,
  accentColor = 'blue',
}: {
  sender: 'user' | 'ai'
  text: string
  accentColor?: 'blue' | 'violet'
}) {
  const isUser = sender === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-6',
          isUser
            ? cn(
                'rounded-br-md text-white shadow-md',
                accentColor === 'violet'
                  ? 'bg-violet-600 shadow-violet-200/70'
                  : 'bg-blue-600 shadow-blue-200/70'
              )
            : 'rounded-bl-md border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm'
        )}
      >
        {text}
      </div>
    </div>
  )
}

/* ─── Receipt Section ───────────────────────────────────────── */
function ReceiptSection() {
  const steps = [
    {
      num: '01',
      Icon: HiOutlineArrowUpTray,
      title: 'Upload receipt',
      desc: 'Take a photo or upload your receipt.',
      color: 'text-cyan-600',
      bg: 'rgba(236,254,255,0.90)',
      border: 'rgba(165,243,252,0.70)',
    },
    {
      num: '02',
      Icon: RiScanLine,
      title: 'AI extracts data',
      desc: 'SAKU reads merchant, date, items, and total.',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
    },
    {
      num: '03',
      Icon: HiOutlineDocumentCheck,
      title: 'Review details',
      desc: 'Check and edit extracted data before saving.',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: 'Confirm & save',
      desc: 'Save it instantly as a transaction.',
      color: 'text-emerald-600',
      bg: 'rgba(236,253,245,0.90)',
      border: 'rgba(167,243,208,0.70)',
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          How Receipt Scanning Works
        </p>

        {steps.map((step) => (
          <div
            key={step.num}
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow:
                '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  step.color
                )}
                style={{
                  background: step.bg,
                  border: `1px solid ${step.border}`,
                }}
              >
                <step.Icon className="h-5 w-5" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">{step.num}</span>
                  <h4 className="text-sm font-bold text-slate-950">{step.title}</h4>
                </div>

                <p className="text-sm leading-6 text-slate-500">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow:
            '0 24px 70px rgba(6,182,212,0.10), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-200">
            <RiReceiptLine className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Receipt Preview</p>
            <p className="text-xs text-slate-400">Review before saving</p>
          </div>

          <span className="ml-auto rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            AI Extracted
          </span>
        </div>

        <div className="space-y-4 bg-cyan-50/40 p-5">
          <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-cyan-200 bg-cyan-50">
            <div className="text-center">
              <RiReceiptLine className="mx-auto mb-1 h-8 w-8 text-cyan-300" />
              <p className="text-xs font-medium text-cyan-500">
                Receipt image uploaded
              </p>
            </div>

            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-200" />
              Scanning
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Extracted Data
            </p>

            {[
              { label: 'Merchant', value: 'Starbucks Coffee', Icon: RiBankLine },
              { label: 'Date', value: 'May 20, 2026', Icon: RiCalendarEventLine },
              { label: 'Category', value: 'Food & Drink', Icon: RiPieChart2Line },
              {
                label: 'Total Amount',
                value: 'Rp 65.000',
                highlight: true,
                Icon: RiMoneyDollarCircleLine,
              },
            ].map((row) => (
              <div key={row.label} className="mb-2.5 flex items-center justify-between last:mb-0">
                <div className="flex items-center gap-2">
                  <row.Icon className="h-4 w-4 text-slate-300" />
                  <span className="text-xs text-slate-400">{row.label}</span>
                </div>

                <div
                  className={cn('rounded-xl px-3 py-1 text-xs font-bold')}
                  style={
                    row.highlight
                      ? {
                          background: 'rgba(209,250,229,0.70)',
                          border: '1px solid rgba(167,243,208,0.80)',
                          color: '#059669',
                        }
                      : {
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          color: '#475569',
                        }
                  }
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Items Detected
            </p>

            {[
              { name: 'Caramel Frappuccino', price: 'Rp 52.000' },
              { name: 'Croissant', price: 'Rp 13.000' },
            ].map((item) => (
              <div key={item.name} className="mb-2 flex justify-between text-sm last:mb-0">
                <span className="text-slate-500">{item.name}</span>
                <span className="font-bold text-slate-800">{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button className="flex-1 rounded-2xl border border-slate-200 bg-white/80 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">
              Edit Details
            </button>

            <button className="flex-1 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200/70 transition-all hover:bg-cyan-500">
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Pricing ───────────────────────────────────────────────── */
function translatePlanFeature(feature: string, locale: string): string {
  if (locale === 'id') return feature
  const map: Record<string, string> = {
    'Pencatatan transaksi manual': 'Manual transaction tracking',
    '2 dompet': '2 wallets',
    'Kategori dasar': 'Basic categories',
    'Semua fitur Free': 'Everything in Free',
    'Scan struk dengan AI': 'AI receipt scanning',
    'Catat via AI (free text)': 'AI free-text transaction entry',
    'Dompet & kategori tanpa batas': 'Unlimited wallets and categories',
    'Kantong Tujuan': 'Savings goals',
    'Anggaran bulanan': 'Monthly budgets',
    'Semua fitur Pro': 'Everything in Pro',
    'Budget Tracker lanjutan': 'Advanced budget tracker',
    'Lampiran & arsip': 'Attachments and archive',
    'Export Excel': 'Excel export',
    'Prioritas support': 'Priority support',
  }
  return map[feature] ?? feature
}

function Pricing({ isAuthed }: { isAuthed: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const plansQ = useQuery({
    queryKey: ['landing', 'subscription-plans'],
    queryFn: subscriptionApi.listPlans,
  })
  const activeQ = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: subscriptionApi.active,
    enabled: isAuthed,
    staleTime: 60 * 1000,
  })
  const checkoutM = useMutation({
    mutationFn: (planCode: string) => subscriptionApi.checkout(planCode),
    onSuccess: (checkout) => {
      window.location.href = checkout.redirect_url
    },
  })
  const fallbackPlans = [
    {
      name: t.landing.planFreeName,
      price: t.landing.planFreePrice,
      period: '',
      badge: null,
      desc: locale === 'id' ? 'Fitur dasar untuk mulai mencatat arus kas harian.' : 'Core tools to start tracking daily cashflow.',
      features: locale === 'id'
        ? ['Input transaksi manual', 'Dompet utama', 'Ringkasan bulanan', 'Akses web responsif']
        : ['Manual transaction entry', 'Primary wallet', 'Monthly summary', 'Responsive web access'],
      cta: t.landing.ctaPrimary,
      tier: 'free',
    },
    {
      name: 'Pro',
      price: t.landing.planProPrice,
      period: t.landing.perMonth,
      badge: locale === 'id' ? 'Terpopuler' : 'Most Popular',
      desc: locale === 'id' ? 'Fitur AI dan kapasitas lebih luas untuk rutinitas finansial yang lebih aktif.' : 'AI features and higher capacity for more active finance routines.',
      features: locale === 'id'
        ? ['Semua fitur Starter', 'Catat transaksi via AI', 'Scan struk', 'Bantu kategori otomatis', 'Budget dan target', 'Split bill', 'Insight pengeluaran', 'Dompet lebih fleksibel']
        : ['Everything in Starter', 'AI transaction entry', 'Receipt scanning', 'Assisted categorization', 'Budgets and goals', 'Split bills', 'Spending insights', 'More flexible wallets'],
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      tier: 'pro',
    },
    {
      name: 'Premium',
      price: t.landing.planBizPrice,
      period: t.landing.perMonth,
      badge: null,
      desc: locale === 'id' ? 'Paket lanjutan untuk kebutuhan kolaborasi dan laporan yang lebih dalam.' : 'Advanced plan for collaboration and deeper reporting needs.',
      features: locale === 'id'
        ? ['Semua fitur Pro', 'Kolaborasi keluarga atau tim', 'Analitik lanjutan', 'Laporan kustom', 'Ekspor data', 'Dukungan prioritas', 'Akses fitur awal']
        : ['Everything in Pro', 'Family or team collaboration', 'Advanced analytics', 'Custom reports', 'Data export', 'Priority support', 'Early feature access'],
      cta: locale === 'id' ? 'Mulai Premium' : 'Start Premium',
      tier: 'premium',
    },
  ]
  const planCopy: Record<string, { desc: string; cta: string; badge: string | null }> = {
    free: {
      desc: locale === 'id' ? 'Fitur dasar untuk mulai mencatat arus kas harian.' : 'Core tools to start tracking daily cashflow.',
      cta: t.landing.ctaPrimary,
      badge: null,
    },
    pro: {
      desc: locale === 'id' ? 'Fitur AI dan kapasitas lebih luas untuk rutinitas finansial yang lebih aktif.' : 'AI features and higher capacity for more active finance routines.',
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      badge: locale === 'id' ? 'Terpopuler' : 'Most Popular',
    },
    premium: {
      desc: locale === 'id' ? 'Paket lanjutan untuk kebutuhan kolaborasi dan laporan yang lebih dalam.' : 'Advanced plan for collaboration and deeper reporting needs.',
      cta: locale === 'id' ? 'Mulai Premium' : 'Start Premium',
      badge: null,
    },
  }
  const plans = plansQ.data && plansQ.data.length > 0
    ? plansQ.data
        .filter((plan) => plan.period === 'monthly' && plan.is_active)
        .map((plan) => ({
          name: plan.name,
          price: plan.price <= 0 ? t.landing.planFreePrice : formatCurrency(plan.price, plan.currency),
          period: plan.price <= 0 ? '' : t.landing.perMonth,
          badge: planCopy[plan.code]?.badge ?? null,
          desc: planCopy[plan.code]?.desc ?? (locale === 'id' ? 'Paket fleksibel untuk pengguna SAKU.' : 'Flexible plan for SAKU users.'),
          features: plan.features.map((feature) => translatePlanFeature(feature, locale)),
          cta: planCopy[plan.code]?.cta ?? (locale === 'id' ? 'Mulai' : 'Start'),
          tier: plan.code,
        }))
    : fallbackPlans

  const handlePlanClick = (plan: (typeof plans)[number]) => {
    if (String(plan.tier).includes('premium')) return
    if (!isAuthed) {
      navigate('/register')
      return
    }
    if (isActiveSub(activeQ.data)) {
      navigate('/app/profile')
      return
    }
    if (plan.tier === 'free') {
      navigate('/app/profile')
      return
    }
    checkoutM.mutate(String(plan.tier))
  }

  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.pricing}
          title={t.landing.pricingTitle}
          description={t.landing.pricingSubtitle}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((plan) => {
            const isPro = plan.tier === 'pro'
            const isPremium = String(plan.tier).includes('premium')

            return (
              <div
                key={plan.name}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2',
                  isPro && 'md:scale-105'
                )}
                style={{
                  background: isPro
                    ? 'rgba(255,255,255,0.86)'
                    : 'rgba(255,255,255,0.68)',
                  backdropFilter: 'blur(36px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(36px) saturate(180%)',
                  border: isPro
                    ? '1px solid rgba(59,130,246,0.34)'
                    : '1px solid rgba(255,255,255,0.86)',
                  boxShadow: isPro
                    ? '0 24px 70px rgba(37,99,235,0.14), inset 0 1px 0 rgba(255,255,255,1)'
                    : '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
                }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-3xl border border-blue-300/40" />
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-300/20 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" />
                </div>

                {plan.badge && (
                  <span className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-blue-200">
                    <RiSparklingLine className="h-3.5 w-3.5" />
                    {plan.badge}
                  </span>
                )}

                <div className="relative">
                  <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{plan.desc}</p>

                  <div className="mt-6 flex items-end gap-1">
                    <span
                      className={cn(
                        'text-4xl font-extrabold tracking-tight',
                        isPro ? 'text-blue-700' : 'text-slate-950'
                      )}
                    >
                      {plan.price}
                    </span>

                    {plan.period && (
                      <span className="pb-1.5 text-sm font-medium text-slate-400">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="relative mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          isPro
                            ? 'border-blue-200 bg-blue-50 text-blue-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        )}
                      >
                        <RiCheckLine className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isPremium || checkoutM.isPending}
                  onClick={() => handlePlanClick(plan)}
                  className={cn(
                    'relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300',
                    isPremium && 'cursor-not-allowed opacity-60',
                    isPro
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-500 hover:shadow-blue-300'
                      : 'border border-slate-200 bg-white/80 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  )}
                >
                  {isPro && <RiFlashlightLine className="h-4 w-4" />}
                  {checkoutM.isPending && isPro
                    ? (locale === 'id' ? 'Memproses...' : 'Processing...')
                    : isPremium ? (locale === 'id' ? 'Belum Tersedia' : 'Coming Soon') : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-slate-500">
          {(locale === 'id' ? ['Mulai dari gratis', 'Upgrade kapan saja', 'Akses langsung'] : ['Start for free', 'Upgrade anytime', 'Instant access']).map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <RiCheckLine className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
/* ─── FAQ ───────────────────────────────────────────────────── */
function FAQ() {
  const t = useT()
  const { locale } = useLocale()
  const items = [
    {
      q: t.landing.faq4q,
      a: t.landing.faq4a,
    },
    {
      q: t.landing.faq2q,
      a: t.landing.faq2a,
    },
    {
      q: t.landing.faq1q,
      a: t.landing.faq1a,
    },
    {
      q: t.landing.faq3q,
      a: t.landing.faq3a,
    },
    {
      q: locale === 'id' ? 'Bagaimana cara kerja split bill?' : 'How do split bills work?',
      a: locale === 'id' ? 'Masukkan pengeluaran bersama, lalu SAKU membantu membagi nominal dan melacak status pembayaran setiap peserta.' : 'Add shared expenses, let SAKU calculate who owes what, and track each settlement clearly.',
    },
    {
      q: locale === 'id' ? 'Apakah bisa upgrade kapan saja?' : 'Can I upgrade anytime?',
      a: locale === 'id' ? 'Bisa. Kamu dapat memakai Starter dulu, lalu upgrade ke Pro saat membutuhkan fitur AI dan kapasitas tambahan.' : 'Yes. You can stay on Starter first, then upgrade to Pro when you need AI features and extra capacity.',
    },
  ]

  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.faq}
          title={t.landing.faqTitle}
          description={t.landing.featuresSubtitle}
        />

        <div className="mt-10 space-y-4">
          {items.map((item, i) => {
            const isOpen = open === i

            return (
              <div
                key={item.q}
                className="group relative overflow-hidden rounded-3xl transition-all duration-300"
                style={{
                  background: isOpen
                    ? 'rgba(255,255,255,0.82)'
                    : 'rgba(255,255,255,0.68)',
                  backdropFilter: 'blur(32px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                  border: isOpen
                    ? '1px solid rgba(59,130,246,0.35)'
                    : '1px solid rgba(255,255,255,0.86)',
                  boxShadow: isOpen
                    ? '0 18px 48px rgba(37,99,235,0.10), inset 0 1px 0 rgba(255,255,255,0.95)'
                    : '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
                }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-3xl border border-blue-300/30" />
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="relative flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300',
                        isOpen
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <span className="text-sm font-semibold text-slate-950 sm:text-base">
                      {item.q}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      isOpen
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-white/70 text-slate-400 group-hover:text-blue-600'
                    )}
                  >
                    <HiOutlineChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </span>
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mx-6 border-t border-slate-200/70 px-0 py-5">
                      <p className="text-sm leading-7 text-slate-600">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ────────────────────────────────────────────────── */
function Footer({ onNavClick }: { onNavClick: (id: string) => void }) {
  const t = useT()
  const { locale } = useLocale()
  const productLinks = [
    { label: t.nav.features, id: 'features' },
    { label: locale === 'id' ? 'Cara Kerja' : 'How It Works', id: 'how-it-works' },
    { label: t.nav.pricing, id: 'pricing' },
    { label: t.nav.faq, id: 'faq' },
  ]

  const supportLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: 'mailto:hello@saku.app' },
    { label: 'System Status', href: '#' },
    { label: 'Changelog', href: '#' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ]

  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderColor: 'rgba(226,232,240,0.60)',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
              {t.landing.footerTagline}
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[RiInstagramLine, RiLinkedinLine, RiGithubLine].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:text-blue-600"
                  style={{
                    background: 'rgba(255,255,255,0.78)',
                    border: '1px solid rgba(226,232,240,0.80)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
                  }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={t.landing.footerProduct}>
            {productLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => onNavClick(link.id)}
                className="block cursor-pointer text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-blue-600"
              >
                {link.label}
              </button>
            ))}
          </FooterColumn>

          <FooterColumn title="Support">
            {supportLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block cursor-pointer text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
          </FooterColumn>

          <FooterColumn title={t.landing.footerLegal}>
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block cursor-pointer text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-slate-200/70 pt-6 text-xs text-slate-400 md:flex-row">
          <p>{t.landing.footerRights}</p>
          <p>{t.landing.footerTagline}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
        {title}
      </h4>

      <div className="space-y-3">{children}</div>
    </div>
  )
}

/* ─── Section Heading ───────────────────────────────────────── */
function SectionHeading({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(191,219,254,0.60)', boxShadow: '0 2px 12px rgba(59,130,246,0.08)' }}>
        <RiFlashlightLine className="h-3 w-3" />{label}
      </span>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-slate-500">{description}</p>}
    </div>
  )
}

export default LandingPage
