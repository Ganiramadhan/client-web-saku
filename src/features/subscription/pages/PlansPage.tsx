import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyState, Input, Skeleton } from '@/components/ui'
import { subscriptionApi, type Plan } from '../api'
import { toast } from '@/lib/toast'
import { useLocale } from '@/i18n'
import { sanitizeReferralCode } from '../utils/referral'
import type { BillingPeriod } from '../types'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { openSubscriptionCheckout } from '../utils/checkoutFlow'
import {
  ActiveSubscriptionBanner,
  BillingPeriodToggle,
  PlanCard,
  PlansHero,
  SubscriptionTrustSection,
} from '../components/PlansPanels'

const ALLOWED_PLAN_PREFIXES = ['free', 'pro', 'premium']

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
  const allPlans = useMemo(
    () => (plansQ.data ?? []).filter((p) => ALLOWED_PLAN_PREFIXES.some((pref) => p.code === pref || p.code.startsWith(pref + '_'))),
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
    if (pending && isBlockingPendingPayment(pending) && pending.plan_code !== plan.code) {
      toast.info(copy.pendingPlanExists)
      return
    }
    trackEvent(analyticsEvents.productSelected, {
      subscription_plan: plan.code,
    })
    void startCheckout(plan)
  }

  async function startCheckout(plan: Plan) {
    try {
      setBusyCode(plan.code)

      const checkout = await subscriptionApi.checkout(plan.code, false, undefined, sanitizeReferralCode(voucherCode))
      await openSubscriptionCheckout({
        checkout,
        planCode: plan.code,
        locale,
        navigate,
        queryClient: qc,
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

function isBlockingPendingPayment(subscription: { payment_status?: string; expires_at?: string | null }) {
  if (subscription.payment_status !== 'pending') return false
  if (!subscription.expires_at) return true
  const expiresAt = new Date(subscription.expires_at).getTime()
  return Number.isNaN(expiresAt) || expiresAt > Date.now()
}

export default PlansPage
