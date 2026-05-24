import { RiBarChartGroupedFill, RiBrainLine, RiLineChartLine, RiMoneyDollarCircleLine, RiPieChart2Line, RiSendPlaneLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

export function ChatbotSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const categories = [
    { cat: isId ? 'Makanan & Minuman' : 'Food & Drink', pct: 32, value: 'Rp 420.000', color: 'bg-violet-500' },
    { cat: isId ? 'Transportasi' : 'Transportation', pct: 21, value: 'Rp 275.000', color: 'bg-blue-500' },
    { cat: isId ? 'Belanja' : 'Shopping', pct: 18, value: 'Rp 236.000', color: 'bg-emerald-500' },
  ]
  const qaItems = [
    {
      Icon: RiBarChartGroupedFill,
      color: 'text-blue-500',
      bg: 'rgba(239,246,255,0.80)',
      border: 'rgba(191,219,254,0.60)',
      q: isId ? 'Berapa pengeluaran hari ini?' : 'How much did I spend today?',
      a: isId ? 'Kamu mengeluarkan Rp 83.000 dari 3 transaksi.' : 'You spent Rp 83.000 across 3 transactions.',
    },
    {
      Icon: RiPieChart2Line,
      color: 'text-violet-500',
      bg: 'rgba(245,243,255,0.80)',
      border: 'rgba(221,214,254,0.60)',
      q: isId ? 'Kategori apa yang paling besar?' : 'What category is the highest?',
      a: isId ? 'Food & Drink jadi kategori terbesar bulan ini.' : 'Food & Drink is your top category this month.',
    },
    {
      Icon: RiLineChartLine,
      color: 'text-emerald-500',
      bg: 'rgba(236,253,245,0.80)',
      border: 'rgba(167,243,208,0.60)',
      q: isId ? 'Apakah budget masih aman?' : 'Am I on track?',
      a: isId ? 'Kamu sudah memakai 64% dari budget bulanan.' : 'You used 64% of your monthly budget.',
    },
    {
      Icon: RiMoneyDollarCircleLine,
      color: 'text-amber-500',
      bg: 'rgba(255,251,235,0.80)',
      border: 'rgba(253,230,138,0.60)',
      q: isId ? 'Tampilkan pengeluaran terbesar' : 'Show my biggest expense',
      a: isId ? 'Pengeluaran terbesar kamu Rp 750.000.' : 'Your largest expense is Rp 750.000.',
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
          {isId ? 'Pertanyaan yang Bisa Ditanyakan' : 'What You Can Ask'}
        </p>

        {qaItems.map((item) => (
          <div
            key={item.q}
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow:
                '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute inset-0 rounded-3xl border border-violet-300/30" />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
            </div>

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  item.color
                )}
                style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <item.Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-slate-900">"{item.q}"</p>
                <p className="text-sm leading-6 text-slate-500">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-3xl lg:sticky lg:top-28"
        style={{
          background: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow:
            '0 24px 70px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <RiBrainLine className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">{isId ? 'Asisten Finansial' : 'Finance Assistant'}</p>
            <p className="text-xs text-slate-400">{isId ? 'Tanya kondisi uangmu' : 'Ask anything about money'}</p>
          </div>

          <div className="ml-auto rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
            {isId ? 'Dibantu AI' : 'AI Powered'}
          </div>
        </div>

        <div className="space-y-3 bg-violet-50/40 p-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: isId ? 'Hari ini' : 'Today', value: 'Rp 83k' },
              { label: isId ? 'Budget' : 'Budget', value: '64%' },
              { label: isId ? 'Aman' : 'Health', value: isId ? 'Cukup' : 'Good' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <ChatBubble
            sender="user"
            text={isId ? 'Ringkas kondisi keuangan bulan ini' : 'Summarize my finances this month'}
            accentColor="violet"
          />

          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-3xl rounded-bl-md border border-slate-200/80 bg-white/90 px-4 py-4 text-sm text-slate-700 shadow-lg shadow-slate-200/50">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-bold text-slate-900">
                    <RiPieChart2Line className="h-4 w-4 text-violet-500" />
                    {isId ? 'Insight Bulanan' : 'Monthly Insight'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {isId
                      ? 'Pengeluaran naik 12% dari minggu lalu. Kategori makanan masih paling dominan.'
                      : 'Spending is up 12% from last week. Food remains the dominant category.'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
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

              <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
                <p className="text-xs font-semibold leading-5 text-violet-700">
                  {isId
                    ? 'Rekomendasi: turunkan batas makan harian ke Rp 65.000 untuk menjaga saving rate.'
                    : 'Recommendation: set your daily food limit to Rp 65,000 to protect your saving rate.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/70 bg-white/60 px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white/80 px-3 py-2.5">
            <input
              readOnly
              placeholder={isId ? 'Tanya apa saja tentang finansialmu...' : 'Ask anything about your finances...'}
              className="flex-1 bg-transparent text-sm text-slate-400 outline-none"
            />
            <RiSendPlaneLine className="h-4 w-4 text-violet-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({
  sender,
  text,
  accentColor = 'blue',
}: {
  sender: 'user' | 'ai'
  text: string
  accentColor?: 'blue' | 'violet'
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
                accentColor === 'violet'
                  ? 'bg-violet-600 shadow-violet-200/70'
                  : 'bg-blue-600 shadow-blue-200/70'
              )
            : 'rounded-bl-md border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm'
        )}
      >
        {text}
      </div>
    </div>
  )
}
