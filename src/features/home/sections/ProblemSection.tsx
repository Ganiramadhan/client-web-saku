import { RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { SectionHeading } from '../components/SectionHeading'

export function ProblemSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'

  const problems = isId
    ? [
        'Sering merasa uang habis, tapi tidak jelas larinya ke mana.',
        'Punya cash, bank, dan e-wallet, tapi susah lihat total sebenarnya.',
        'Mau rapi, tapi malas buka spreadsheet atau input manual panjang.',
      ]
    : [
        'Money runs out, but it is unclear where it actually went.',
        'Cash, bank, and e-wallet balances are hard to see as one picture.',
        'Tracking feels heavy when it depends on spreadsheets and manual input.',
      ]

  const solutions = isId
    ? [
        'Tulis transaksi seperti chat, SAKU ubah jadi preview yang bisa dicek.',
        'Scan struk dan biarkan AI membaca merchant, tanggal, kategori, dan nominal.',
        'Lihat dompet, budget, tagihan, dan insight dalam satu tampilan yang mudah dipahami.',
      ]
    : [
        'Type transactions naturally and SAKU turns them into review-ready previews.',
        'Scan receipts and let AI read merchant, date, category, and amount.',
        'See wallets, budgets, bills, and insights in one clear view.',
      ]

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={isId ? 'Kenapa SAKU' : 'Why SAKU'}
          title={isId
            ? 'Dibuat untuk orang yang ingin rapi tanpa ribet.'
            : 'Built for people who want clarity without the hassle.'}
          description={isId
            ? 'SAKU cocok untuk mahasiswa, karyawan, freelancer, dan siapa pun yang ingin memahami uang harian tanpa proses yang berat.'
            : 'SAKU fits students, employees, freelancers, and anyone who wants to understand daily money without heavy workflows.'}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <ProblemCard
            title={isId ? 'Masalah yang sering terjadi' : 'Common Problems'}
            tone="problem"
            items={problems}
            Icon={RiCloseLine}
          />

          <ProblemCard
            title={isId ? 'Solusi dari SAKU' : 'SAKU Solution'}
            tone="solution"
            items={solutions}
            Icon={RiCheckLine}
          />
        </div>
      </div>
    </section>
  )
}

function ProblemCard({
  title,
  items,
  tone,
  Icon,
}: {
  title: string
  items: string[]
  tone: 'problem' | 'solution'
  Icon: typeof RiCheckLine
}) {
  const isSolution = tone === 'solution'

  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border-2 border-[#17120f] p-6 shadow-[7px_7px_0_#17120f] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_#17120f] sm:p-8 ${
        isSolution
          ? 'bg-brand-100'
          : 'bg-[#fffaf6]'
      }`}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">
            {title}
          </h3>
        </div>

        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${
            isSolution
              ? 'border-[#17120f] bg-brand-500 text-[#17120f]'
              : 'border-[#17120f] bg-[#fddf82] text-[#17120f]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="relative mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
              isSolution
                ? 'border-[#17120f] bg-[#fffaf6] hover:bg-white'
                : 'border-[#17120f] bg-[#f6eee8] hover:bg-white'
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isSolution ? 'bg-brand-500 text-[#17120f]' : 'bg-[#fddf82] text-[#17120f]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>

            <p className="text-sm leading-6 text-slate-600">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProblemSection
