import { HiOutlineCheckCircle, HiOutlineEye } from 'react-icons/hi2'
import {
  RiBrainLine,
  RiChatSmile3Line,
  RiSendPlaneLine,
  RiSparklingLine,
  RiWalletLine,
} from 'react-icons/ri'
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
      desc: isId
        ? 'Masukkan transaksi seperti chat biasa.'
        : 'Write expenses like a normal chat message.',
      example: '"makan siang 35 ribu"',
      bg: '#ffe4dc',
      color: 'text-brand-700',
    },
    {
      num: '02',
      Icon: RiBrainLine,
      title: isId ? 'AI memahami konteks' : 'AI understands',
      desc: isId
        ? 'SAKU membaca nominal, merchant, kategori, dan wallet.'
        : 'SAKU detects amount, merchant, category, and wallet.',
      example: 'Warteg · Rp 35.000 · Food',
      bg: '#fddf82',
      color: 'text-[#17120f]',
    },
    {
      num: '03',
      Icon: HiOutlineEye,
      title: isId ? 'Preview dulu' : 'Preview first',
      desc: isId
        ? 'Cek dan edit hasil AI sebelum disimpan.'
        : 'Review and edit the result before saving.',
      example: isId ? 'Konfirmasi atau edit transaksi' : 'Confirm or edit transaction',
      bg: '#fffaf6',
      color: 'text-[#17120f]',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: isId ? 'Simpan instan' : 'Save instantly',
      desc: isId
        ? 'Transaksi masuk ke wallet setelah dikonfirmasi.'
        : 'Confirmed transactions are saved to your wallet.',
      example: isId ? 'Tersimpan ke Main Wallet' : 'Saved to Main Wallet',
      bg: '#ecfdf5',
      color: 'text-emerald-700',
    },
  ]

  const chatMessages = [
    {
      sender: 'user' as const,
      text: isId ? 'beli kopi 25rb' : 'bought coffee 25k',
    },
    {
      sender: 'ai' as const,
      preview: {
        merchant: 'Starbucks',
        amount: 'Rp 25.000',
        catKey: 'food' as const,
        wallet: 'Main Wallet',
      },
    },
    {
      sender: 'user' as const,
      text: 'gojek 18k',
    },
    {
      sender: 'ai' as const,
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
        <p className="text-xs font-black uppercase tracking-widest text-brand-700">
          {isId ? 'Alur Chat Transaksi' : 'NLP Transaction Flow'}
        </p>

        {steps.map((s) => (
          <div
            key={s.num}
            className="group relative overflow-hidden rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-5 shadow-[5px_5px_0_#17120f] transition-all duration-300 hover:-translate-y-1 hover:bg-[#fddf82]"
          >
            <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 rounded-full border-2 border-[#17120f] bg-brand-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#17120f] shadow-[3px_3px_0_#17120f]',
                  s.color,
                )}
                style={{ background: s.bg }}
              >
                <s.Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-black text-brand-600">
                    {s.num}
                  </span>

                  <h4 className="text-sm font-black text-[#17120f]">
                    {s.title}
                  </h4>
                </div>

                <p className="text-sm leading-6 text-[#4f4540]">{s.desc}</p>

                <div className="mt-3 rounded-2xl border-2 border-[#17120f] bg-[#f6eee8] px-3 py-2">
                  <p className="text-xs font-black text-[#17120f]">
                    {s.example}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-[#fffaf6] shadow-[8px_8px_0_#17120f] lg:sticky lg:top-28">
        <div className="flex items-center gap-3 border-b-2 border-[#17120f] bg-brand-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#17120f] bg-brand-500 text-[#17120f] shadow-[3px_3px_0_#17120f]">
            <RiChatSmile3Line className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-black text-[#17120f]">SAKU AI</p>
            <p className="text-xs text-[#4f4540]">
              {isId ? 'Catat transaksi natural' : 'Natural language recording'}
            </p>
          </div>

          <span className="ml-auto flex items-center gap-1.5 rounded-full border-2 border-[#17120f] bg-[#fddf82] px-3 py-1 text-xs font-black text-[#17120f]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#17120f]" />
            {isId ? 'Aktif' : 'Online'}
          </span>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto bg-[#f6eee8] p-5">
          {chatMessages.map((msg, i) => (
            <div key={i}>
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-md border-2 border-[#17120f] bg-brand-500 px-4 py-2.5 text-sm font-black text-[#17120f] shadow-[3px_3px_0_#17120f]">
                    {msg.text}
                  </div>
                </div>
              ) : msg.preview ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] overflow-hidden rounded-3xl rounded-bl-md border-2 border-[#17120f] bg-[#fffaf6] shadow-[5px_5px_0_#17120f]">
                    <div className="px-4 pb-3 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <RiSparklingLine className="h-4 w-4 text-brand-600" />
                        <p className="text-xs font-black text-brand-700">
                          {isId ? 'Preview Transaksi' : 'Transaction Preview'}
                        </p>
                      </div>

                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#17120f] bg-[#fddf82] text-sm font-black text-[#17120f]">
                          {msg.preview.merchant.slice(0, 1)}
                        </span>

                        <div>
                          <p className="text-sm font-black text-[#17120f]">
                            {msg.preview.merchant}
                          </p>

                          <p className="text-xs text-[#4f4540]">
                            {categoryCopy[msg.preview.catKey]}
                          </p>
                        </div>

                        <span className="ml-auto text-base font-black text-brand-700">
                          -{msg.preview.amount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border-2 border-[#17120f] bg-[#f6eee8] px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <RiWalletLine className="h-4 w-4 text-brand-600" />
                          <span className="text-xs font-medium text-[#4f4540]">
                            {msg.preview.wallet}
                          </span>
                        </div>

                        <span className="text-xs font-medium text-[#4f4540]">
                          {isId ? 'Baru saja' : 'Just now'}
                        </span>
                      </div>
                    </div>

                    <div className="flex border-t-2 border-[#17120f]">
                      <button className="flex-1 bg-[#fffaf6] py-3 text-xs font-black text-[#4f4540] transition-colors hover:bg-[#f6eee8]">
                        {isId ? 'Edit' : 'Edit'}
                      </button>

                      <button className="flex-1 border-l-2 border-[#17120f] bg-[#fddf82] py-3 text-xs font-black text-[#17120f] transition-colors hover:bg-brand-300">
                        {isId ? 'Konfirmasi' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t-2 border-[#17120f] bg-[#fffaf6] px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border-2 border-[#17120f] bg-white px-3 py-2.5">
            <input
              readOnly
              placeholder={
                isId
                  ? 'Tulis seperti "makan malam 80k"...'
                  : 'Type like "dinner 80k"...'
              }
              className="flex-1 bg-transparent text-sm text-slate-400 outline-none"
            />

            <RiSendPlaneLine className="h-4 w-4 text-brand-600" />
          </div>
        </div>
      </div>
    </div>
  )
}