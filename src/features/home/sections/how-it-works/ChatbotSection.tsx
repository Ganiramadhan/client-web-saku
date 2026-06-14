import { RiBarChartGroupedFill, RiBrainLine, RiLineChartLine, RiMoneyDollarCircleLine, RiPieChart2Line, RiSendPlaneLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

export function ChatbotSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const categories = [
    { cat: isId ? 'Makanan & Minuman' : 'Food & Drink', pct: 32, value: 'Rp 420.000', color: 'bg-brand-500' },
    { cat: isId ? 'Transportasi' : 'Transportation', pct: 21, value: 'Rp 275.000', color: 'bg-[#fddf82]' },
    { cat: isId ? 'Belanja' : 'Shopping', pct: 18, value: 'Rp 236.000', color: 'bg-[#17120f]' },
  ]
  const qaItems = [
    {
      Icon: RiBarChartGroupedFill,
      color: 'text-brand-700',
      bg: '#ffe4dc',
      border: '#17120f',
      q: isId ? 'Berapa pengeluaran hari ini?' : 'How much did I spend today?',
      a: isId ? 'Kamu mengeluarkan Rp 83.000 dari 3 transaksi.' : 'You spent Rp 83.000 across 3 transactions.',
    },
    {
      Icon: RiPieChart2Line,
      color: 'text-[#17120f]',
      bg: '#fddf82',
      border: '#17120f',
      q: isId ? 'Kategori apa yang paling besar?' : 'What category is the highest?',
      a: isId ? 'Food & Drink jadi kategori terbesar bulan ini.' : 'Food & Drink is your top category this month.',
    },
    {
      Icon: RiLineChartLine,
      color: 'text-emerald-700',
      bg: '#ecfdf5',
      border: '#17120f',
      q: isId ? 'Apakah budget masih aman?' : 'Am I on track?',
      a: isId ? 'Kamu sudah memakai 64% dari budget bulanan.' : 'You used 64% of your monthly budget.',
    },
    {
      Icon: RiMoneyDollarCircleLine,
      color: 'text-[#17120f]',
      bg: '#fffaf6',
      border: '#17120f',
      q: isId ? 'Tampilkan pengeluaran terbesar' : 'Show my biggest expense',
      a: isId ? 'Pengeluaran terbesar kamu Rp 750.000.' : 'Your largest expense is Rp 750.000.',
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-brand-700">
          {isId ? 'Pertanyaan yang Bisa Ditanyakan' : 'What You Can Ask'}
        </p>

        {qaItems.map((item) => (
          <div
            key={item.q}
            className="group relative overflow-hidden rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-5 shadow-[5px_5px_0_#17120f] transition-all duration-300 hover:-translate-y-1 hover:bg-[#fddf82]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute right-4 top-4 h-8 w-8 rounded-full border-2 border-[#17120f] bg-brand-200" />
            </div>

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#17120f] shadow-[3px_3px_0_#17120f]',
                  item.color
                )}
                style={{
                  background: item.bg,
                  borderColor: item.border,
                }}
              >
                <item.Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="mb-1 text-sm font-black text-[#17120f]">"{item.q}"</p>
                <p className="text-sm leading-6 text-[#4f4540]">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-[#fffaf6] shadow-[8px_8px_0_#17120f] lg:sticky lg:top-28"
      >
        <div className="flex items-center gap-3 border-b-2 border-[#17120f] bg-brand-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#17120f] bg-brand-500 text-[#17120f] shadow-[3px_3px_0_#17120f]">
            <RiBrainLine className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-black text-[#17120f]">{isId ? 'Asisten Finansial' : 'Finance Assistant'}</p>
            <p className="text-xs text-[#4f4540]">{isId ? 'Tanya kondisi uangmu' : 'Ask anything about money'}</p>
          </div>

          <div className="ml-auto rounded-full border-2 border-[#17120f] bg-[#fddf82] px-3 py-1 text-xs font-black text-[#17120f]">
            {isId ? 'Dibantu AI' : 'AI Powered'}
          </div>
        </div>

        <div className="space-y-3 bg-[#f6eee8] p-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: isId ? 'Hari ini' : 'Today', value: 'Rp 83k' },
              { label: isId ? 'Budget' : 'Budget', value: '64%' },
              { label: isId ? 'Aman' : 'Health', value: isId ? 'Cukup' : 'Good' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border-2 border-[#17120f] bg-[#fffaf6] p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#4f4540]">{item.label}</p>
                <p className="mt-1 text-sm font-black text-[#17120f]">{item.value}</p>
              </div>
            ))}
          </div>

          <ChatBubble
            sender="user"
            text={isId ? 'Ringkas kondisi keuangan bulan ini' : 'Summarize my finances this month'}
            accentColor="coral"
          />

          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-3xl rounded-bl-md border-2 border-[#17120f] bg-[#fffaf6] px-4 py-4 text-sm text-[#4f4540] shadow-[5px_5px_0_#17120f]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-black text-[#17120f]">
                    <RiPieChart2Line className="h-4 w-4 text-brand-600" />
                    {isId ? 'Insight Bulanan' : 'Monthly Insight'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {isId
                      ? 'Pengeluaran naik 12% dari minggu lalu. Kategori makanan masih paling dominan.'
                      : 'Spending is up 12% from last week. Food remains the dominant category.'}
                  </p>
                </div>
                <span className="rounded-full border-2 border-[#17120f] bg-[#fddf82] px-2.5 py-1 text-[11px] font-black text-[#17120f]">
                  {isId ? 'Aksi' : 'Action'}
                </span>
              </div>

              {categories.map((c) => (
                <div key={c.cat} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">{c.cat}</span>
                    <span className="font-bold text-slate-800">{c.value}</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', c.color)}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-4 rounded-2xl border-2 border-[#17120f] bg-brand-100 p-3">
                <p className="text-xs font-black leading-5 text-[#17120f]">
                  {isId
                    ? 'Rekomendasi: turunkan batas makan harian ke Rp 65.000 untuk menjaga saving rate.'
                    : 'Recommendation: set your daily food limit to Rp 65,000 to protect your saving rate.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-[#17120f] bg-[#fffaf6] px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border-2 border-[#17120f] bg-white px-3 py-2.5">
            <input
              readOnly
              placeholder={isId ? 'Tanya apa saja tentang finansialmu...' : 'Ask anything about your finances...'}
              className="flex-1 bg-transparent text-sm text-slate-400 outline-none"
            />
            <RiSendPlaneLine className="h-4 w-4 text-brand-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({
  sender,
  text,
  accentColor = 'coral',
}: {
  sender: 'user' | 'ai'
  text: string
  accentColor?: 'coral' | 'ink'
}) {
  const isUser = sender === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-6',
          isUser
            ? cn(
                'rounded-br-md text-white shadow-md',
                accentColor === 'ink'
                  ? 'bg-[#17120f] shadow-[#17120f]/30'
                  : 'bg-brand-500 text-[#17120f] shadow-[#17120f]/30'
              )
            : 'rounded-bl-md border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm'
        )}
      >
        {text}
      </div>
    </div>
  )
}
