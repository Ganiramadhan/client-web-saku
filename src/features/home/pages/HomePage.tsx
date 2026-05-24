import { lazy, Suspense, useEffect, useState } from 'react'
import { RiArrowUpLine, RiWhatsappLine } from 'react-icons/ri'
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
  const whatsappText = encodeURIComponent(
    locale === 'id'
      ? 'Halo SAKU, saya ingin bertanya tentang SAKU.'
      : 'Hi SAKU, I want to ask about SAKU.',
  )

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

      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {scrolled ? (
          <button
            type="button"
            onClick={() => smoothScrollTo('home')}
            aria-label={locale === 'id' ? 'Kembali ke atas' : 'Back to top'}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-slate-600 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:text-blue-700 hover:shadow-blue-100 active:translate-y-0"
          >
            <RiArrowUpLine className="h-5 w-5" />
          </button>
        ) : null}

        <a
          href={`https://wa.me/628211248685?text=${whatsappText}`}
          target="_blank"
          rel="noreferrer"
          aria-label={locale === 'id' ? 'Chat SAKU di WhatsApp' : 'Chat SAKU on WhatsApp'}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/70 bg-emerald-500 text-white shadow-xl shadow-emerald-200/80 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-400 hover:shadow-emerald-300/80 active:translate-y-0"
        >
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-300" />
          </span>
          <span className="pointer-events-none absolute right-14 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-lg shadow-slate-200/60 backdrop-blur-xl opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
            {locale === 'id' ? 'Chat WhatsApp' : 'WhatsApp chat'}
          </span>
          <RiWhatsappLine className="h-6 w-6" />
        </a>
      </div>
    </div>
  )
}

export default HomePage
