import {
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineDocumentCheck,
} from 'react-icons/hi2'
import {
  RiBankLine,
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiPieChart2Line,
  RiReceiptLine,
  RiScanLine,
} from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

export function ReceiptSection() {
  const { locale } = useLocale()
  const isId = locale === 'id'

  const steps = [
    {
      num: '01',
      Icon: HiOutlineArrowUpTray,
      title: isId ? 'Upload struk' : 'Upload receipt',
      desc: isId
        ? 'Ambil foto atau upload gambar struk dari galeri.'
        : 'Take a photo or upload your receipt image.',
      bg: '#ffe4dc',
      color: 'text-brand-700',
    },
    {
      num: '02',
      Icon: RiScanLine,
      title: isId ? 'AI membaca data' : 'AI extracts data',
      desc: isId
        ? 'SAKU membaca merchant, item, tanggal, dan total.'
        : 'SAKU reads merchant, items, date, and total.',
      bg: '#fddf82',
      color: 'text-[#17120f]',
    },
    {
      num: '03',
      Icon: HiOutlineDocumentCheck,
      title: isId ? 'Review hasil' : 'Review result',
      desc: isId
        ? 'Cek ulang dan edit detail sebelum disimpan.'
        : 'Review and edit details before saving.',
      bg: '#fffaf6',
      color: 'text-[#17120f]',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: isId ? 'Simpan transaksi' : 'Save transaction',
      desc: isId
        ? 'Konfirmasi lalu simpan langsung ke wallet.'
        : 'Confirm and save directly to your wallet.',
      bg: '#ecfdf5',
      color: 'text-emerald-700',
    },
  ]

  const detectedData = [
    {
      label: isId ? 'Tanggal' : 'Date',
      value: isId ? '20 Mei 2026' : 'May 20, 2026',
      Icon: RiCalendarEventLine,
    },
    {
      label: isId ? 'Kategori' : 'Category',
      value: isId ? 'Makanan & Minuman' : 'Food & Drink',
      Icon: RiPieChart2Line,
    },
    {
      label: isId ? 'Wallet' : 'Wallet',
      value: 'Main Wallet',
      Icon: RiBankLine,
    },
    {
      label: isId ? 'Total' : 'Total',
      value: 'Rp 62.700',
      Icon: RiMoneyDollarCircleLine,
      highlight: true,
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-brand-700">
          {isId ? 'Alur Scan Struk' : 'Receipt Scan Flow'}
        </p>

        {steps.map((step) => (
          <div
            key={step.num}
            className="group relative overflow-hidden rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-5 shadow-[5px_5px_0_#17120f] transition-all duration-300 hover:-translate-y-1 hover:bg-[#fddf82]"
          >
            <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 rounded-full border-2 border-[#17120f] bg-brand-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#17120f] shadow-[3px_3px_0_#17120f]',
                  step.color,
                )}
                style={{ background: step.bg }}
              >
                <step.Icon className="h-5 w-5" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-black text-brand-600">
                    {step.num}
                  </span>
                  <h4 className="text-sm font-black text-[#17120f]">
                    {step.title}
                  </h4>
                </div>

                <p className="text-sm leading-6 text-[#4f4540]">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-[#fffaf6] shadow-[8px_8px_0_#17120f] lg:sticky lg:top-28">
        <div className="flex items-center gap-3 border-b-2 border-[#17120f] bg-brand-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#17120f] bg-brand-500 text-[#17120f] shadow-[3px_3px_0_#17120f]">
            <RiReceiptLine className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-black text-[#17120f]">
              {isId ? 'Preview Struk' : 'Receipt Preview'}
            </p>
            <p className="text-xs text-[#4f4540]">
              {isId ? 'Review sebelum simpan' : 'Review before saving'}
            </p>
          </div>

          <span className="ml-auto rounded-full border-2 border-[#17120f] bg-[#fddf82] px-3 py-1 text-xs font-black text-[#17120f]">
            {isId ? 'Hasil AI' : 'AI Result'}
          </span>
        </div>

        <div className="space-y-4 bg-[#f6eee8] p-5">
          <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="relative flex min-h-44 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#17120f] bg-[#fffaf6]">
              <div className="absolute inset-x-6 top-5 h-1 rounded-full bg-[#fddf82]" />
              <div className="absolute inset-x-8 bottom-5 h-1 rounded-full bg-[#fddf82]" />
              <div className="absolute left-5 top-1/2 h-16 w-1 -translate-y-1/2 rounded-full bg-[#fddf82]" />
              <div className="absolute right-5 top-1/2 h-16 w-1 -translate-y-1/2 rounded-full bg-[#fddf82]" />

              <div className="text-center">
                <RiReceiptLine className="mx-auto mb-2 h-9 w-9 text-brand-600" />
                <p className="text-xs font-black text-[#17120f]">
                  {isId ? 'Foto struk siap dibaca' : 'Receipt image ready'}
                </p>
              </div>

              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border-2 border-[#17120f] bg-brand-500 px-3 py-1 text-xs font-black text-[#17120f]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#17120f]" />
                {isId ? 'Scan' : 'Scan'}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-4 shadow-[4px_4px_0_#17120f]">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#4f4540]">
                {isId ? 'Ringkasan AI' : 'AI Summary'}
              </p>

              <div className="space-y-2">
                {[
                  { label: 'Subtotal', value: 'Rp 65.000' },
                  { label: isId ? 'Diskon' : 'Discount', value: '-Rp 8.000' },
                  { label: isId ? 'Pajak' : 'Tax', value: 'Rp 5.700' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[#4f4540]">{row.label}</span>
                    <span className="font-black text-[#17120f]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border-2 border-[#17120f] bg-[#fddf82] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#17120f]">
                    {isId ? 'Total' : 'Total'}
                  </span>
                  <span className="text-sm font-black text-[#17120f]">
                    Rp 62.700
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-4 shadow-[4px_4px_0_#17120f]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#4f4540]">
                  {isId ? 'Data Terdeteksi' : 'Extracted Data'}
                </p>
                <p className="mt-1 text-sm font-black text-[#17120f]">
                  Starbucks Coffee
                </p>
              </div>

              <span className="rounded-full border-2 border-[#17120f] bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-[#17120f]">
                {isId ? 'Siap Simpan' : 'Ready'}
              </span>
            </div>

            {detectedData.map((row) => (
              <div
                key={row.label}
                className="mb-2.5 flex items-center justify-between last:mb-0"
              >
                <div className="flex items-center gap-2">
                  <row.Icon className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-medium text-[#4f4540]">
                    {row.label}
                  </span>
                </div>

                <span
                  className={cn(
                    'rounded-xl border-2 border-[#17120f] px-3 py-1 text-xs font-black',
                    row.highlight
                      ? 'bg-[#fddf82] text-[#17120f]'
                      : 'bg-[#f6eee8] text-[#17120f]',
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border-2 border-[#17120f] bg-[#fffaf6] p-4 shadow-[4px_4px_0_#17120f]">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#4f4540]">
              {isId ? 'Item Terdeteksi' : 'Items Detected'}
            </p>

            {[
              { name: 'Caramel Frappuccino', price: 'Rp 52.000' },
              { name: 'Croissant', price: 'Rp 13.000' },
            ].map((item) => (
              <div
                key={item.name}
                className="mb-2 flex justify-between text-sm last:mb-0"
              >
                <span className="text-[#4f4540]">{item.name}</span>
                <span className="font-black text-[#17120f]">
                  {item.price}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button className="saku-secondary-action flex-1 rounded-2xl py-3 text-sm font-black">
              {isId ? 'Edit Detail' : 'Edit Details'}
            </button>

            <button className="saku-primary-action flex-1 rounded-2xl py-3 text-sm font-black">
              {isId ? 'Simpan' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}