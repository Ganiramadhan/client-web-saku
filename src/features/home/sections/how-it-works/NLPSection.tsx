import { HiOutlineCheckCircle, HiOutlineEye } from 'react-icons/hi2'
import { RiBrainLine, RiChatSmile3Line, RiSendPlaneLine, RiSparklingLine, RiWalletLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

export function NLPSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const categoryCopy = {
    food: isId ? 'Makanan & Minuman' : 'Food & Drink',
    transportation: isId ? 'Transportasi' : 'Transportation',
  }
  const steps = [
    {
      num: '01',
      Icon: RiSendPlaneLine,
      title: isId ? 'Tulis natural' : 'Type naturally',
      desc: isId ? 'Masukkan transaksi seperti chat biasa.' : 'Write expenses like a normal chat message.',
      example: '"lunch di warteg 35 ribu"',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
    },
    {
      num: '02',
      Icon: RiBrainLine,
      title: isId ? 'AI memahami konteks' : 'AI understands',
      desc: isId ? 'SAKU membaca nominal, merchant, kategori, dan wallet.' : 'SAKU detects amount, merchant, category, and wallet.',
      example: 'Warteg · Rp 35.000 · Food',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
    },
    {
      num: '03',
      Icon: HiOutlineEye,
      title: isId ? 'Preview dulu' : 'Preview first',
      desc: isId ? 'Cek dan edit hasil AI sebelum disimpan.' : 'Review and edit the result before saving.',
      example: isId ? 'Konfirmasi atau edit transaksi' : 'Confirm or edit transaction',
      color: 'text-amber-600',
      bg: 'rgba(255,251,235,0.90)',
      border: 'rgba(253,230,138,0.70)',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: isId ? 'Simpan instan' : 'Save instantly',
      desc: isId ? 'Transaksi tersimpan ke wallet setelah dikonfirmasi.' : 'Confirmed transactions are saved to your wallet.',
      example: isId ? 'Tersimpan ke Main Wallet' : 'Saved to Main Wallet',
      color: 'text-emerald-600',
      bg: 'rgba(236,253,245,0.90)',
      border: 'rgba(167,243,208,0.70)',
    },
  ]

  const chatMessages = [
    {
      sender: 'user',
      text: 'bought coffee 25k',
    },
    {
      sender: 'ai',
      preview: {
        merchant: 'Starbucks',
        amount: 'Rp 25.000',
        catKey: 'food' as const,
        wallet: 'Main Wallet',
      },
    },
    {
      sender: 'user',
      text: 'gojek 18k',
    },
    {
      sender: 'ai',
      preview: {
        merchant: 'Gojek',
        amount: 'Rp 18.000',
        catKey: 'transportation' as const,
        wallet: 'Main Wallet',
      },
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          {isId ? 'Alur Chat Transaksi' : 'How NLP Recording Works'}
        </p>

        {steps.map((s) => (
          <div
            key={s.num}
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
              <div className="absolute inset-0 rounded-3xl border border-blue-300/30" />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />
            </div>

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105',
                  s.color
                )}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                }}
              >
                <s.Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">{s.num}</span>
                  <h4 className="text-sm font-bold text-slate-950">{s.title}</h4>
                </div>

                <p className="text-sm leading-6 text-slate-500">{s.desc}</p>

                <div className="mt-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">{s.example}</p>
                </div>
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
            '0 24px 70px rgba(37,99,235,0.10), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <RiChatSmile3Line className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">SAKU AI</p>
            <p className="text-xs text-slate-400">{isId ? 'Catat transaksi natural' : 'Natural language recording'}</p>
          </div>

          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {isId ? 'Aktif' : 'Online'}
          </span>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto bg-slate-50/60 p-5">
          {chatMessages.map((msg, i) => (
            <div key={i}>
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white shadow-md shadow-blue-200/70">
                    {msg.text}
                  </div>
                </div>
              ) : msg.preview ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] overflow-hidden rounded-3xl rounded-bl-md border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/50">
                    <div className="px-4 pb-3 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <RiSparklingLine className="h-4 w-4 text-blue-500" />
                        <p className="text-xs font-bold text-blue-600">
                          {isId ? 'Preview Transaksi' : 'Transaction Preview'}
                        </p>
                      </div>

                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-600 shadow-sm shadow-blue-100/60">
                          {msg.preview.merchant.slice(0, 1)}
                        </span>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {msg.preview.merchant}
                          </p>
                          <p className="text-xs text-slate-400">{categoryCopy[msg.preview.catKey]}</p>
                        </div>

                        <span className="ml-auto text-base font-extrabold text-rose-500">
                          -{msg.preview.amount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <RiWalletLine className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {msg.preview.wallet}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">{isId ? 'Baru saja' : 'Just now'}</span>
                      </div>
                    </div>

                    <div className="flex border-t border-slate-200/70">
                      <button className="flex-1 py-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50">
                        {isId ? 'Edit' : 'Edit'}
                      </button>
                      <button className="flex-1 py-3 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50">
                        {isId ? 'Konfirmasi' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200/70 bg-white/60 px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2.5">
            <input
              readOnly
              placeholder={isId ? 'Tulis seperti "makan malam 80k"...' : 'Type like "dinner 80k"...'}
              className="flex-1 bg-transparent text-sm text-slate-400 placeholder-slate-300 outline-none"
            />
            <RiSendPlaneLine className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
