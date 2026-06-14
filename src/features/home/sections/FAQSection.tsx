import { useState } from 'react'
import { HiOutlineChevronDown } from 'react-icons/hi2'
import { useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { SectionHeading } from '../components/SectionHeading'

export function FAQSection() {
  const t = useT()
  const { locale } = useLocale()
  const items = [
    {
      q: t.landing.faq4q,
      a: t.landing.faq4a,
    },
    {
      q: t.landing.faq2q,
      a: t.landing.faq2a,
    },
    {
      q: t.landing.faq1q,
      a: t.landing.faq1a,
    },
    {
      q: t.landing.faq3q,
      a: t.landing.faq3a,
    },
    {
      q: locale === 'id' ? 'Bagaimana cara kerja split bill?' : 'How do split bills work?',
      a: locale === 'id' ? 'Masukkan pengeluaran bersama, lalu SAKU membantu membagi nominal dan melacak status pembayaran setiap peserta.' : 'Add shared expenses, let SAKU calculate who owes what, and track each settlement clearly.',
    },
    {
      q: locale === 'id' ? 'Apakah bisa upgrade kapan saja?' : 'Can I upgrade anytime?',
      a: locale === 'id' ? 'Bisa. Kamu dapat memakai Free dulu, lalu upgrade ke Pro saat membutuhkan fitur AI dan kapasitas tambahan.' : 'Yes. You can stay on Free first, then upgrade to Pro when you need AI features and extra capacity.',
    },
  ]

  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.faq}
          title={locale === 'id' ? 'Pertanyaan sebelum mulai pakai SAKU.' : 'Questions before starting with SAKU.'}
          description={locale === 'id' ? 'Jawaban singkat untuk hal yang biasanya bikin ragu sebelum mulai mencatat uang dengan AI.' : 'Short answers to common doubts before tracking money with AI.'}
        />

        <div className="mt-12 space-y-5">
          {items.map((item, i) => {
            const isOpen = open === i

            return (
              <div
                key={item.q}
                className={cn(
                  'landing-mobile-hover relative overflow-hidden rounded-3xl border border-[#17120f]/25 bg-[#fffaf6] shadow-[0_16px_40px_rgba(23,18,15,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50',
                  isOpen && 'bg-brand-100',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="relative flex w-full items-center justify-between gap-5 px-6 py-6 text-left transition-colors duration-300 sm:px-7"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#17120f]/45 text-sm font-black',
                        isOpen
                          ? 'bg-brand-500 text-[#17120f]'
                          : 'bg-[#fddf82] text-[#17120f]'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <span className="text-sm font-semibold text-slate-950 sm:text-base">
                      {item.q}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      isOpen
                        ? 'border border-[#17120f]/45 bg-brand-500 text-[#17120f]'
                        : 'border border-[#17120f]/25 bg-white text-[#17120f]'
                    )}
                  >
                    <HiOutlineChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </span>
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mx-6 border-t border-[#17120f]/10 px-0 py-6 sm:mx-7">
                      <p className="text-sm leading-7 text-[#4f4540]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
