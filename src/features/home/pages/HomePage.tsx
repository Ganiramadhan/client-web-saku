import { useEffect, useMemo, useRef, useState } from 'react'
import { RiArrowUpLine, RiWhatsappLine } from 'react-icons/ri'
import { useAuthStore } from '@/stores/authStore'
import { useLocale, useT } from '@/i18n'
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

export default HomePage
