import type { ReactNode } from 'react'
import { RiShieldCheckLine } from 'react-icons/ri'
import { Logo } from '@/components/Logo'
import { useLocale, useT } from '@/i18n'

export function FooterSection({ onNavClick }: { onNavClick: (id: string) => void }) {
  const t = useT()
  const { locale } = useLocale()
  const productLinks = [
    { label: t.nav.features, id: 'features' },
    { label: locale === 'id' ? 'Cara Kerja' : 'How It Works', id: 'how-it-works' },
    { label: t.nav.pricing, id: 'pricing' },
    { label: locale === 'id' ? 'Keamanan' : 'Security', id: 'security' },
    { label: t.nav.faq, id: 'faq' },
  ]

  const supportLinks = [
    { label: 'Contact Us', href: '/contact' },
    { label: 'About SAKU', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Email Support', href: 'mailto:hello@ganipedia.com' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookies Policy', href: '/cookies' },
  ]

  return (
    <footer className="relative z-10 overflow-hidden bg-transparent">
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#17120f]/15 bg-[#fffaf6]/80 p-6 shadow-[0_24px_70px_rgba(23,18,15,0.06)] sm:p-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
              {locale === 'id'
                ? 'SAKU membantu mencatat transaksi harian, mengelola wallet, dan memahami pola pengeluaran dengan bantuan AI.'
                : 'SAKU helps track daily transactions, manage wallets, and understand spending patterns with AI.'}
            </p>
            <p className="mt-3 max-w-md text-xs font-semibold uppercase tracking-wider text-brand-700">
              {locale === 'id' ? 'Asisten uang harian untuk keputusan kecil yang lebih jelas' : 'Daily money assistant for clearer small decisions'}
            </p>
          </div>

          <FooterColumn title={t.landing.footerProduct}>
            {productLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => onNavClick(link.id)}
                className="block cursor-pointer text-sm font-medium text-slate-500 transition-all duration-300 hover:translate-x-1 hover:text-brand-700"
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
                className="block cursor-pointer text-sm font-medium text-slate-500 transition-all duration-300 hover:translate-x-1 hover:text-brand-700"
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
                className="block cursor-pointer text-sm font-medium text-slate-500 transition-all duration-300 hover:translate-x-1 hover:text-brand-700"
              >
                {link.label}
              </a>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-10">
          <div className="mb-3 flex justify-center lg:justify-start">
            <div className="inline-flex items-center gap-3 rounded-xl border border-[#17120f]/10 bg-white px-3.5 py-1.5 shadow-[0_10px_24px_rgba(23,18,15,0.05)]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Powered by
              </span>
              <span className="flex h-7 w-36 items-center overflow-visible">
                <img
                  src="/logo-midtrans.webp"
                  alt="Midtrans"
                  className="h-7 w-7 origin-left scale-[3.85] object-contain"
                  loading="lazy"
                />
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#17120f]/35 bg-[#071a2c] shadow-[0_22px_60px_rgba(7,26,44,0.16)]">
            <div className="grid gap-5 p-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-brand-100">
                  <RiShieldCheckLine className="h-3.5 w-3.5" />
                  {locale === 'id' ? 'Checkout aman' : 'Secure checkout'}
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight sm:text-xl">
                  {locale === 'id' ? 'Pembayaran resmi, pilihan metode tetap fleksibel.' : 'Official payments with flexible methods.'}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-brand-50/80">
                  {locale === 'id'
                    ? 'Checkout diproses melalui Midtrans dan mendukung channel yang tersedia seperti QRIS, GoPay, kartu, virtual account, retail payment, dan paylater.'
                    : 'Checkout is processed through Midtrans and supports available channels such as QRIS, GoPay, cards, virtual accounts, retail payment, and paylater.'}
                </p>
              </div>

              <div className="overflow-visible rounded-[1.15rem] bg-transparent px-0 py-0">
                <img
                  src="/payment-support-midtrans.webp"
                  alt="Metode pembayaran Midtrans"
                  className="mx-auto h-auto max-h-[235px] w-full object-contain object-center"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
                {locale === 'id'
                  ? 'Metode pembayaran mengikuti channel yang tersedia di halaman checkout Midtrans.'
                  : 'Payment methods follow the channels available on the Midtrans checkout page.'}
          </p>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-slate-200/70 pt-6 text-xs text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} SAKU Finance. All rights reserved.</p>
          <p>{locale === 'id' ? 'Website resmi SAKU untuk catatan dan insight keuangan pribadi.' : 'Official SAKU website for personal finance tracking and insights.'}</p>
        </div>
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
