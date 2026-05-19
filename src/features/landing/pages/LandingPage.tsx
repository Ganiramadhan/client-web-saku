import { Link } from 'react-router-dom'
import { useState, type ComponentType } from 'react'
import {
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineWallet,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6'
import { Logo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string }>

export function LandingPage() {
  const isAuthed = useAuthStore((s) => Boolean(s.token))
  const [navOpen, setNavOpen] = useState(false)

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            {navLinks.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-slate-950">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />

            {isAuthed ? (
              <Link to="/app">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
                  Login
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setNavOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Toggle navigation"
          >
            {navOpen ? <HiOutlineXMark className="h-5 w-5" /> : <HiOutlineBars3 className="h-5 w-5" />}
          </button>
        </div>

        {navOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="space-y-1">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
              {isAuthed ? (
                <Link to="/app">
                  <Button className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Hero isAuthed={isAuthed} />
        <Features />
        <Pricing isAuthed={isAuthed} />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}

function Hero({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section id="home" className="overflow-hidden border-b border-slate-100 bg-slate-50/70 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <HiOutlineSparkles className="h-4 w-4 text-brand-600" />
            AI-powered personal finance
          </div>

          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Track your money with less effort.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            SAKU helps you record transactions, scan receipts, manage budgets, and understand your spending from one simple dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={isAuthed ? '/app' : '/register'}>
              <Button className="h-12 px-6" rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}>
                Start for Free
              </Button>
            </Link>

            <a href="#features">
              <Button variant="outline" className="h-12 px-6 bg-white">
                See Features
              </Button>
            </a>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <HeroMetric value="3+" label="Core tools" />
            <HeroMetric value="AI" label="Assisted tracking" />
            <HeroMetric value="24/7" label="Data access" />
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80">
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Balance
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Rp 24.580.000</h2>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              +12.4%
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <SummaryCard label="Income" value="Rp 9.200.000" />
            <SummaryCard label="Expense" value="Rp 3.800.000" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-950">Recent Activity</p>
              <p className="text-xs text-slate-500">This week</p>
            </div>

            <div className="space-y-3">
              <TransactionRow title="Lunch" category="Food" amount="-Rp 38.000" />
              <TransactionRow title="Transport" category="Travel" amount="-Rp 22.500" />
              <TransactionRow title="Freelance Project" category="Income" amount="+Rp 5.500.000" positive />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-800">AI Insight</p>
            <p className="mt-1 text-xs leading-5 text-brand-700">
              Your transport spending is higher than usual this week. Consider reviewing recurring trips.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  )
}

function TransactionRow({
  title,
  category,
  amount,
  positive = false,
}: {
  title: string
  category: string
  amount: string
  positive?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{category}</p>
      </div>

      <p className={cn('text-sm font-bold', positive ? 'text-emerald-600' : 'text-slate-900')}>
        {amount}
      </p>
    </div>
  )
}

function Features() {
  const features: { Icon: Icon; title: string; desc: string }[] = [
    {
      Icon: HiOutlineWallet,
      title: 'Multi Wallet',
      desc: 'Track cash, bank accounts, and e-wallets from one clean workspace.',
    },
    {
      Icon: HiOutlineDocumentText,
      title: 'Receipt Scanner',
      desc: 'Upload receipts and let AI help extract transaction details faster.',
    },
    {
      Icon: HiOutlineSparkles,
      title: 'AI Categorization',
      desc: 'Automatically suggest categories so your records stay organized.',
    },
    {
      Icon: HiOutlineChartBar,
      title: 'Budget Tracking',
      desc: 'Set monthly limits and monitor spending before it gets out of control.',
    },
    {
      Icon: HiOutlineCreditCard,
      title: 'Transaction History',
      desc: 'Review income and expenses with simple filters and summaries.',
    },
    {
      Icon: HiOutlineLockClosed,
      title: 'Secure by Design',
      desc: 'Your financial records are managed with privacy and security in mind.',
    },
  ]

  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Features"
          title="A simpler way to understand your money"
          description="SAKU focuses on the essential tools you need to record, monitor, and improve your financial habits."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                <item.Icon className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing({ isAuthed }: { isAuthed: boolean }) {
  const plans = [
    {
      name: 'Free',
      price: 'Rp 0',
      period: '',
      desc: 'For simple personal expense tracking.',
      features: ['Manual transactions', 'Basic wallet tracking', 'Monthly summary'],
      featured: false,
      cta: 'Start Free',
    },
    {
      name: 'Pro',
      price: 'Rp 29.000',
      period: '/ month',
      desc: 'For users who want AI assistance and deeper insights.',
      features: ['AI categorization', 'Receipt scanner', 'Budget tracker', 'Advanced reports'],
      featured: true,
      cta: 'Start Pro',
    },
  ]

  return (
    <section id="pricing" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Pricing"
          title="Start simple. Upgrade when you need more."
          description="Choose the plan that matches your financial workflow."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-3xl border bg-white p-7 shadow-sm',
                plan.featured ? 'border-slate-950 ring-1 ring-slate-950' : 'border-slate-200',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{plan.desc}</p>
                </div>

                {plan.featured ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-950">
                  {plan.price}
                </span>
                <span className="pb-1 text-sm text-slate-500">{plan.period}</span>
              </div>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to={isAuthed ? '/app/subscription' : '/register'} className="mt-8 block">
                <Button variant={plan.featured ? 'primary' : 'outline'} className="h-11 w-full">
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const items = [
    {
      q: 'Is SAKU free to use?',
      a: 'Yes. You can start with the free plan and upgrade anytime when you need more automation and insights.',
    },
    {
      q: 'What can AI help with?',
      a: 'AI can help categorize transactions, extract receipt data, and provide simple financial insights based on your records.',
    },
    {
      q: 'Can I cancel my subscription?',
      a: 'Yes. You can cancel your subscription anytime from the subscription page.',
    },
    {
      q: 'Is my financial data secure?',
      a: 'SAKU is designed with privacy in mind. Your financial data should only be used to support your own tracking and insights.',
    },
  ]

  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="FAQ"
          title="Common questions"
          description="Quick answers before you start using SAKU."
        />

        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {items.map((item, index) => {
            const isOpen = open === index

            return (
              <div key={item.q} className="border-b border-slate-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-950 hover:bg-slate-50"
                >
                  {item.q}
                  <HiOutlineChevronDown
                    className={cn('h-4 w-4 shrink-0 text-slate-500 transition', isOpen && 'rotate-180')}
                  />
                </button>

                {isOpen ? (
                  <div className="px-5 pb-5 text-sm leading-6 text-slate-600">
                    {item.a}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const productLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  const supportLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Contact', href: 'mailto:hello@saku.app' },
    { label: 'Status', href: '#' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Security', href: '#' },
  ]

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              SAKU is a personal finance tracker built to help you record transactions,
              monitor budgets, and understand your spending with less effort.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <SocialLink icon={FaInstagram} label="Instagram" />
              <SocialLink icon={FaLinkedin} label="LinkedIn" />
              <SocialLink icon={FaGithub} label="GitHub" />
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Support" links={supportLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} SAKU. All rights reserved.</p>
          <p>Built for smarter personal finance management.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="text-sm text-slate-400 hover:text-white">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialLink({
  icon: Icon,
  label,
}: {
  icon: Icon
  label: string
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white"
    >
      <Icon className="h-4 w-4" />
    </a>
  )
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  )
}

export default LandingPage