import { useState } from 'react'
import { HiOutlineChevronDown } from 'react-icons/hi2'
import { useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { SectionHeading } from '../components/SectionHeading'

export function FAQSection() {
  const t = useT()
  const { locale } = useLocale()
  const isId = locale === 'id'
  const items = [
    {
      q: isId ? 'SAKU cocok untuk siapa?' : 'Who is SAKU for?',
      a: isId
        ? 'SAKU cocok untuk mahasiswa, karyawan, freelancer, dan siapa pun yang ingin memahami uang harian tanpa spreadsheet. Mulai dari transaksi kecil, lalu dashboard membantu membaca polanya.'
        : 'SAKU is built for students, employees, freelancers, and anyone who wants to understand daily money without spreadsheets. Start with small transactions, then the dashboard helps read the pattern.',
    },
    {
      q: isId ? 'Apakah transaksi langsung disimpan oleh AI?' : 'Does AI save transactions automatically?',
      a: isId
        ? 'Tidak dipaksa langsung. AI menyiapkan pratinjau transaksi terlebih dahulu, lalu kamu bisa cek nominal, wallet, kategori, tanggal, dan catatan sebelum menyimpan.'
        : 'Not forcefully. AI prepares a transaction preview first, so you can review the amount, wallet, category, date, and notes before saving.',
    },
    {
      q: isId ? 'Apa bedanya Free dan Pro?' : 'What is different between Free and Pro?',
      a: isId
        ? 'Free cukup untuk mulai mencatat dan mencoba AI/OCR dengan batas bulanan. Pro cocok kalau SAKU sudah dipakai harian: wallet lebih lega, AI dan OCR lebih banyak, split bill, recurring transaction, export, dan insight lebih lengkap.'
        : 'Free is enough to start tracking and try AI/OCR with monthly limits. Pro fits daily use: more wallets, more AI and OCR usage, split bill, recurring transactions, export, and richer insights.',
    },
    {
      q: isId ? 'Apakah data keuangan saya aman?' : 'Is my financial data safe?',
      a: isId
        ? 'SAKU tidak meminta password rekening bank. Akses mengikuti akun pengguna, hasil AI bisa direview, dan pembayaran diproses melalui Midtrans. Detail lengkap tersedia di Privacy Policy.'
        : 'SAKU does not ask for bank account passwords. Access follows user accounts, AI results can be reviewed, and payments are processed through Midtrans. Full details are available in the Privacy Policy.',
    },
    {
      q: isId ? 'Bagaimana cara kerja split bill?' : 'How do split bills work?',
      a: isId ? 'Masukkan pengeluaran bersama, tentukan peserta, lalu SAKU membantu membagi nominal dan memantau siapa yang sudah bayar.' : 'Add a shared expense, set participants, then SAKU helps split the amount and track who has paid.',
    },
    {
      q: isId ? 'Apakah bisa upgrade kapan saja?' : 'Can I upgrade anytime?',
      a: isId ? 'Bisa. Kamu bisa mulai dari Free, lalu upgrade ketika butuh kapasitas AI, OCR, wallet, dan fitur produktivitas yang lebih luas.' : 'Yes. You can start on Free, then upgrade when you need more AI, OCR, wallets, and productivity features.',
    },
  ]

  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.faq}
          title={isId ? 'Yang biasanya ditanyakan sebelum mulai.' : 'Common questions before getting started.'}
          description={isId ? 'Jawaban singkat untuk membantu kamu memutuskan apakah SAKU cocok dengan cara kamu mengatur uang.' : 'Short answers to help you decide whether SAKU fits the way you manage money.'}
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
