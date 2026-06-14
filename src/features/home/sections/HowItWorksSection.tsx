import { RiBrainLine, RiChatSmile3Line, RiReceiptLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { SectionHeading } from '../components/SectionHeading'

export function HowItWorksSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const steps = [
    {
      Icon: RiChatSmile3Line,
      number: '01',
      title: isId ? 'Chat atau scan struk' : 'Chat or scan a receipt',
      desc: isId
        ? 'Tulis transaksi seperti chat biasa, atau foto struk belanja yang ingin dicatat.'
        : 'Type a transaction naturally, or upload a receipt you want to record.',
      bg: 'bg-brand-100',
      visual: <StepChatVisual isId={isId} />,
    },
    {
      Icon: RiReceiptLine,
      number: '02',
      title: isId ? 'AI mencatat otomatis' : 'AI records it automatically',
      desc: isId
        ? 'SAKU membaca nominal, wallet, kategori, merchant, dan tanggal menjadi preview siap cek.'
        : 'SAKU reads amount, wallet, category, merchant, and date into a review-ready preview.',
      bg: 'bg-[#fffaf6]',
      visual: <StepAiVisual />,
    },
    {
      Icon: RiBrainLine,
      number: '03',
      title: isId ? 'Dapatkan insight harian' : 'Get daily insight',
      desc: isId
        ? 'Lihat pola pengeluaran, budget yang menipis, dan saran sederhana untuk keputusan hari ini.'
        : 'See spending patterns, tight budgets, and simple guidance for today’s decisions.',
      bg: 'bg-[#fddf82]',
      visual: <StepInsightVisual />,
    },
  ]

  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={isId ? 'Cara Kerja' : 'How It Works'}
          title={isId ? '3 langkah mudah kelola uang harianmu.' : '3 simple steps to manage daily money.'}
          description={isId ? 'Alurnya dibuat singkat: input cepat, AI bantu susun, lalu kamu dapat insight yang mudah ditindaklanjuti.' : 'The flow stays short: quick input, AI organizes it, then you get actionable insight.'}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map(({ Icon, number, title, desc, bg, visual }) => (
            <article
              key={number}
              className={`group relative overflow-hidden rounded-[2rem] border border-[#17120f]/55 ${bg} p-6 shadow-[0_18px_50px_rgba(23,18,15,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(23,18,15,0.11)]`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#17120f]/55 bg-[#fffaf6] text-[#17120f] shadow-[0_10px_24px_rgba(23,18,15,0.08)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-sm font-black text-[#17120f]/45">{number}</span>
              </div>

              <div className="mt-8 flex min-h-[150px] items-center justify-center">
                {visual}
              </div>

              <h3 className="mt-8 text-xl font-black tracking-tight text-[#17120f]">{title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-[#4f4540]">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function StepChatVisual({ isId }: { isId: boolean }) {
  return (
    <div className="w-full max-w-[260px] rounded-3xl border border-[#17120f]/55 bg-[#fffaf6] p-4 shadow-[0_14px_36px_rgba(23,18,15,0.08)]">
      <div className="w-fit rounded-2xl bg-[#f6eee8] px-3 py-2 text-xs font-black text-[#17120f]">
        {isId ? 'beli kopi 25rb cash' : 'coffee 25k cash'}
      </div>
      <div className="mt-3 ml-auto w-fit rounded-2xl bg-brand-500 px-3 py-2 text-xs font-black text-[#17120f]">
        {isId ? 'Preview siap dicek' : 'Preview ready'}
      </div>
    </div>
  )
}

function StepAiVisual() {
  return (
    <svg className="h-36 w-44 animate-[saku-float_7s_ease-in-out_infinite]" viewBox="0 0 176 144" fill="none" aria-hidden="true">
      <rect x="22" y="24" width="132" height="92" rx="24" fill="#fffaf6" stroke="#17120f" strokeOpacity=".65" strokeWidth="2" />
      <circle cx="88" cy="70" r="28" fill="#17120f" />
      <path d="M76 70h24M88 58v24" stroke="#ff9d8d" strokeWidth="5" strokeLinecap="round" />
      <path d="M48 109l-15 20M128 109l15 20" stroke="#17120f" strokeOpacity=".65" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 48c-10-9-11-19-3-30M140 48c10-9 11-19 3-30" stroke="#17120f" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      <path d="M51 39h26M99 101h29" stroke="#ff6f61" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

function StepInsightVisual() {
  return (
    <div className="grid w-full max-w-[250px] gap-3">
      <div className="rounded-2xl border border-[#17120f]/45 bg-[#fffaf6] p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-[#17120f]">
          <span>Budget</span>
          <span>72%</span>
        </div>
        <div className="h-3 rounded-full bg-[#f6eee8]">
          <div className="h-full w-[72%] rounded-full bg-brand-500" />
        </div>
      </div>
      <div className="rounded-2xl bg-[#17120f] p-3 text-xs font-bold leading-5 text-white/80">
        AI: aman kalau belanja harian di bawah Rp65rb.
      </div>
    </div>
  )
}

export default HowItWorksSection
