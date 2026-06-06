import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RiArrowRightLine, RiArrowUpLine, RiCloseLine, RiCoupon3Line, RiWhatsappLine } from 'react-icons/ri'
import { useAuthStore } from '@/stores/authStore'
import { useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { smoothScrollTo } from '../components/landingUtils'
import { LandingNavbar } from '../components/LandingNavbar'
import { HeroSection } from '../sections/HeroSection'
import { FeaturesSection } from '../sections/FeaturesSection'
import { FooterSection } from '../sections/FooterSection'
import { FAQSection } from '../sections/FAQSection'
import { HowItWorksSection } from '../sections/HowItWorksSection'
import { ProblemSection } from '../sections/ProblemSection'
import { PricingSection } from '../sections/PricingSection'
import { SecuritySection } from '../sections/SecuritySection'

const MARKETING_POPUP_KEY = 'saku-launch-promo-popup-dismissed-at'
const MARKETING_POPUP_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export function HomePage() {
  const t = useT()
  const { locale } = useLocale()
  const isAuthed = useAuthStore((s) => Boolean(s.token))
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isMobile, setIsMobile] = useState(() => (
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 767px)').matches
  ))
  const [marketingPopupOpen, setMarketingPopupOpen] = useState(false)
  const marketingPopupShownRef = useRef(false)
  const activeSectionRef = useRef(activeSection)
  const scrolledRef = useRef(scrolled)

  useEffect(() => {
    activeSectionRef.current = activeSection
  }, [activeSection])

  useEffect(() => {
    scrolledRef.current = scrolled
  }, [scrolled])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (isAuthed) return

    const dismissedAt = Number(window.localStorage.getItem(MARKETING_POPUP_KEY) || 0)
    if (dismissedAt && Date.now() - dismissedAt < MARKETING_POPUP_COOLDOWN_MS) return

    const showPopup = () => {
      if (marketingPopupShownRef.current) return
      marketingPopupShownRef.current = true
      setMarketingPopupOpen(true)
    }

    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      if (window.scrollY / scrollable >= 0.6) showPopup()
    }

    const onMouseLeave = (event: MouseEvent) => {
      if (isMobile) return
      if (event.clientY <= 0) showPopup()
    }

    const timer = window.setTimeout(showPopup, 20 * 1000)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    onScroll()

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [isAuthed, isMobile])

  const closeMarketingPopup = () => {
    window.localStorage.setItem(MARKETING_POPUP_KEY, String(Date.now()))
    setMarketingPopupOpen(false)
  }

  useEffect(() => {
    let frame = 0

    const updateScrollState = () => {
      frame = 0
      const nextScrolled = window.scrollY > 60
      if (scrolledRef.current !== nextScrolled) {
        scrolledRef.current = nextScrolled
        setScrolled(nextScrolled)
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateScrollState)
    }

    updateScrollState()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const sectionIds = ['home', 'features', 'how-it-works', 'pricing', 'faq']
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const id = visible?.target.id

        if (id && activeSectionRef.current !== id) {
          activeSectionRef.current = id
          setActiveSection(id)
        }
      },
      { rootMargin: '-20% 0px -62% 0px', threshold: 0 },
    )

    const observed = new Set<Element>()
    const observeSections = () => {
      sectionIds.forEach((id) => {
        const section = document.getElementById(id)
        if (section && !observed.has(section)) {
          observed.add(section)
          observer.observe(section)
        }
      })
    }

    observeSections()
    const retryTimer = window.setTimeout(observeSections, 700)

    return () => {
      window.clearTimeout(retryTimer)
      observer.disconnect()
    }
  }, [])

  const navLinks = useMemo(
    () => [
      { href: 'home', label: 'Home' },
      { href: 'features', label: t.nav.features },
      { href: 'how-it-works', label: locale === 'id' ? 'Cara Kerja' : 'How It Works' },
      { href: 'pricing', label: t.nav.pricing },
      { href: 'faq', label: t.nav.faq },
    ],
    [locale, t.nav.faq, t.nav.features, t.nav.pricing],
  )
  const whatsappText = encodeURIComponent(
    locale === 'id'
      ? 'Halo SAKU, saya ingin bertanya tentang SAKU.'
      : 'Hi SAKU, I want to ask about SAKU.',
  )

  return (
    <div className="app-surface landing-page relative min-h-screen overflow-x-hidden bg-slate-50 font-sans antialiased">
      {isMobile ? (
        <div className="pointer-events-none absolute inset-0 z-0 bg-slate-50" aria-hidden="true" />
      ) : (
        <div className="landing-fixed-bg pointer-events-none absolute inset-0 z-0 overflow-hidden bg-slate-50" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(96,165,250,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.12) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 via-white/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-white via-slate-50/90 to-transparent" />
        </div>
      )}

      <LandingNavbar
        activeSection={activeSection}
        isAuthed={isAuthed}
        isMobile={isMobile}
        navLinks={navLinks}
        navOpen={navOpen}
        scrolled={scrolled}
        setNavOpen={setNavOpen}
      />

      <main className="relative z-10 pt-24">
        <HeroSection isAuthed={isAuthed} />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection isAuthed={isAuthed} />
        <SecuritySection isAuthed={isAuthed} />
        <FAQSection />
      </main>
      <FooterSection onNavClick={smoothScrollTo} />

      <LaunchPromoPopup
        open={marketingPopupOpen}
        locale={locale}
        isMobile={isMobile}
        onClose={closeMarketingPopup}
      />

      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {scrolled && !isMobile ? (
          <button
            type="button"
            onClick={() => smoothScrollTo('home')}
            aria-label={locale === 'id' ? 'Kembali ke atas' : 'Back to top'}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/85 text-slate-600 shadow-md shadow-slate-200/60 transition-colors duration-200 hover:border-blue-200 hover:bg-white hover:text-blue-700 active:translate-y-0"
          >
            <RiArrowUpLine className="h-5 w-5" />
          </button>
        ) : null}

        <a
          href={`https://wa.me/628211248685?text=${whatsappText}`}
          target="_blank"
          rel="noreferrer"
          aria-label={locale === 'id' ? 'Chat SAKU di WhatsApp' : 'Chat SAKU on WhatsApp'}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/70 bg-emerald-500 text-white shadow-md shadow-emerald-200/70 transition-colors duration-200 hover:bg-emerald-400 active:translate-y-0 sm:shadow-xl"
        >
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-300" />
          </span>
          <span className="pointer-events-none absolute right-14 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-md shadow-slate-200/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
            {locale === 'id' ? 'Chat WhatsApp' : 'WhatsApp chat'}
          </span>
          <RiWhatsappLine className="h-6 w-6" />
        </a>
      </div>
    </div>
  )
}

