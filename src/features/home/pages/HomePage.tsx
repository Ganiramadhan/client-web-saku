import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLocale, useT } from '@/i18n'
import { smoothScrollTo } from '../components/landingUtils'
import { LandingNavbar } from '../components/LandingNavbar'
import { HeroSection } from '../sections/HeroSection'

const FeaturesSection = lazy(() => import('../sections/FeaturesSection').then((m) => ({ default: m.FeaturesSection })))
const HowItWorksSection = lazy(() => import('../sections/HowItWorksSection').then((m) => ({ default: m.HowItWorksSection })))
const PricingSection = lazy(() => import('../sections/PricingSection').then((m) => ({ default: m.PricingSection })))
const FAQSection = lazy(() => import('../sections/FAQSection').then((m) => ({ default: m.FAQSection })))
const FooterSection = lazy(() => import('../sections/FooterSection').then((m) => ({ default: m.FooterSection })))

export function HomePage() {
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
        if (el && window.scrollY >= el.offsetTop - 140) {
          setActiveSection(id)
          break
        }
      }
    }

    onScroll()
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
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-50" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.075]"
          style={{
            backgroundImage:
              'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 via-white/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-white via-slate-50/90 to-transparent" />
      </div>

      <LandingNavbar
        activeSection={activeSection}
        isAuthed={isAuthed}
        navLinks={navLinks}
        navOpen={navOpen}
        scrolled={scrolled}
        setNavOpen={setNavOpen}
      />

      <main className="relative z-10 pt-24">
        <HeroSection isAuthed={isAuthed} />
        <Suspense fallback={null}>
          <FeaturesSection />
          <HowItWorksSection />
          <PricingSection isAuthed={isAuthed} />
          <FAQSection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <FooterSection onNavClick={smoothScrollTo} />
      </Suspense>
    </div>
  )
}

export default HomePage
