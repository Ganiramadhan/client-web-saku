import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineGift,
  HiOutlineArrowRight,
} from 'react-icons/hi2'
import { Badge, Button, EmptyState, Card, Skeleton } from '@/components/ui'
import { subscriptionApi, type Plan } from '../api'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

const SNAP_SCRIPT_ID = 'midtrans-snap-script'

function loadSnap(clientKey: string, isProduction: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SNAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing && window.snap) {
      resolve()
      return
    }

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Snap.js')))
      return
    }

    const script = document.createElement('script')
    script.id = SNAP_SCRIPT_ID
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Snap.js'))

    document.body.appendChild(script)
  })
}

export function PlansPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const plansQ = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: subscriptionApi.listPlans,
  })

  const activeQ = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
  })

  const [busyCode, setBusyCode] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const snapLoadedRef = useRef(false)


  const allowedPrefixes = ['free', 'pro']
  const allPlans = useMemo(
    () => (plansQ.data ?? []).filter((p) => allowedPrefixes.some((pref) => p.code === pref || p.code.startsWith(pref + '_'))),
    [plansQ.data],
  )
  const plans = useMemo(() => allPlans.filter((p) => p.period === period), [allPlans, period])
  const active = activeQ.data ?? null
  const hasYearly = useMemo(() => allPlans.some((p) => p.period === 'yearly'), [allPlans])

  useEffect(() => {
    document.title = 'Langganan • SAKU'
  }, [])

  async function handleSubscribe(plan: Plan) {
    if (plan.price <= 0) {
      toast.info('Paket gratis aktif otomatis')
      return
    }

    try {
      setBusyCode(plan.code)

      const checkout = await subscriptionApi.checkout(plan.code)

      if (!snapLoadedRef.current) {
        await loadSnap(checkout.client_key, checkout.is_production)
        snapLoadedRef.current = true
      }

      if (!window.snap) {
        window.location.href = checkout.redirect_url
        return
      }

      window.snap.pay(checkout.snap_token, {
        onSuccess: (result) => {
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          // Surface a dedicated confirmation screen instead of just a toast so
          // the user has a clear "done" moment after returning from Snap.
          const orderId =
            result && typeof result === 'object' && 'order_id' in result
              ? String((result as { order_id?: unknown }).order_id ?? '')
              : ''
          const qs = orderId ? `?order_id=${encodeURIComponent(orderId)}` : ''
          navigate(`/app/subscription/thanks${qs}`)
        },
        onPending: () => {
          toast.info('Menunggu pembayaran')
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
        },
        onError: () => toast.error('Pembayaran gagal'),
        onClose: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai checkout'
      toast.error(msg)
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <HiOutlineSparkles className="h-4 w-4" />
            SAKU Pro — semua fitur dalam satu paket
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Pilih paket yang sesuai untuk kebutuhan finansialmu
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Upgrade ke SAKU Pro untuk membuka fitur AI, laporan finansial lanjutan,
            budget tracker, dan pengalaman pengelolaan uang yang lebih lengkap.
          </p>
        </div>
      </section>

      {active && (
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <HiOutlineShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Paket aktif
                </p>

                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-emerald-950">{active.plan_name}</p>

                  {active.is_trial || active.status === 'trialing' ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      Trial
                    </span>
                  ) : null}
                </div>

                {active.trial_ends_at && (active.is_trial || active.status === 'trialing') ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Trial berakhir{' '}
                    {new Date(active.trial_ends_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                ) : active.ends_at ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    Berlaku hingga{' '}
                    {new Date(active.ends_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                ) : null}
              </div>
            </div>

            <Badge tone="green">Aktif</Badge>
          </div>
        </Card>
      )}

      {hasYearly && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={cn(
                'rounded-xl px-5 py-2 text-sm font-semibold transition',
                period === 'monthly'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              )}
            >
              Bulanan
            </button>

            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={cn(
                'rounded-xl px-5 py-2 text-sm font-semibold transition',
                period === 'yearly'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              )}
            >
              Tahunan
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold',
                  period === 'yearly'
                    ? 'bg-white/15 text-white'
                    : 'bg-amber-100 text-amber-700',
                )}
              >
                Hemat
              </span>
            </button>
          </div>
        </div>
      )}

      {plansQ.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState title="Belum ada paket" description="Paket langganan belum tersedia." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const isActive = active?.plan_code === plan.code
            const isFree = plan.price <= 0
            const isPro = plan.code === 'pro' || plan.code === 'pro_yearly'
            const isBusy = busyCode === plan.code

            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md',
                  isPro ? 'border-slate-900' : 'border-slate-200',
                )}
              >
                {isPro && (
                  <div className="absolute right-5 top-5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      <HiOutlineStar className="h-3.5 w-3.5" />
                      Populer
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3 pr-20">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                      isFree
                        ? 'bg-slate-100 text-slate-600'
                        : isPro
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    {isFree ? (
                      <HiOutlineGift className="h-5 w-5" />
                    ) : isPro ? (
                      <HiOutlineSparkles className="h-5 w-5" />
                    ) : (
                      <HiOutlineBolt className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {isFree
                        ? 'Cocok untuk mulai mencatat keuangan.'
                        : 'Untuk penggunaan yang lebih lengkap dan produktif.'}
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-950">
                      {isFree ? 'Gratis' : formatCurrency(plan.price, plan.currency)}
                    </span>

                    {!isFree && (
                      <span className="pb-1 text-sm font-medium text-slate-500">
                        /{plan.period === 'yearly' ? 'tahun' : 'bulan'}
                      </span>
                    )}
                  </div>

                  {!isFree && !isActive && (
                    <p className="mt-2 text-xs text-slate-500">
                      Aktif segera setelah pembayaran berhasil. Batal kapan saja.
                    </p>
                  )}
                </div>

                <div className="my-6 h-px bg-slate-100" />

                <ul className="flex-1 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <HiOutlineCheck className="h-3.5 w-3.5" />
                      </span>
                      <span className="leading-5">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isActive || isBusy}
                  className={cn(
                    'mt-7 w-full justify-center gap-2 rounded-xl',
                    isPro
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
                  )}
                >
                  {isActive
                    ? 'Paket Saat Ini'
                    : isBusy
                    ? 'Memproses…'
                    : isFree
                    ? 'Aktifkan Paket'
                    : 'Berlangganan Sekarang'}

                  {!isActive && !isBusy && !isFree ? (
                    <HiOutlineArrowRight className="h-4 w-4" />
                  ) : null}
                </Button>
              </article>
            )
          })}
        </div>
      )}

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <HiOutlineShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Pembayaran Aman</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Transaksi diproses melalui Midtrans dengan sistem pembayaran yang aman.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <HiOutlineBolt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Aktivasi Instan</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Akses premium aktif otomatis setelah pembayaran berhasil.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <HiOutlineGift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Batal Kapan Saja</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Tidak ada biaya tersembunyi. Batalkan langganan kapan saja dari halaman ini.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PlansPage