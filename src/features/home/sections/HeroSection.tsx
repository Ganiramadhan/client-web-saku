import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowTrendingUp } from 'react-icons/hi2'
import { RiArrowRightLine, RiChatSmile3Line, RiScanLine, RiShieldCheckLine, RiSparklingLine, RiTimeLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { smoothScrollTo } from '../components/landingUtils'

export function HeroSection({ isAuthed }: { isAuthed: boolean }) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const copy = isId
    ? {
        eyebrow: 'AI Financial Assistant untuk cashflow pribadi',
        titleTop: 'Kelola uang harian',
        titleAccent: 'dengan bantuan AI.',
        desc: 'SAKU membantu mencatat transaksi, membaca struk, mengatur banyak wallet, memantau budget, dan memberi insight keuangan tanpa spreadsheet rumit.',
        primary: 'Mulai Gratis',
        secondary: 'Lihat Cara Kerja',
        promo: 'Coba gratis dulu. Upgrade ke Pro saat kamu siap membuka kuota AI lebih besar, OCR, split bill, dan insight lengkap.',
        trust: ['Gratis digunakan', 'Tanpa kartu kredit', 'Data aman'],
      }
    : {
        eyebrow: 'AI Financial Assistant for personal cashflow',
        titleTop: 'Manage daily money',
        titleAccent: 'with AI support.',
        desc: 'SAKU helps record transactions, scan receipts, manage multiple wallets, track budgets, and surface financial insights without complex spreadsheets.',
        primary: 'Start Free',
        secondary: 'See How It Works',
        promo: 'Start free first. Upgrade to Pro when you are ready for larger AI quota, OCR, split bill, and richer insights.',
        trust: ['Free to start', 'No credit card', 'Secure data'],
      }
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
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:gap-12 lg:px-8">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-100/60">
            <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
            {copy.eyebrow}
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-black text-amber-800 shadow-sm shadow-amber-100/70">
            🎉 Launch Promo 30% OFF
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-[3.55rem] leading-[1.06]">
            {copy.titleTop}<br />
            <span className="relative inline-block">
              <span className="text-[#2563EB]">{copy.titleAccent}</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 280 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 7.5C50 3 100 1.5 140 3C180 4.5 230 6 278 4" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5"/>
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-500 sm:text-[17px]">
            {copy.desc}
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-blue-700">
            {copy.promo}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={isAuthed ? '/app' : '/register'}>
              <button className="group inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8]">
                {copy.primary} <RiArrowRightLine className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <button onClick={() => smoothScrollTo('how-it-works')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-7 py-3.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-white hover:text-slate-900">
              {copy.secondary}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {copy.trust.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-bold text-slate-500">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { Icon: RiChatSmile3Line, value: 'AI Chat', label: isId ? 'Catat otomatis' : 'Auto recording', color: 'text-blue-600', bg: 'rgba(239,246,255,0.80)' },
              { Icon: RiScanLine, value: 'AI OCR', label: isId ? 'Scan struk' : 'Receipt scanner', color: 'text-violet-600', bg: 'rgba(245,243,255,0.80)' },
              { Icon: RiTimeLine, value: '24/7', label: isId ? 'Siap bantu' : 'Always available', color: 'text-emerald-600', bg: 'rgba(236,253,245,0.80)' },
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
        <div className="lg:max-w-[560px] lg:justify-self-end">
          <HeroPreview isMobile={isMobile} isId={isId} />
        </div>
      </div>
    </section>
  )
}

function HeroPreview({ isMobile, isId }: { isMobile: boolean; isId: boolean }) {
  if (isMobile) {
    return <MobileHeroPreview isId={isId} />
  }

  return <DesktopHeroPreview isId={isId} />
}

function MobileHeroPreview({ isId }: { isId: boolean }) {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70 md:hidden">
        <div className="rounded-[1.35rem] bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-3 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isId ? 'Uang yang bisa disimpan' : 'Money saved this month'}</p>
              <h2 className="mt-1.5 text-2xl font-extrabold text-slate-900 tracking-tight">Rp 1.420.000</h2>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{isId ? 'Terdeteksi dari 42 transaksi' : 'Detected from 42 transactions'}</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <HiOutlineArrowTrendingUp className="h-3 w-3" />+18%
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-[11px] text-slate-500">{isId ? 'Aman dipakai' : 'Safe to spend'}</p>
              <p className="mt-1 text-sm font-bold text-blue-600">{isId ? 'Rp 185rb/hari' : 'Rp 185rb/day'}</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="text-[11px] text-slate-500">{isId ? 'Kategori rawan' : 'Risk category'}</p>
              <p className="mt-1 text-sm font-bold text-rose-500">{isId ? 'Makan 42%' : 'Food 42%'}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[11px] font-bold text-blue-700">AI Insight</p>
            </div>
            <p className="text-[11px] leading-5 text-blue-700/80">{isId ? 'Kurangi delivery kopi 3x/minggu untuk sisihkan Rp 312.000 bulan ini.' : 'Cut coffee delivery 3x/week to free up Rp 312.000 this month.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DesktopHeroPreview({ isId }: { isId: boolean }) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/86 p-2 shadow-2xl shadow-slate-200/70">
        <div className="rounded-[1.55rem] border border-slate-100 bg-slate-50/90 p-5">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isId ? 'AI menemukan uang yang bisa disimpan' : 'AI found money you can save'}</p>
              <h2 className="mt-1.5 text-3xl font-extrabold text-slate-900 tracking-tight">Rp 1.420.000</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">{isId ? 'Dari 42 transaksi di 4 dompet' : 'From 42 transactions across 4 wallets'}</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-emerald-700" style={{ background: 'rgba(209,250,229,0.80)', border: '1px solid rgba(167,243,208,0.80)' }}>
              <HiOutlineArrowTrendingUp className="h-3 w-3" />{isId ? '+18% cashflow lebih sehat' : '+18% better cashflow'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { label: isId ? 'Aman/hari' : 'Safe/day', value: 'Rp 185rb', color: 'text-blue-600', bg: 'rgba(219,234,254,0.55)', border: 'rgba(191,219,254,0.65)', Icon: RiShieldCheckLine },
              { label: isId ? 'Struk discan' : 'OCR saved', value: isId ? '18 struk' : '18 receipts', color: 'text-violet-600', bg: 'rgba(245,243,255,0.65)', border: 'rgba(221,214,254,0.75)', Icon: RiScanLine },
              { label: isId ? 'Tagihan auto' : 'Auto bills', value: 'Rp 920rb', color: 'text-emerald-600', bg: 'rgba(209,250,229,0.50)', border: 'rgba(167,243,208,0.60)', Icon: RiTimeLine },
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
          <div className="mt-4 rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{isId ? 'Tekanan budget makan' : 'Food budget pressure'}</p>
              <p className="text-[11px] font-bold text-slate-600">72%</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: '72%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <span className="rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-500">{isId ? 'Makan Rp 1.2jt' : 'Dining Rp 1.2jt'}</span>
              <span className="rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-500">Coffee Rp 312rb</span>
              <span className="rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-500">{isId ? 'Tagihan Rp 920rb' : 'Bills Rp 920rb'}</span>
            </div>
          </div>
          <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(241,245,249,1)' }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">{isId ? 'AI mencatat untuk kamu' : 'AI records it for you'}</p>
              <p className="text-[11px] text-blue-500 font-medium cursor-pointer">{isId ? 'Preview langsung' : 'Live preview'}</p>
            </div>
            <div className="space-y-2.5">
              <TxRow icon="AI" title="beli nasi padang 35rb" cat={isId ? 'Makanan - Cash' : 'Food & Drink - Cash'} amount="-Rp 35.000" />
              <TxRow icon="OCR" title={isId ? 'Struk berhasil discan' : 'Receipt scanned'} cat={isId ? 'Merchant, tanggal, nominal terbaca' : 'Merchant, date, amount detected'} amount="-Rp 128.500" />
              <TxRow icon="IN" title={isId ? 'Pembayaran freelance' : 'Freelance payout'} cat={isId ? 'Pemasukan - Bank Jago' : 'Income - Bank Jago'} amount="+Rp 5.500.000" positive />
            </div>
          </div>
          <div className="mt-3 rounded-2xl p-3.5" style={{ background: 'rgba(239,246,255,0.85)', border: '1px solid rgba(191,219,254,0.60)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[11px] font-bold text-blue-700">AI Insight</p>
            </div>
            <p className="text-[11px] leading-5 text-blue-600/80">{isId ? 'Kurangi delivery kopi 3x/minggu untuk sisihkan Rp 312.000 dan tetap aman belanja Rp 185.000/hari.' : 'Cut coffee delivery 3x/week to free up Rp 312.000 and keep Rp 185.000/day safe to spend.'}</p>
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