function LaunchPromoPopup({
  open,
  locale,
  isMobile,
  onClose,
}: {
  open: boolean
  locale: 'id' | 'en'
  isMobile: boolean
  onClose: () => void
}) {
  if (!open) return null
  const isId = locale === 'id'

  return (
    <div
      className={cn(
        'fixed z-50',
        isMobile
          ? 'inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))]'
          : 'bottom-6 right-6 w-[360px]',
      )}
    >
      <div
        className={cn(
          'overflow-hidden border border-blue-100 bg-white shadow-2xl shadow-slate-900/14',
          isMobile ? 'rounded-[1.5rem]' : 'rounded-3xl',
        )}
      >
        <div className={cn('flex items-start gap-3 bg-blue-50/80', isMobile ? 'p-3.5' : 'p-4')}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <RiCoupon3Line className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Launch Promo</p>
            <h3 className={cn('mt-1 font-black text-slate-950', isMobile ? 'text-sm' : 'text-base')}>30% OFF SAKU Pro</h3>
            <p className={cn('mt-1 text-xs text-slate-600', isMobile ? 'line-clamp-2 leading-5' : 'leading-5')}>
              {isId
                ? 'Mulai gratis dulu, lalu gunakan promo launching saat kamu siap upgrade ke fitur AI yang lebih lengkap.'
                : 'Start free first, then use the launch promo when you are ready to unlock richer AI features.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700"
            aria-label="Close promo"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>
        <div className={cn('grid gap-2', isMobile ? 'p-3.5 pt-3' : 'p-4')}>
          <Link
            to="/register"
            onClick={onClose}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700',
              isMobile ? 'px-4 py-3' : 'px-4 py-3',
            )}
          >
            {isId ? 'Daftar Gratis' : 'Start Free'}
            <RiArrowRightLine className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose()
              smoothScrollTo('pricing')
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {isId ? 'Lihat Paket' : 'View Plans'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
