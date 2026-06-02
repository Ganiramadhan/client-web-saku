import { RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { SectionHeading } from '../components/SectionHeading'

export function ProblemSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'

  const problems = isId
    ? [
        'Lupa mencatat pengeluaran harian',
        'Tidak tahu uang habis untuk apa',
        'Struk menumpuk dan sulit direkap',
        'Sulit memantau cash, rekening, dan e-wallet',
        'Tagihan berulang sering terlewat',
      ]
    : [
        'Forgetting daily expenses',
        'Not knowing where money went',
        'Receipts pile up and are hard to recap',
        'Cash, bank accounts, and e-wallets are scattered',
        'Recurring bills are easy to miss',
      ]

  const solutions = isId
    ? [
        'Catat transaksi cukup pakai bahasa sehari-hari',
        'Insight kategori dan cashflow otomatis',
        'Scan struk jadi transaksi siap review',
        'Semua wallet dalam satu dashboard',
        'Pengingat tagihan dan transaksi berulang',
      ]
    : [
        'Record transactions using everyday language',
        'Automatic category and cashflow insights',
        'Scan receipts into review-ready transactions',
        'All wallets in one dashboard',
        'Billing reminders and recurring transactions',
      ]

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={isId ? 'Masalah & solusi' : 'Problems & solutions'}
          title={isId
            ? 'Masalah keuangan harian, diselesaikan dengan cara yang lebih simpel.'
            : 'Daily finance problems, solved in a simpler way.'}
          description={isId
            ? 'SAKU membantu kamu mencatat, membaca struk, merapikan wallet, dan memahami arus kas tanpa harus rekap semuanya manual.'
            : 'SAKU helps you record expenses, scan receipts, organize wallets, and understand cashflow without manually recapping everything.'}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
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
      className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8 ${
        isSolution
          ? 'border-emerald-100 bg-white/90 shadow-emerald-100/60'
          : 'border-rose-100 bg-white/90 shadow-rose-100/60'
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
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-rose-100 bg-rose-50 text-rose-700'
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
                ? 'border-emerald-100/70 bg-emerald-50/40 hover:border-emerald-200 hover:bg-emerald-50/60'
                : 'border-rose-100/70 bg-rose-50/40 hover:border-rose-200 hover:bg-rose-50/60'
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isSolution ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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