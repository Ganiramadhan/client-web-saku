import { RiBrainLine, RiChatSmile3Line, RiPieChart2Line, RiScanLine, RiShieldCheckLine, RiWallet3Line } from 'react-icons/ri'
import { useLocale, useT } from '@/i18n'
import { SectionHeading } from '../components/SectionHeading'

export function FeaturesSection() {
  const t = useT()
  const { locale } = useLocale()
  const isId = locale === 'id'
  const core = isId
    ? [
        {
          Icon: RiChatSmile3Line,
          title: 'AI Transaction Assistant',
          desc: 'Catat transaksi dengan bahasa sehari-hari. SAKU mengubahnya menjadi preview yang siap kamu cek.',
          example: '“beli nasi padang 35rb pakai cash”',
        },
        {
          Icon: RiScanLine,
          title: 'OCR Receipt Scanner',
          desc: 'Foto struk, lalu cek merchant, tanggal, kategori, dan nominal tanpa mengetik ulang semuanya.',
          example: 'Cocok untuk belanja, makan, dan kebutuhan kerja.',
        },
        {
          Icon: RiBrainLine,
          title: 'Financial Insight',
          desc: 'Lihat kategori yang paling boros, sisa ruang belanja, budget yang menipis, dan rekomendasi sederhana.',
          example: 'Bukan angka mentah, tapi arahan yang bisa dipakai.',
        },
      ]
    : [
        {
          Icon: RiChatSmile3Line,
          title: 'AI Transaction Assistant',
          desc: 'Record transactions in natural language. SAKU turns them into review-ready previews.',
          example: '“lunch 35k with cash”',
        },
        {
          Icon: RiScanLine,
          title: 'OCR Receipt Scanner',
          desc: 'Scan receipts, then check merchant, date, category, and amount without retyping everything.',
          example: 'Useful for food, shopping, and work expenses.',
        },
        {
          Icon: RiBrainLine,
          title: 'Financial Insight',
          desc: 'See top spending categories, safe spending room, tight budgets, and simple recommendations.',
          example: 'Not raw numbers, but guidance you can use.',
        },
      ]
  const cards = [
    {
      Icon: RiChatSmile3Line,
      title: isId ? 'Chat with AI' : 'Chat with AI',
      desc: isId ? 'Ketik transaksi seperti ngobrol. AI menyiapkan detailnya untuk kamu cek.' : 'Type transactions naturally. AI prepares details for review.',
      bg: 'bg-brand-100',
      className: 'lg:col-span-2 lg:min-h-[300px]',
      visual: <ChatMiniMockup isId={isId} />,
    },
    {
      Icon: RiScanLine,
      title: isId ? 'Scan Struk (OCR)' : 'Receipt Scanner',
      desc: isId ? 'Foto struk belanja, lalu nominal, merchant, dan kategori terbaca otomatis.' : 'Snap receipts and extract amount, merchant, and category.',
      bg: 'bg-emerald-100',
      className: 'lg:min-h-[300px]',
      visual: <ReceiptDoodle />,
    },
    {
      Icon: RiWallet3Line,
      title: 'Multi Wallet',
      desc: isId ? 'Pisahkan cash, bank, e-wallet, tabungan, dan dana tujuan.' : 'Separate cash, bank, e-wallet, savings, and goals.',
      bg: 'bg-[#fffaf6]',
      className: 'lg:min-h-[240px]',
      visual: <WalletDoodle />,
    },
    {
      Icon: RiPieChart2Line,
      title: 'Budget Tracker',
      desc: isId ? 'Pantau batas pengeluaran sebelum kebablasan.' : 'Track spending limits before they go too far.',
      bg: 'bg-[#fddf82]',
      className: 'lg:min-h-[240px]',
      visual: <BudgetMiniChart />,
    },
    {
      Icon: RiBrainLine,
      title: isId ? 'Insight Harian' : 'Daily Insight',
      desc: isId ? 'AI membaca pola pengeluaran dan kasih saran yang bisa dilakukan.' : 'AI reads spending patterns and gives practical guidance.',
      bg: 'bg-brand-100',
      className: 'lg:min-h-[220px]',
      visual: <InsightMiniMockup isId={isId} />,
    },
    {
      Icon: RiShieldCheckLine,
      title: isId ? 'Aman & Privat' : 'Safe & Private',
      desc: isId ? 'Data keuanganmu tetap milikmu. AI membantu tanpa mengambil keputusan sepihak.' : 'Your financial data stays yours. AI helps without taking over decisions.',
      bg: 'bg-[#fffaf6]',
      className: 'lg:min-h-[220px]',
      visual: <SecurityDoodle />,
    },
  ]

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.features}
          title={isId ? 'Semua yang kamu butuhkan, dalam satu aplikasi.' : 'Everything you need, in one app.'}
          description={isId ? 'SAKU dibuat untuk rutinitas uang harian: catat cepat, review aman, dan pahami pola tanpa spreadsheet.' : 'SAKU is built for daily money routines: fast input, safe review, and clear patterns without spreadsheets.'}
        />

        <div className="mt-14 grid auto-rows-[minmax(210px,auto)] gap-6 lg:grid-cols-3">
          {cards.map(({ Icon, title, desc, bg, visual, className }, index) => (
            <article
              key={title}
              className={`group relative overflow-hidden rounded-[2rem] border border-[#17120f]/55 ${bg} p-6 shadow-[0_18px_50px_rgba(23,18,15,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(23,18,15,0.12)] ${className ?? ''}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-[45%_55%_35%_65%] border border-[#17120f]/30 bg-white/45" />
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-[#17120f]/60 bg-[#fffaf6] text-[#17120f] shadow-[0_8px_20px_rgba(23,18,15,0.08)] transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <div className="relative mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#17120f]">{title}</h3>
                  <p className="mt-2 max-w-md text-sm font-medium leading-6 text-[#4f4540]">{desc}</p>
                  {index < core.length ? (
                    <p className="mt-4 inline-flex rounded-full border border-[#17120f]/45 bg-[#fffaf6] px-3 py-1 text-[11px] font-black text-[#17120f]">
                      {core[index]?.example}
                    </p>
                  ) : null}
                </div>
                <div className="justify-self-end">
                  {visual}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ChatMiniMockup({ isId }: { isId: boolean }) {
  return (
    <div className="w-52 rounded-3xl border border-[#17120f]/55 bg-[#fffaf6] p-3 shadow-[0_14px_36px_rgba(23,18,15,0.10)]">
      <div className="ml-auto w-fit rounded-2xl border border-[#17120f]/60 bg-brand-500 px-3 py-2 text-xs font-black text-[#17120f]">
        beli nasi padang 35rb
      </div>
      <div className="mt-3 rounded-2xl border border-[#17120f]/35 bg-white px-3 py-2 text-xs font-bold text-[#4f4540]">
        ✨ {isId ? 'Transaksi berhasil dicatat' : 'Transaction ready'}
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
          <span>{isId ? 'Kategori' : 'Category'}</span><strong>{isId ? 'Makanan' : 'Food'}</strong>
          <span>Wallet</span><strong>Cash</strong>
        </div>
      </div>
    </div>
  )
}

function ReceiptDoodle() {
  return (
    <svg className="h-28 w-28 animate-[saku-float_7s_ease-in-out_infinite]" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path className="saku-doodle-line" d="M32 13h49l8 10v83l-9-6-8 6-8-6-8 6-8-6-8 6-8-6V13Z" fill="#fffaf6" strokeWidth="4" />
      <path className="saku-doodle-line" d="M45 39h32M45 56h24M45 73h29" strokeWidth="4" />
      <path d="M34 27h53" stroke="#ff6f61" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

function WalletDoodle() {
  return (
    <svg className="h-28 w-32" viewBox="0 0 140 120" fill="none" aria-hidden="true">
      <path className="saku-doodle-line" d="M19 42h87c12 0 20 8 20 20v28c0 12-8 20-20 20H28c-11 0-18-7-18-18V51c0-5 4-9 9-9Z" fill="#ff9d8d" strokeWidth="4" />
      <path className="saku-doodle-line" d="M34 27l66 15H24c-7 0-10-10-3-13l4-2c3-1 6-1 9 0Z" fill="#fffaf6" strokeWidth="4" />
      <path className="saku-doodle-line" d="M92 65h35v25H92c-7 0-12-5-12-12v-1c0-7 5-12 12-12Z" fill="#fddf82" strokeWidth="4" />
      <circle cx="99" cy="78" r="5" fill="#17120f" />
    </svg>
  )
}

function BudgetMiniChart() {
  return (
    <div className="relative h-28 w-32">
      <div className="absolute bottom-2 left-1 h-20 w-20 rounded-full border-[14px] border-[#17120f] bg-[#fffaf6]" />
      <div className="absolute bottom-2 left-1 h-20 w-20 rounded-full border-[14px] border-brand-500 border-l-transparent border-t-transparent" />
      <div className="absolute right-0 top-3 rounded-2xl border border-[#17120f]/55 bg-[#fffaf6] px-3 py-2 text-xs font-black shadow-[0_10px_24px_rgba(23,18,15,0.10)]">72%</div>
    </div>
  )
}

function InsightMiniMockup({ isId }: { isId: boolean }) {
  return (
    <div className="w-56 rounded-3xl border border-[#17120f]/70 bg-[#17120f] p-3 text-white shadow-[0_14px_36px_rgba(23,18,15,0.14)]">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-200">AI Insight</p>
      <p className="mt-2 text-xs leading-5 text-white/80">
        {isId ? 'Budget makan tersisa 28%. Aman kalau belanja harian di bawah Rp65rb.' : 'Food budget has 28% left. Stay under Rp65k/day.'}
      </p>
      <div className="mt-3 h-3 rounded-full border-2 border-white bg-white">
        <div className="h-full w-[72%] rounded-full bg-brand-500" />
      </div>
    </div>
  )
}

function SecurityDoodle() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path className="saku-doodle-line" d="M50 10l31 12v24c0 21-13 35-31 44C32 81 19 67 19 46V22l31-12Z" fill="#ffe4dc" strokeWidth="3" />
      <path className="saku-doodle-line" d="M38 50l8 8 18-23" strokeWidth="5" />
    </svg>
  )
}

export default FeaturesSection
