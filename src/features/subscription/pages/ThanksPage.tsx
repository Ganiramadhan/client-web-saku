import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowRight,
  HiOutlineCamera,
  HiOutlineCalendarDays,
  HiOutlineChartBarSquare,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineReceiptPercent,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { subscriptionApi, type Subscription } from '../api'
import { formatCurrency } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { useLocale } from '@/i18n'
import { analyticsEvents, trackEvent } from '@/lib/analytics'

export function ThanksPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const [params] = useSearchParams()
  const orderId = params.get('order_id') ?? params.get('order') ?? null
  const [confirmedSub, setConfirmedSub] = useState<Subscription | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(Boolean(orderId))
  const [confirmFinished, setConfirmFinished] = useState(!orderId)
  const copy = locale === 'id'
    ? {
        title: 'Akses Pro sudah aktif',
        eyebrow: 'Pembayaran berhasil',
        subtitle: 'Terima kasih. Paketmu sudah siap dipakai untuk mencatat transaksi lebih cepat, membaca struk dengan AI, dan memahami arus kas dari satu workspace.',
        activePlan: 'Paket aktif',
        activeUntil: (date: string) => `Aktif hingga ${date}`,
        activeNow: 'Aktif sekarang',
        loadingPlan: 'Menyiapkan detail langganan...',
        syncingPlan: 'Pembayaran berhasil diterima. Aktivasi paket sedang disinkronkan dan biasanya selesai dalam beberapa detik.',
        unavailablePlan: 'Detail paket aktif belum tersedia. Coba buka Profile atau Dashboard untuk memuat ulang status langganan.',
        order: 'Order ID',
        amount: 'Total pembayaran',
        validity: 'Masa berlaku',
        primary: 'Mulai pakai SAKU',
        profile: 'Lihat Profile',
        trust: 'Pembayaran terverifikasi dan akses fitur akan mengikuti status paket aktif.',
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
        subtitle: 'Thank you. Your plan is ready for faster transaction capture, AI receipt scanning, and clearer cashflow insights in one workspace.',
        activePlan: 'Active plan',
        activeUntil: (date: string) => `Active until ${date}`,
        activeNow: 'Active now',
        loadingPlan: 'Preparing subscription details...',
        syncingPlan: 'Payment has been received. Plan activation is syncing and usually completes within a few seconds.',
        unavailablePlan: 'Active plan details are not available yet. Open Profile or Dashboard to refresh your subscription status.',
        order: 'Order ID',
        amount: 'Payment total',
        validity: 'Validity',
        primary: 'Start using SAKU',
        profile: 'View Profile',
        trust: 'Payment is verified and feature access follows your active plan status.',
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
      setConfirmLoading(true)
      setConfirmFinished(false)
      subscriptionApi
        .confirm(orderId)
        .then((sub) => {
          setConfirmedSub(sub)
          trackEvent(analyticsEvents.paymentSuccess, {
            subscription_plan: sub.plan_code,
            amount: sub.amount,
          })
          if (sub.status === 'active') {
            trackEvent(analyticsEvents.subscriptionActivated, {
              subscription_plan: sub.plan_code,
              amount: sub.amount,
            })
          }
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'active'] })
        })
        .catch(() => undefined)
        .finally(() => {
          setConfirmLoading(false)
          setConfirmFinished(true)
        })
    }
  }, [qc, orderId])

  const activeQ = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
    retry: 4,
    retryDelay: 1500,
  })

  const active = activeQ.data ?? (confirmedSub?.status === 'active' ? confirmedSub : null)
  useEffect(() => {
    if (!active) return
    trackEvent(analyticsEvents.subscriptionActivated, {
      subscription_plan: active.plan_code,
      amount: active.amount,
    })
  }, [active?.id])
  const planIsLoading = !active && (activeQ.isLoading || activeQ.isFetching || confirmLoading)
  const planIsSyncing = !active && confirmFinished
  const endsAtLabel = useMemo(() => {
    if (!active?.ends_at) return null
    return new Date(active.ends_at).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [active])

  return (
    <div className="app-surface fixed inset-0 z-50 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-4 sm:py-8">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => navigate('/app')}
        className="fixed right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-500 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 sm:right-5 sm:top-5 sm:h-10 sm:w-10"
      >
        <HiOutlineXMark className="h-5 w-5" />
      </button>

      <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col justify-start gap-4 pb-4 pt-1 sm:min-h-[calc(100vh-4rem)] sm:justify-center sm:gap-4 sm:pb-0 sm:pt-0">
        <div className="pr-12 sm:pr-0">
          <Logo />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 sm:hidden">
              <HiOutlineCheckCircle className="h-7 w-7" />
            </div>
            <div className="flex justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <HiOutlineCheckCircle className="h-4 w-4" />
              {copy.eyebrow}
              </div>
            </div>
            <h1 className="mx-auto mt-4 max-w-md text-center text-2xl font-extrabold leading-tight text-slate-950 sm:mx-0 sm:mt-5 sm:max-w-2xl sm:text-left sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-600 sm:mx-0 sm:mt-4 sm:max-w-2xl sm:text-left sm:text-base sm:leading-7">
              {copy.subtitle}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm shadow-slate-100/70 sm:mt-5 sm:border-emerald-100 sm:bg-emerald-50 sm:p-4 sm:shadow-emerald-100/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 sm:text-emerald-700">{copy.activePlan}</p>
                {active ? (
                  <>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold text-slate-950 sm:text-xl">{active.plan_name || active.plan_code}</p>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 sm:bg-emerald-100">
                        {active.status === 'active' ? copy.activeNow : active.status}
                      </span>
                    </div>
                    <p className="mt-2 hidden text-sm leading-6 text-slate-600 sm:block">{copy.trust}</p>
                  </>
                ) : planIsLoading ? (
                  <p className="mt-3 text-sm font-semibold text-slate-500">{copy.loadingPlan}</p>
                ) : (
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    {planIsSyncing ? copy.syncingPlan : copy.unavailablePlan}
                  </p>
                )}
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-48 sm:grid-cols-1">
                  <MiniInfo Icon={HiOutlineCreditCard} label={copy.amount} value={active ? formatCurrency(active.amount, active.currency) : '-'} />
                  <MiniInfo Icon={HiOutlineCalendarDays} label={copy.validity} value={endsAtLabel ? copy.activeUntil(endsAtLabel) : copy.activeNow} />
                </div>
              </div>
            </div>

            <div className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 sm:p-4">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-700">
                  <HiOutlineShieldCheck className="h-4 w-4" />
                  {locale === 'id' ? 'Status akses' : 'Access status'}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-blue-900">
                  {locale === 'id' ? 'Fitur Pro dapat digunakan dari Dashboard setelah status paket aktif.' : 'Pro features are available from Dashboard once the plan is active.'}
                </p>
              </div>

              {orderId ? (
                <div className="rounded-2xl border border-slate-200 bg-white/78 p-3.5 sm:p-4">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    <HiOutlineReceiptPercent className="h-4 w-4" />
                    {copy.order}
                  </p>
                  <p className="mt-3 break-all font-mono text-xs font-semibold leading-5 text-slate-700">{orderId}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row">
              <Link to="/app" className="w-full sm:w-auto">
                <Button className="h-11 w-full transition hover:-translate-y-0.5 sm:h-auto" rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}>
                  {copy.primary}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="h-11 w-full transition hover:-translate-y-0.5 sm:h-auto sm:w-auto"
                leftIcon={<HiOutlineUser className="h-4 w-4" />}
                onClick={() => navigate('/app/profile')}
              >
                {copy.profile}
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm shadow-slate-200/70">
                  <HiOutlineSparkles className="h-5 w-5" />
                </div>
                <h2 className="text-base font-extrabold text-slate-950">{copy.nextTitle}</h2>
              </div>
              <div className="mt-3 grid gap-2.5 md:grid-cols-3">
                {copy.steps.map(([title, desc], index) => {
                  const Icon = [HiOutlineCamera, HiOutlineChatBubbleLeftRight, HiOutlineChartBarSquare][index]
                  return (
                    <div key={title} className="rounded-xl border border-white/80 bg-white/82 p-2.5 shadow-sm shadow-slate-200/40 sm:rounded-2xl sm:p-3">
                      <div className="flex items-start gap-2.5 md:block">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 md:h-10 md:w-10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="md:mt-3">
                          <p className="text-sm font-bold text-slate-950">{title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:mt-1">{desc}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ThanksPage

function MiniInfo({
  Icon,
  label,
  value,
}: {
  Icon: typeof HiOutlineCreditCard
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white p-2.5 shadow-sm shadow-slate-200/40 sm:rounded-2xl sm:p-3">
      <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px] sm:tracking-widest">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-xs font-extrabold leading-5 text-slate-900 sm:text-sm">{value}</p>
    </div>
  )
}
