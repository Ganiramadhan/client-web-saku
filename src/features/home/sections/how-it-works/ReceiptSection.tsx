import { HiOutlineArrowUpTray, HiOutlineCheckCircle, HiOutlineDocumentCheck } from 'react-icons/hi2'
import { RiBankLine, RiCalendarEventLine, RiMoneyDollarCircleLine, RiPieChart2Line, RiReceiptLine, RiScanLine } from 'react-icons/ri'
import { cn } from '@/lib/utils'

export function ReceiptSection() {
  const steps = [
    {
      num: '01',
      Icon: HiOutlineArrowUpTray,
      title: 'Upload receipt',
      desc: 'Take a photo or upload your receipt.',
      color: 'text-cyan-600',
      bg: 'rgba(236,254,255,0.90)',
      border: 'rgba(165,243,252,0.70)',
    },
    {
      num: '02',
      Icon: RiScanLine,
      title: 'AI extracts data',
      desc: 'SAKU reads merchant, date, items, and total.',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
    },
    {
      num: '03',
      Icon: HiOutlineDocumentCheck,
      title: 'Review details',
      desc: 'Check and edit extracted data before saving.',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
    },
    {
      num: '04',
      Icon: HiOutlineCheckCircle,
      title: 'Confirm & save',
      desc: 'Save it instantly as a transaction.',
      color: 'text-emerald-600',
      bg: 'rgba(236,253,245,0.90)',
      border: 'rgba(167,243,208,0.70)',
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          How Receipt Scanning Works
        </p>

        {steps.map((step) => (
          <div
            key={step.num}
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
            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  step.color
                )}
                style={{
                  background: step.bg,
                  border: `1px solid ${step.border}`,
                }}
              >
                <step.Icon className="h-5 w-5" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">{step.num}</span>
                  <h4 className="text-sm font-bold text-slate-950">{step.title}</h4>
                </div>

                <p className="text-sm leading-6 text-slate-500">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow:
            '0 24px 70px rgba(6,182,212,0.10), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-200">
            <RiReceiptLine className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Receipt Preview</p>
            <p className="text-xs text-slate-400">Review before saving</p>
          </div>

          <span className="ml-auto rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            AI Extracted
          </span>
        </div>

        <div className="space-y-4 bg-cyan-50/40 p-5">
          <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-cyan-200 bg-cyan-50">
            <div className="text-center">
              <RiReceiptLine className="mx-auto mb-1 h-8 w-8 text-cyan-300" />
              <p className="text-xs font-medium text-cyan-500">
                Receipt image uploaded
              </p>
            </div>

            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-200" />
              Scanning
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Extracted Data
            </p>

            {[
              { label: 'Merchant', value: 'Starbucks Coffee', Icon: RiBankLine },
              { label: 'Date', value: 'May 20, 2026', Icon: RiCalendarEventLine },
              { label: 'Category', value: 'Food & Drink', Icon: RiPieChart2Line },
              {
                label: 'Total Amount',
                value: 'Rp 65.000',
                highlight: true,
                Icon: RiMoneyDollarCircleLine,
              },
            ].map((row) => (
              <div key={row.label} className="mb-2.5 flex items-center justify-between last:mb-0">
                <div className="flex items-center gap-2">
                  <row.Icon className="h-4 w-4 text-slate-300" />
                  <span className="text-xs text-slate-400">{row.label}</span>
                </div>

                <div
                  className={cn('rounded-xl px-3 py-1 text-xs font-bold')}
                  style={
                    row.highlight
                      ? {
                          background: 'rgba(209,250,229,0.70)',
                          border: '1px solid rgba(167,243,208,0.80)',
                          color: '#059669',
                        }
                      : {
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          color: '#475569',
                        }
                  }
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Items Detected
            </p>

            {[
              { name: 'Caramel Frappuccino', price: 'Rp 52.000' },
              { name: 'Croissant', price: 'Rp 13.000' },
            ].map((item) => (
              <div key={item.name} className="mb-2 flex justify-between text-sm last:mb-0">
                <span className="text-slate-500">{item.name}</span>
                <span className="font-bold text-slate-800">{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button className="flex-1 rounded-2xl border border-slate-200 bg-white/80 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">
              Edit Details
            </button>

            <button className="flex-1 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200/70 transition-all hover:bg-cyan-500">
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Pricing ───────────────────────────────────────────────── */
