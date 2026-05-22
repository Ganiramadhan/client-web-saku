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
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-20 h-[700px] w-[700px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.35) 0%, transparent 65%)' }} />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full animate-[pulse_10s_ease-in-out_infinite_2s]" style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)' }} />
        <div className="absolute bottom-1/4 left-1/4 h-[500px] w-[500px] rounded-full animate-[pulse_9s_ease-in-out_infinite_1s]" style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.22) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 right-1/3 h-[400px] w-[400px] rounded-full animate-[pulse_11s_ease-in-out_infinite_3s]" style={{ background: 'radial-gradient(circle, rgba(253,230,138,0.18) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
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
