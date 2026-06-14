import { RiDoubleQuotesL, RiStarFill } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { SectionHeading } from '../components/SectionHeading'

export function SocialProofSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const testimonials = isId
    ? [
        {
          quote: 'SAKU bikin catatan harian jauh lebih ringan. Tinggal chat transaksi, lalu review sebelum simpan.',
          name: 'Raka Pratama',
          role: 'Freelancer',
          avatar: 'R',
        },
        {
          quote: 'Multi wallet-nya membantu banget buat pisahin cash, rekening utama, dan dana darurat.',
          name: 'Nadia Putri',
          role: 'Karyawan',
          avatar: 'N',
        },
        {
          quote: 'Scan struk dan insight AI-nya bikin pengeluaran bulanan lebih cepat kebaca.',
          name: 'Dimas Arya',
          role: 'Owner UMKM',
          avatar: 'D',
        },
      ]
    : [
        {
          quote: 'SAKU makes daily tracking lighter. I can chat a transaction, then review it before saving.',
          name: 'Raka Pratama',
          role: 'Freelancer',
          avatar: 'R',
        },
        {
          quote: 'The multi-wallet flow helps me separate cash, my main bank account, and emergency funds.',
          name: 'Nadia Putri',
          role: 'Employee',
          avatar: 'N',
        },
        {
          quote: 'Receipt scanning and AI insights make monthly spending patterns easier to understand.',
          name: 'Dimas Arya',
          role: 'Small Business Owner',
          avatar: 'D',
        },
      ]

  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={isId ? 'Apa Kata Mereka' : 'User Reviews'}
          title={isId ? 'Dipercaya untuk rutinitas uang harian.' : 'Trusted for daily money routines.'}
          description={isId ? 'Review singkat dari pengguna yang ingin mencatat uang tanpa spreadsheet dan tanpa ribet.' : 'Short reviews from users who want to track money without spreadsheets or friction.'}
        />

        <div className="mt-10 grid auto-rows-fr gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="flex h-full min-h-[250px] flex-col rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-5 shadow-[6px_6px_0_#17120f] transition duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:bg-brand-50">
              <div className="flex items-center justify-between gap-4">
                <RiDoubleQuotesL className="h-7 w-7 text-brand-500" />
                <div className="flex items-center gap-0.5 text-amber-400" aria-label="5 star rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <RiStarFill key={index} className="h-3.5 w-3.5" />
                  ))}
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm leading-7 text-[#4f4540]">{item.quote}</p>
              <div className="mt-6 flex items-center gap-3 border-t-2 border-[#17120f]/10 pt-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#17120f] bg-brand-500 text-sm font-black text-[#17120f] shadow-[3px_3px_0_#17120f]">
                  {item.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#17120f]">{item.name}</p>
                  <p className="mt-1 inline-flex rounded-full border border-[#17120f] bg-[#fddf82] px-2 py-0.5 text-[10px] font-black text-[#17120f]">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}

export default SocialProofSection
