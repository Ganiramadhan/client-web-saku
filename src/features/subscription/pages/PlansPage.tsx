import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyState, Input, Skeleton } from '@/components/ui'
import { subscriptionApi, type Plan } from '../api'
import { toast } from '@/lib/toast'
import { loadSnap } from '@/lib/snap'
import { useLocale } from '@/i18n'
import { sanitizeReferralCode } from '../utils/referral'
import type { BillingPeriod } from '../types'
import {
  ActiveSubscriptionBanner,
  BillingPeriodToggle,
  PlanCard,
  PlansHero,
  SubscriptionTrustSection,
} from '../components/PlansPanels'

export function PlansPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        freeActive: 'Paket gratis aktif otomatis',
        pendingPayment: 'Pembayaran belum selesai',
        paymentFailed: 'Pembayaran gagal',
        checkoutFailed: 'Gagal memulai checkout',
        pendingPlanExists: 'Masih ada pembayaran pending. Batalkan pembayaran tersebut dulu sebelum memilih paket lain.',
      }
    : {
        freeActive: 'Free plan is active automatically',
        pendingPayment: 'Payment is still pending',
        paymentFailed: 'Payment failed',
        checkoutFailed: 'Failed to start checkout',
        pendingPlanExists: 'You still have a pending payment. Cancel it first before choosing another plan.',
      }

  const plansQ = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: subscriptionApi.listPlans,
  })

  const activeQ = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
  })
  const subscriptionsQ = useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: subscriptionApi.mySubscriptions,
  })

  const [busyCode, setBusyCode] = useState<string | null>(null)
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const [voucherCode, setVoucherCode] = useState('')
  const snapLoadedRef = useRef(false)


  const allowedPrefixes = ['free', 'pro', 'premium']
  const allPlans = useMemo(
    () => (plansQ.data ?? []).filter((p) => allowedPrefixes.some((pref) => p.code === pref || p.code.startsWith(pref + '_'))),
    [plansQ.data],
  )
  const plans = useMemo(() => allPlans.filter((p) => p.period === period), [allPlans, period])
  const active = activeQ.data ?? null
  const pending = (subscriptionsQ.data ?? []).find((item) => item.status === 'pending') ?? null
  const hasYearly = useMemo(() => allPlans.some((p) => p.period === 'yearly'), [allPlans])

  useEffect(() => {
    document.title = 'Langganan • SAKU'
  }, [])

  function handleSubscribe(plan: Plan) {
    if (plan.price <= 0) {
      toast.info(copy.freeActive)
      return
    }
    if (pending && pending.plan_code !== plan.code) {
      toast.info(copy.pendingPlanExists)
      return
    }
    void startCheckout(plan)
  }

  async function startCheckout(plan: Plan) {
    try {
      setBusyCode(plan.code)

      const checkout = await subscriptionApi.checkout(plan.code, false, undefined, sanitizeReferralCode(voucherCode))

      if (!snapLoadedRef.current) {
        await loadSnap(checkout.client_key, checkout.is_production)
        snapLoadedRef.current = true
      }

      if (!window.snap) {
        window.location.href = checkout.redirect_url
        return
      }

      document.body.classList.add('saku-payment-open')
      window.snap.pay(checkout.snap_token, {
        onSuccess: async (result) => {
          document.body.classList.remove('saku-payment-open')
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          const orderId =
            result && typeof result === 'object' && 'order_id' in result
              ? String((result as { order_id?: unknown }).order_id ?? '')
              : ''
          const qs = orderId ? `?order_id=${encodeURIComponent(orderId)}` : ''
          if (orderId) await subscriptionApi.confirm(orderId)
          navigate(`/app/subscription/thanks${qs}`)
        },
        onPending: () => {
          document.body.classList.remove('saku-payment-open')
          toast.info(copy.pendingPayment)
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
        },
        onError: () => {
          document.body.classList.remove('saku-payment-open')
          toast.error(copy.paymentFailed)
        },
        onClose: () => {
          document.body.classList.remove('saku-payment-open')
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.checkoutFailed
      toast.error(msg)
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PlansHero />

      {active && <ActiveSubscriptionBanner active={active} />}

      {hasYearly && <BillingPeriodToggle period={period} onChange={setPeriod} />}

      <div className="mx-auto max-w-md">
        <Input
          label={locale === 'id' ? 'Kode voucher' : 'Voucher code'}
          placeholder={locale === 'id' ? 'Opsional, contoh HEMAT20' : 'Optional, for example HEMAT20'}
          value={voucherCode}
          maxLength={32}
          onChange={(e) => setVoucherCode(sanitizeReferralCode(e.target.value))}
        />
      </div>

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
            const isBusy = busyCode === plan.code

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isActive={isActive}
                isBusy={isBusy}
                onSubscribe={handleSubscribe}
              />
            )
          })}
        </div>
      )}

      <SubscriptionTrustSection />
    </div>
  )
}

export default PlansPage
