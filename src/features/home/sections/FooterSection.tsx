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
