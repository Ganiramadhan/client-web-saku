import type { ReactNode } from 'react'
import { RiGithubLine, RiInstagramLine, RiLinkedinLine } from 'react-icons/ri'
import { Logo } from '@/components/Logo'
import { useLocale, useT } from '@/i18n'

export function FooterSection({ onNavClick }: { onNavClick: (id: string) => void }) {
  const t = useT()
  const { locale } = useLocale()
  const productLinks = [
    { label: t.nav.features, id: 'features' },
    { label: locale === 'id' ? 'Cara Kerja' : 'How It Works', id: 'how-it-works' },
    { label: t.nav.pricing, id: 'pricing' },
    { label: t.nav.faq, id: 'faq' },
  ]

  const supportLinks = [
    { label: 'Contact Us', href: '/contact' },
    { label: 'About SAKU', href: '/about' },
    { label: 'Email Support', href: 'mailto:hello@ganipedia.com' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact', href: '/contact' },
    { label: 'About', href: '/about' },
  ]

  return (
    <footer className="relative z-10 overflow-hidden bg-transparent">
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
              {t.landing.footerTagline}
            </p>
            <p className="mt-3 max-w-md text-xs font-semibold uppercase tracking-wider text-blue-600">
              {locale === 'id' ? 'AI finance assistant untuk keputusan harian' : 'AI finance assistant for daily decisions'}
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[RiInstagramLine, RiLinkedinLine, RiGithubLine].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:shadow-blue-100/50"
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
                className="block cursor-pointer text-sm font-medium text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-blue-600"
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
                className="block cursor-pointer text-sm font-medium text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-blue-600"
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
                className="block cursor-pointer text-sm font-medium text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-slate-200/70 pt-6 text-xs text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} SAKU Finance. All rights reserved.</p>
          <p>{locale === 'id' ? 'Website resmi SAKU untuk pengelolaan keuangan pribadi.' : 'Official SAKU website for personal finance management.'}</p>
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
  children: ReactNode
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
