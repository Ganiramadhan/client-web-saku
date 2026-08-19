import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineChatBubbleLeftRight, HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineXMark } from 'react-icons/hi2'
import { RiWhatsappLine } from 'react-icons/ri'
import { useAuthStore } from '@/stores/authStore'
import { useLocale, useT } from '@/i18n'
import {
  analyticsEvents,
  getAnalyticsConsentChoice,
  setAnalyticsConsentChoice,
  trackEvent,
  type AnalyticsConsentChoice,
} from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { askLandingChat, type LandingChatTurn } from '../api'
import { smoothScrollTo } from '../components/landingUtils'
import { LandingNavbar } from '../components/LandingNavbar'
import { HeroSection } from '../sections/HeroSection'
import { FeaturesSection } from '../sections/FeaturesSection'
import { FooterSection } from '../sections/FooterSection'
import { FAQSection } from '../sections/FAQSection'
import { HowItWorksSection } from '../sections/HowItWorksSection'
import { PricingSection } from '../sections/PricingSection'
import { SecuritySection } from '../sections/SecuritySection'
import { SocialProofSection } from '../sections/SocialProofSection'

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
  const [cookieConsentChoice, setCookieConsentChoice] = useState<AnalyticsConsentChoice | null>(() => (
    typeof window === 'undefined' ? null : getAnalyticsConsentChoice()
  ))
  const pricingTrackedRef = useRef(false)
  const activeSectionRef = useRef(activeSection)
  const scrolledRef = useRef(scrolled)

  useEffect(() => {
    activeSectionRef.current = activeSection
    if (activeSection === 'pricing' && !pricingTrackedRef.current) {
      pricingTrackedRef.current = true
      trackEvent(analyticsEvents.pricingViewed)
    }
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

  const handleCookieConsent = (choice: AnalyticsConsentChoice) => {
    setAnalyticsConsentChoice(choice)
    setCookieConsentChoice(choice)
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
    const sectionIds = ['home', 'features', 'how-it-works', 'pricing', 'security', 'faq']
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
      { href: 'security', label: locale === 'id' ? 'Keamanan' : 'Security' },
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
    <div className="app-surface landing-page relative min-h-screen overflow-x-hidden bg-[#f6eee8] font-sans antialiased">
      {isMobile ? (
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#f6eee8]" aria-hidden="true" />
      ) : (
        <div className="landing-fixed-bg pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#f6eee8]" aria-hidden="true">
          <div className="absolute -left-20 top-36 h-72 w-72 rounded-[45%_55%_35%_65%] border-2 border-[#17120f] bg-brand-200/60" />
          <div className="absolute right-10 top-40 h-44 w-44 rounded-[62%_38%_55%_45%] border-2 border-[#17120f] bg-[#fddf82]/70" />
          <div className="absolute bottom-24 left-1/3 h-28 w-28 rotate-12 rounded-[2rem] border-2 border-[#17120f] bg-white/55" />
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

      <main className="relative z-10 pt-[4.75rem] sm:pt-24">
        <HeroSection isAuthed={isAuthed} />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection isAuthed={isAuthed} />
        <SecuritySection isAuthed={isAuthed} />
        <FAQSection />
        <SocialProofSection />
        <FinalCTA locale={locale} isAuthed={isAuthed} />
      </main>
      <FooterSection onNavClick={smoothScrollTo} />

      <CookieConsentBanner
        open={!cookieConsentChoice}
        onAccept={() => handleCookieConsent('accepted')}
        onReject={() => handleCookieConsent('analytics_rejected')}
      />

      {cookieConsentChoice ? (
        <div className="fixed bottom-5 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
          <LandingSupportChat locale={locale} />

          {scrolled && !isMobile ? (
            <button
              type="button"
              onClick={() => smoothScrollTo('home')}
              aria-label={locale === 'id' ? 'Kembali ke atas' : 'Back to top'}
              className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-[#17120f]/14 bg-[#fffaf6]/92 text-[#17120f] shadow-md shadow-brand-100/60 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-[#fddf82]"
            >
              <ScrollTopDoodle />
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
      ) : null}
    </div>
  )
}

type LandingChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

function LandingSupportChat({ locale }: { locale: 'id' | 'en' }) {
  const isId = locale === 'id'
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<LandingChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: isId
        ? 'Halo, aku SAKU Assistant. Mau tanya apa? Aku bisa bantu jelasin fitur, harga paket, keamanan data, pembayaran, atau cara mulai pakai SAKU.'
        : 'Hi, I am SAKU Assistant. What would you like to ask? I can help explain features, pricing, data security, payments, or how to get started with SAKU.',
    },
  ])

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== 'welcome') return current
      return [
        {
          id: 'welcome',
          role: 'assistant',
          text: isId
            ? 'Halo, aku SAKU Assistant. Mau tanya apa? Aku bisa bantu jelasin fitur, harga paket, keamanan data, pembayaran, atau cara mulai pakai SAKU.'
            : 'Hi, I am SAKU Assistant. What would you like to ask? I can help explain features, pricing, data security, payments, or how to get started with SAKU.',
        },
      ]
    })
  }, [isId])

  const quickPrompts = isId
    ? ['SAKU cocok buat aku?', 'Fitur unggulan', 'Free vs Pro', 'Data aman?']
    : ['Is SAKU for me?', 'Top features', 'Free vs Pro', 'Is my data safe?']

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const el = chatBodyRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, open, isTyping])

  const submitMessage = (value = input) => {
    const trimmed = value.trim()
    if (!trimmed || isTyping) return

    const userMessage: LandingChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    }

    const history: LandingChatTurn[] = messages
      .filter((message) => message.id !== 'welcome')
      .map((message) => ({ role: message.role, content: message.text }))

    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsTyping(true)

    askLandingChat(trimmed, history, locale)
      .then(({ reply }) => {
        setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: reply }])
      })
      .catch((err) => {
        setMessages((current) => [
          ...current,
          { id: `assistant-${Date.now()}`, role: 'assistant', text: toErrorMessage(err) },
        ])
      })
      .finally(() => setIsTyping(false))
  }

  return (
    <>
      {open ? (
        <div className="fixed inset-x-3 bottom-20 top-[7rem] z-[80] flex overflow-hidden rounded-[1.4rem] border border-[#17120f]/14 bg-[#fffaf6] shadow-[0_18px_54px_rgba(23,18,15,0.16)] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:max-h-[min(68vh,540px)] sm:w-[390px]">
          <div className="flex min-h-0 w-full flex-col">
          <div className="relative shrink-0 border-b border-[#17120f]/10 bg-[#fff3ee] px-4 py-3">
            <div className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rounded-[44%_56%_50%_50%] border border-[#17120f]/14 bg-[#fddf82]/70" />
            <div className="relative flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#17120f]/18 bg-brand-500 text-[#17120f] shadow-[0_8px_20px_rgba(255,111,97,0.18)]">
                <HiOutlineSparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#17120f]">SAKU Assistant</p>
                <p className="truncate text-xs font-bold text-[#6b5f59]">
                  {isId ? 'Bantuan cepat seputar SAKU' : 'Quick help about SAKU'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isId ? 'Tutup chat bantuan' : 'Close support chat'}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#17120f]/10 bg-white/80 text-[#17120f] transition hover:bg-[#fddf82]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div ref={chatBodyRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#fffaf6] px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-[1.15rem] px-4 py-3 text-sm font-bold leading-6',
                    message.role === 'user'
                      ? 'rounded-br-md border border-[#17120f]/12 bg-brand-500 text-[#17120f] shadow-[0_8px_18px_rgba(255,111,97,0.16)]'
                      : 'rounded-bl-md border border-[#17120f]/10 bg-white/82 text-[#4f4540]',
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[1.15rem] rounded-bl-md border border-[#17120f]/10 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-[#17120f]/10 bg-[#fff3ee]/70 px-4 py-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitMessage(prompt)}
                  className="shrink-0 rounded-full border border-[#17120f]/12 bg-[#fffaf6] px-3 py-1.5 text-[11px] font-black text-[#4f4540] transition hover:border-brand-300 hover:bg-brand-100 hover:text-[#17120f]"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                submitMessage()
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={isId ? 'Tanya tentang SAKU...' : 'Ask about SAKU...'}
                className="min-w-0 flex-1 rounded-2xl border border-[#17120f]/12 bg-[#fffaf6] px-4 py-3 text-sm font-bold text-[#17120f] outline-none transition placeholder:text-[#9b8f88] focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#17120f]/18 bg-[#17120f] text-white shadow-[0_10px_24px_rgba(23,18,15,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-500 hover:text-[#17120f] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <HiOutlinePaperAirplane className="h-5 w-5" />
              </button>
            </form>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/register"
                className="rounded-xl border border-[#17120f]/12 bg-brand-500 px-3 py-2 text-center text-xs font-black text-[#17120f] transition hover:bg-brand-300"
              >
                {isId ? 'Mulai Gratis' : 'Start Free'}
              </Link>
              <button
                type="button"
                onClick={() => smoothScrollTo('pricing')}
                className="rounded-xl border border-[#17120f]/12 bg-[#fffaf6] px-3 py-2 text-xs font-black text-[#4f4540] transition hover:bg-[#fddf82] hover:text-[#17120f]"
              >
                {isId ? 'Lihat Harga' : 'See Pricing'}
              </button>
            </div>
          </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={isId ? 'Buka chat bantuan SAKU' : 'Open SAKU support chat'}
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#17120f]/18 bg-brand-500 text-[#17120f] shadow-md shadow-brand-200/70 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-300 sm:shadow-xl"
      >
        <span className="absolute -right-1 -top-1 flex h-4 w-4">
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-[#fddf82]" />
        </span>
        <span className="pointer-events-none absolute right-14 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-md shadow-slate-200/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
          {isId ? 'Bantuan SAKU' : 'SAKU help'}
        </span>
        {open ? <HiOutlineXMark className="h-6 w-6" /> : <HiOutlineChatBubbleLeftRight className="h-6 w-6" />}
      </button>
    </>
  )
}

function FinalCTA({ locale, isAuthed }: { locale: 'id' | 'en'; isAuthed: boolean }) {
  const isId = locale === 'id'
  return (
    <section className="relative overflow-hidden py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-brand-500 p-6 shadow-[8px_8px_0_#17120f] sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-[45%_55%_35%_65%] border-2 border-[#17120f] bg-[#fddf82]" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#17120f]/70">
              {isId ? 'Mulai dari Free' : 'Start from Free'}
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight tracking-[-0.04em] text-[#17120f] sm:text-4xl">
              {isId ? 'Mulai dari satu catatan kecil hari ini.' : 'Start with one small record today.'}
            </h2>
            <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-[#17120f]/75">
              {isId
                ? 'Tidak perlu langsung sempurna. Catat transaksi pertama, lalu biarkan SAKU membantu membaca pola uangmu sedikit demi sedikit.'
                : 'No need to be perfect right away. Record your first transaction, then let SAKU help read your money patterns step by step.'}
            </p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link to={isAuthed ? '/app' : '/register'} className="saku-secondary-action rounded-2xl px-6 py-3 text-sm font-black">
              {isId ? 'Mulai Gratis' : 'Start Free'}
            </Link>
            <button
              type="button"
              onClick={() => smoothScrollTo('pricing')}
              className="rounded-2xl border-2 border-[#17120f] bg-[#fffaf6] px-6 py-3 text-sm font-black text-[#17120f] shadow-[4px_4px_0_#17120f] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#fddf82]"
            >
              {isId ? 'Lihat Harga' : 'See Pricing'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function CookieConsentBanner({
  open,
  onAccept,
  onReject,
}: {
  open: boolean
  onAccept: () => void
  onReject: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed bottom-5 right-4 z-[60] w-[calc(100%-2rem)] max-w-[380px] sm:bottom-6 sm:right-6">
      <div className="rounded-[1.35rem] border border-[#17120f]/14 bg-[#fffaf6]/96 p-3.5 shadow-[0_20px_60px_rgba(23,18,15,0.16)] backdrop-blur sm:p-4">
        <div className="grid gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[#17120f]">
              Privacy preferences
            </p>

            <p className="mt-1 text-xs leading-5 text-[#4f4540]">
              We use cookies to improve performance and understand website usage.
              You can accept analytics or reject them.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/cookies"
              className="inline-flex items-center justify-center rounded-xl border border-[#17120f]/10 bg-white px-3 py-2.5 text-[11px] font-black text-[#4f4540] transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              Learn More
            </Link>

            <button
              type="button"
              onClick={onReject}
              className="rounded-xl border border-[#17120f]/10 bg-white px-3 py-2.5 text-[11px] font-black text-[#4f4540] transition hover:border-brand-200 hover:bg-[#ffe4dc] hover:text-[#b4533f]"
            >
              Reject
            </button>

            <button
              type="button"
              onClick={onAccept}
              className="rounded-xl border-2 border-[#17120f] bg-brand-500 px-3 py-2.5 text-[11px] font-black text-[#17120f] shadow-[3px_3px_0_#17120f] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-300"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScrollTopDoodle() {
  return (
    <svg viewBox="0 0 36 36" className="h-8 w-8" fill="none" aria-hidden="true">
      <path d="M18 5C10.9 5 6 10.5 6 17.2c0 6.9 5 12.8 12 12.8s12-5.9 12-12.8C30 10.5 25.1 5 18 5Z" fill="#fffaf6" stroke="#17120f" strokeWidth="1.7" />
      <path d="M18 24V12" stroke="#17120f" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.8 16.4 18 11.2l5.2 5.2" stroke="#ff6f61" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 8.8c1.2-.5 2.2-1.3 2.8-2.5.5 1.2 1.4 2 2.7 2.5-1.3.5-2.2 1.4-2.7 2.7-.6-1.3-1.6-2.2-2.8-2.7Z" fill="#fddf82" stroke="#17120f" strokeWidth="1" />
    </svg>
  )
}

export default HomePage
