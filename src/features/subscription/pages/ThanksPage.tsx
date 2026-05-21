import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineReceiptPercent,
  HiOutlineUser,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { subscriptionApi } from '../api'
import { formatCurrency } from '@/lib/utils'

export function ThanksPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orderId = params.get('order_id') ?? params.get('order') ?? null

  useEffect(() => {
    document.title = 'Terima kasih - SAKU'
    qc.invalidateQueries({ queryKey: ['subscriptions'] })
    if (orderId) {
      subscriptionApi
        .confirm(orderId)
        .then(() => qc.invalidateQueries({ queryKey: ['subscriptions'] }))
        .catch(() => undefined)
    }
  }, [qc, orderId])

  const activeQ = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
  })

  const active = activeQ.data ?? null
  const endsAtLabel = useMemo(() => {
    if (!active?.ends_at) return null
    return new Date(active.ends_at).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [active])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 px-4 py-8">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => navigate('/app')}
        className="fixed right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
      >
        <HiOutlineXMark className="h-5 w-5" />
      </button>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block">
          <svg viewBox="0 0 420 360" role="img" aria-label="Pembayaran berhasil" className="h-auto w-full">
            <circle cx="210" cy="178" r="130" fill="#ecfdf5" />
            <rect x="104" y="74" width="212" height="238" rx="28" fill="#fff" stroke="#bbf7d0" strokeWidth="2" />
            <rect x="136" y="116" width="148" height="16" rx="8" fill="#0f172a" />
            <rect x="136" y="150" width="96" height="10" rx="5" fill="#94a3b8" />
            <rect x="136" y="184" width="148" height="50" rx="16" fill="#f0fdf4" stroke="#bbf7d0" />
            <circle cx="166" cy="209" r="15" fill="#16a34a" />
            <path d="M159 209l5 5 10-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="194" y="198" width="64" height="8" rx="4" fill="#166534" />
            <rect x="194" y="214" width="42" height="7" rx="3.5" fill="#86efac" />
            <circle cx="304" cy="86" r="34" fill="#16a34a" />
            <path d="M291 86l9 9 19-23" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <HiOutlineCheckCircle className="h-4 w-4" />
            Pembayaran berhasil
          </div>
          <h1 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Terima kasih, akses Pro sudah aktif.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            Langganan SAKU Anda sudah siap digunakan. Mulai pakai fitur Pro untuk scan struk, catatan AI, dan insight finansial.
          </p>

          {active ? (
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-white/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Paket aktif</p>
              <p className="mt-1 text-lg font-extrabold text-slate-950">{active.plan_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatCurrency(active.amount, active.currency)}
                {' - '}
                {endsAtLabel ? `hingga ${endsAtLabel}` : 'aktif'}
              </p>
            </div>
          ) : null}

          {orderId ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
              <HiOutlineReceiptPercent className="h-4 w-4" />
              <span className="font-mono">{orderId}</span>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link to="/app">
              <Button className="w-full transition hover:-translate-y-0.5" rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}>
                Mulai pakai SAKU
              </Button>
            </Link>
            <Button
              variant="outline"
              className="transition hover:-translate-y-0.5"
              leftIcon={<HiOutlineUser className="h-4 w-4" />}
              onClick={() => navigate('/app/profile')}
            >
              Lihat Profile
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ThanksPage
