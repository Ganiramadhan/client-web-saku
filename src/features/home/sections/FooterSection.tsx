import type { ReactNode } from 'react'
import { RiMailLine, RiShieldCheckLine, RiSparklingLine } from 'react-icons/ri'
import { Logo } from '@/components/Logo'
import { useLocale, useT } from '@/i18n'

export function FooterSection({ onNavClick }: { onNavClick: (id: string) => void }) {
  const t = useT()
  const { locale } = useLocale()
  const isId = locale === 'id'

  const productLinks = [
    { label: t.nav.features, id: 'features' },
    { label: isId ? 'Cara Kerja' : 'How It Works', id: 'how-it-works' },
    { label: t.nav.pricing, id: 'pricing' },
    { label: isId ? 'Keamanan' : 'Security', id: 'security' },
    { label: t.nav.faq, id: 'faq' },
  ]

  const companyLinks = [
    { label: t.landing.footerContact, href: '/contact' },
    { label: isId ? 'Tentang SAKU' : 'About SAKU', href: '/about' },
    { label: t.landing.footerBlog, href: '/blog' },
    { label: isId ? 'Dukungan Email' : 'Email Support', href: 'mailto:hello@ganipedia.com' },
  ]

  const legalLinks = [
    { label: t.landing.footerPrivacy, href: '/privacy' },
    { label: t.landing.footerTerms, href: '/terms' },
    { label: isId ? 'Kebijakan Cookie' : 'Cookies Policy', href: '/cookies' },
  ]

  return (
    <footer className="relative z-10 overflow-hidden bg-transparent">
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-[#fffaf6] p-6 shadow-[8px_8px_0_#17120f] sm:p-9">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-[45%_55%_50%_50%] border-2 border-[#17120f] bg-[#fddf82]" />

          <div className="relative grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Logo />

              <p className="mt-5 max-w-md text-sm leading-7 text-[#4f4540]">
                {isId
                  ? 'SAKU membantu mencatat transaksi harian, mengelola wallet, dan memahami pola pengeluaran dengan bantuan AI.'
                  : 'SAKU helps track daily transactions, manage wallets, and understand spending patterns with AI.'}
              </p>

              <div className="mt-5 flex flex-col items-start gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#17120f] bg-brand-100 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-[#17120f] shadow-[3px_3px_0_#17120f]">
                  <RiSparklingLine className="h-3.5 w-3.5" />
                  {isId ? 'Asisten uang harian' : 'Daily money assistant'}
                </span>

                <a
                  href="mailto:hello@ganipedia.com"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#17120f] transition-colors duration-200 hover:text-brand-700"
                >
                  <RiMailLine className="h-4 w-4" />
                  hello@ganipedia.com
                </a>
              </div>
            </div>

            <FooterColumn title={t.landing.footerProduct}>
              {productLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => onNavClick(link.id)}
                  className="group flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#4f4540] transition-all duration-200 hover:translate-x-1 hover:text-brand-700"
                >
                  {link.label}
                </button>
              ))}
            </FooterColumn>

            <FooterColumn title={t.landing.footerCompany}>
              {companyLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#4f4540] transition-all duration-200 hover:translate-x-1 hover:text-brand-700"
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
                  className="group flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#4f4540] transition-all duration-200 hover:translate-x-1 hover:text-brand-700"
                >
                  {link.label}
                </a>
              ))}
            </FooterColumn>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[1.75rem] border-2 border-[#17120f] bg-[#071a2c] p-6 shadow-[6px_6px_0_#17120f] sm:p-7">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold text-brand-100">
                  <RiShieldCheckLine className="h-3.5 w-3.5" />
                  {isId ? 'Checkout aman' : 'Secure checkout'}
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight sm:text-xl">
                  {isId ? 'Pembayaran resmi lewat QRIS.' : 'Official payments via QRIS.'}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-brand-50/80">
                  {isId
                    ? 'Checkout diproses melalui Midtrans dan hanya menggunakan QRIS, jadi kamu bisa bayar dari e-wallet atau m-banking mana pun yang mendukung QRIS.'
                    : 'Checkout is processed through Midtrans and uses QRIS only, so you can pay from any e-wallet or m-banking app that supports QRIS.'}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 sm:justify-self-end">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                  Powered by
                </span>
                <span className="flex h-7 w-32 items-center overflow-visible">
                  <img
                    src="/logo-midtrans.webp"
                    alt="Midtrans"
                    className="h-7 w-7 origin-left scale-[3.5] object-contain brightness-0 invert"
                    loading="lazy"
                  />
                </span>
              </div>
            </div>
          </div>

          <p className="relative mt-4 text-xs font-semibold leading-5 text-[#4f4540]/70">
            {isId
              ? 'Saat ini SAKU hanya menerima pembayaran QRIS melalui Midtrans.'
              : 'SAKU currently accepts QRIS payments only, processed through Midtrans.'}
          </p>

          <div className="relative mt-10 flex flex-col items-center justify-between gap-4 border-t-2 border-dashed border-[#17120f]/20 pt-6 text-xs font-semibold text-[#4f4540]/80 sm:flex-row">
            <p>© {new Date().getFullYear()} SAKU Finance. {isId ? 'Seluruh hak dilindungi.' : 'All rights reserved.'}</p>
            <p>
              {isId
                ? 'Website resmi SAKU untuk catatan dan insight keuangan pribadi.'
                : 'Official SAKU website for personal finance tracking and insights.'}
            </p>
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
      <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-[#17120f]">
        {title}
      </h4>

      <div className="space-y-3">{children}</div>
    </div>
  )
}

export default FooterSection
