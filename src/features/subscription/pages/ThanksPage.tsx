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
        primary: 'Buka Dashboard',
        profile: 'Mulai Catat Transaksi',
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
        primary: 'Open Dashboard',
        profile: 'Record a Transaction',
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
    <div className="app-surface fixed inset-0 z-50 overflow-y-auto bg-[#f6eee8] px-3 py-4 text-[#17120f] sm:px-4 sm:py-8">
      <div className="pointer-events-none fixed -left-20 top-24 h-72 w-72 rounded-[45%_55%_35%_65%] border border-[#17120f]/12 bg-brand-100/50" />
      <div className="pointer-events-none fixed -right-16 bottom-20 h-60 w-60 rounded-[62%_38%_55%_45%] border border-[#17120f]/12 bg-[#fddf82]/50" />
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => navigate('/app')}
        className="fixed right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#17120f]/15 bg-[#fffaf6]/90 text-[#4f4540] shadow-lg shadow-[#17120f]/8 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:text-[#17120f] sm:right-5 sm:top-5 sm:h-10 sm:w-10"
      >
        <HiOutlineXMark className="h-5 w-5" />
      </button>

      <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col justify-start gap-4 pb-4 pt-1 sm:min-h-[calc(100vh-4rem)] sm:justify-center sm:gap-4 sm:pb-0 sm:pt-0">
        <div className="pr-12 sm:pr-0">
          <Logo />
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-[#17120f]/18 bg-[#fffaf6]/92 shadow-[0_24px_70px_rgba(23,18,15,0.12)] backdrop-blur">
          <div className="px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
            <SuccessDoodle />
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

            <div className="mt-5 rounded-2xl border border-[#17120f]/10 bg-[#ecfdf5]/85 p-3.5 shadow-sm shadow-emerald-100/50 sm:mt-5 sm:p-4">
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
              <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-3.5 sm:p-4">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-700">
                  <HiOutlineShieldCheck className="h-4 w-4" />
                  {locale === 'id' ? 'Status akses' : 'Access status'}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-brand-900">
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
                onClick={() => navigate('/app/transactions/add')}
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 md:h-10 md:w-10">
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

function SuccessDoodle() {
  return (
    <svg viewBox="0 0 520 130" className="mx-auto mb-2 hidden h-auto w-full max-w-xl sm:block" role="img" aria-label="Ilustrasi pembayaran berhasil">
      <path d="M51 94c57-40 110-48 160-25 53 24 100 27 159-10 37-23 70-29 100-17" fill="none" stroke="#ffe4dc" strokeWidth="25" strokeLinecap="round" />
      <path d="M51 94c57-40 110-48 160-25 53 24 100 27 159-10 37-23 70-29 100-17" fill="none" stroke="#17120f" strokeOpacity=".28" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="196" y="24" width="128" height="76" rx="24" fill="#fffaf6" stroke="#17120f" strokeOpacity=".45" strokeWidth="2.5" />
      <path d="M233 62l18 17 38-42" stroke="#059669" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M94 30l6 12 13 5-13 5-6 13-6-13-13-5 13-5 6-12ZM420 69l5 10 11 4-11 5-5 10-5-10-11-5 11-4 5-10Z" fill="#fddf82" stroke="#17120f" strokeOpacity=".45" strokeWidth="2" />
      <path d="M146 89c16-19 34-22 55-9-14 21-32 24-55 9Z" fill="#ff9d8d" stroke="#17120f" strokeOpacity=".45" strokeWidth="2" />
      <path d="M369 103c19-14 36-12 50 6-20 14-37 12-50-6Z" fill="#ecfdf5" stroke="#17120f" strokeOpacity=".45" strokeWidth="2" />
    </svg>
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
