import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineCamera,
  HiOutlineChartBarSquare,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineReceiptPercent,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { subscriptionApi } from '../api'
import { formatCurrency } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { useLocale } from '@/i18n'

export function ThanksPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const [params] = useSearchParams()
  const orderId = params.get('order_id') ?? params.get('order') ?? null
  const copy = locale === 'id'
    ? {
        title: 'Akses Pro sudah aktif',
        eyebrow: 'Pembayaran berhasil',
        subtitle: 'Terima kasih. SAKU Pro siap dipakai untuk mencatat transaksi lebih cepat, membaca struk dengan AI, dan memahami arus kas dari satu workspace.',
        activePlan: 'Paket aktif',
        activeUntil: (date: string) => `Aktif hingga ${date}`,
        activeNow: 'Aktif sekarang',
        loadingPlan: 'Memuat detail langganan...',
        order: 'Order ID',
        primary: 'Mulai pakai SAKU',
        profile: 'Lihat Profile',
        nextTitle: 'Yang bisa kamu lakukan sekarang',
        steps: [
          ['Scan struk', 'Ubah foto struk menjadi transaksi siap review.'],
          ['Chat dengan AI', 'Tanyakan pola pengeluaran dan rekomendasi hemat.'],
          ['Pantau insight', 'Lihat ringkasan arus kas dan kategori terbesar.'],
        ],
      }
    : {
        title: 'Your Pro access is active',
        eyebrow: 'Payment successful',
        subtitle: 'Thank you. SAKU Pro is ready for faster transaction capture, AI receipt scanning, and clearer cashflow insights in one workspace.',
        activePlan: 'Active plan',
        activeUntil: (date: string) => `Active until ${date}`,
        activeNow: 'Active now',
        loadingPlan: 'Loading subscription details...',
        order: 'Order ID',
        primary: 'Start using SAKU',
        profile: 'View Profile',
        nextTitle: 'What you can do next',
        steps: [
          ['Scan receipts', 'Turn receipt photos into review-ready transactions.'],
          ['Chat with AI', 'Ask about spending patterns and saving recommendations.'],
          ['Track insights', 'Review cashflow summaries and top categories.'],
        ],
      }

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
    <div className="app-surface fixed inset-0 z-50 overflow-y-auto px-4 py-5 sm:py-8">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => navigate('/app')}
        className="fixed right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/85 text-slate-500 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900"
      >
        <HiOutlineXMark className="h-5 w-5" />
      </button>

      <main className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col justify-center gap-6">
        <Logo />

        <section className="grid overflow-hidden rounded-3xl border border-white/80 bg-white/72 shadow-2xl shadow-slate-300/35 backdrop-blur-2xl lg:grid-cols-[1.02fr_0.98fr]">
          <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <HiOutlineCheckCircle className="h-4 w-4" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {copy.subtitle}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">{copy.activePlan}</p>
                {active ? (
                  <>
                    <p className="mt-2 text-xl font-extrabold text-slate-950">{active.plan_name}</p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {formatCurrency(active.amount, active.currency)}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      {endsAtLabel ? copy.activeUntil(endsAtLabel) : copy.activeNow}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-500">{copy.loadingPlan}</p>
                )}
              </div>

              {orderId ? (
                <div className="rounded-2xl border border-slate-200 bg-white/78 p-4">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    <HiOutlineReceiptPercent className="h-4 w-4" />
                    {copy.order}
                  </p>
                  <p className="mt-3 break-all font-mono text-xs font-semibold leading-5 text-slate-700">{orderId}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Link to="/app" className="sm:w-auto">
                <Button className="w-full transition hover:-translate-y-0.5" rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}>
                  {copy.primary}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="transition hover:-translate-y-0.5"
                leftIcon={<HiOutlineUser className="h-4 w-4" />}
                onClick={() => navigate('/app/profile')}
              >
                {copy.profile}
              </Button>
            </div>
          </div>

          <aside className="border-t border-white/70 bg-slate-950 px-5 py-7 text-white sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600">
              <HiOutlineSparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-extrabold">{copy.nextTitle}</h2>
            <div className="mt-5 space-y-3">
              {copy.steps.map(([title, desc], index) => {
                const Icon = [HiOutlineCamera, HiOutlineChatBubbleLeftRight, HiOutlineChartBarSquare][index]
                return (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{desc}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default ThanksPage
