import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyState, Skeleton } from '@/components/ui'
import { subscriptionApi, type Plan } from '../api'
import { toast } from '@/lib/toast'
import { loadSnap } from '../utils/snap'
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

  const plansQ = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: subscriptionApi.listPlans,
  })

  const activeQ = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
  })

  const [busyCode, setBusyCode] = useState<string | null>(null)
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const snapLoadedRef = useRef(false)


  const allowedPrefixes = ['free', 'pro', 'premium']
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
    if (plan.code.includes('premium')) {
      toast.info('Paket Premium belum tersedia untuk checkout.')
      return
    }
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
        onSuccess: async (result) => {
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
          toast.info('Pembayaran belum selesai')
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
      <PlansHero />

      {active && <ActiveSubscriptionBanner active={active} />}

      {hasYearly && <BillingPeriodToggle period={period} onChange={setPeriod} />}

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
