import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RiCheckLine, RiFlashlightLine, RiSparklingLine } from 'react-icons/ri'
import { useLocale, useT } from '@/i18n'
import { cn, formatCurrency } from '@/lib/utils'
import { subscriptionApi } from '@/features/subscription/api'
import { Button, Input, Modal } from '@/components/ui'
import { sanitizeReferralCode } from '@/features/subscription/utils/referral'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { loadSnap } from '@/lib/snap'
import { isActiveSub } from '../components/landingUtils'
import { SectionHeading } from '../components/SectionHeading'

function translatePlanFeature(feature: string, locale: string): string {
  if (locale === 'id') return feature
  const map: Record<string, string> = {
    'Pencatatan transaksi manual': 'Manual transaction tracking',
    '2 dompet': '2 wallets',
    'Kategori dasar': 'Basic categories',
    'Semua fitur Free': 'Everything in Free',
    'Scan struk dengan AI': 'AI receipt scanning',
    'Catat via AI (free text)': 'AI free-text transaction entry',
    'Dompet & kategori tanpa batas': 'Unlimited wallets and categories',
    'Kantong Tujuan': 'Savings goals',
    'Anggaran bulanan': 'Monthly budgets',
    'Semua fitur Pro': 'Everything in Pro',
    'Budget Tracker lanjutan': 'Advanced budget tracker',
    'Lampiran & arsip': 'Attachments and archive',
    'Export Excel': 'Excel export',
    'Prioritas support': 'Priority support',
  }
  return map[feature] ?? feature
}

function planFeatures(code: string, locale: string): string[] | null {
  const features = {
    free: {
      id: [
        'Transaksi tanpa batas',
        '2 dompet',
        'Target anggaran',
        'AI Chat 20/bulan',
        'OCR 10/bulan',
        'Insight AI dasar',
        '3 upcoming billing',
      ],
      en: [
        'Unlimited Transactions',
        '2 Wallets',
        'Budget Targets',
        'AI Chat 20/month',
        'OCR 10/month',
        'Basic AI Insights',
        '3 Upcoming Billings',
      ],
    },
    pro: {
      id: [
        'Semua fitur Free',
        'Dompet tanpa batas',
        'AI Chat 300/bulan',
        'OCR 100/bulan',
        'Upcoming billing tanpa batas',
        'Split bill',
        'Recurring transactions',
        'Export CSV/Excel',
        'Insight AI lengkap',
      ],
      en: [
        'Everything in Free',
        'Unlimited Wallets',
        'AI Chat 300/month',
        'OCR 100/month',
        'Unlimited Upcoming Billings',
        'Split Bill',
        'Recurring Transactions',
        'Export CSV/Excel',
        'Rich AI Insights',
      ],
    },
    premium: {
      id: [
        'Semua fitur Pro',
        'AI Chat 1.200/bulan',
        'OCR 300/bulan',
        'Laporan lanjutan',
        'Export PDF',
        'Dukungan prioritas',
      ],
      en: [
        'Everything in Pro',
        'AI Chat 1,200/month',
        'OCR 300/month',
        'Advanced Reports',
        'PDF Export',
        'Priority Support',
      ],
    },
  } as const
  const normalized = code.includes('premium') ? 'premium' : code.startsWith('pro') ? 'pro' : code === 'free' ? 'free' : null
  if (!normalized) return null
  return [...features[normalized][locale === 'id' ? 'id' : 'en']]
}

function basePlanCode(code: string) {
  return code.replace('_yearly', '')
}

export function PricingSection({ isAuthed }: { isAuthed: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const snapLoadedRef = useRef(false)
  const [referralCode, setReferralCode] = useState('')
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )
  const plansQ = useQuery({
    queryKey: ['landing', 'subscription-plans'],
    queryFn: subscriptionApi.listPlans,
  })
  const activeQ = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: subscriptionApi.active,
    enabled: isAuthed,
    staleTime: 60 * 1000,
  })
  const subscriptionsQ = useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: subscriptionApi.mySubscriptions,
    enabled: isAuthed,
    staleTime: 60 * 1000,
  })
  const checkoutM = useMutation({
    mutationFn: async ({ planCode, referralCode }: { planCode: string; referralCode?: string }) => {
      const checkout = await subscriptionApi.checkout(planCode, false, sanitizeReferralCode(referralCode ?? ''))
      if (!snapLoadedRef.current) {
        await loadSnap(checkout.client_key, checkout.is_production)
        snapLoadedRef.current = true
      }
      return checkout
    },
    onSuccess: (checkout) => {
      if (!window.snap) {
        window.location.href = checkout.redirect_url
        return
      }

      window.snap.pay(checkout.snap_token, {
        onSuccess: async (result) => {
          const orderId =
            result && typeof result === 'object' && 'order_id' in result
              ? String((result as { order_id?: unknown }).order_id ?? '')
              : checkout.order_id
          if (orderId) await subscriptionApi.confirm(orderId)
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
          qc.invalidateQueries({ queryKey: ['subscription', 'active'] })
          navigate(`/app/subscription/thanks${orderId ? `?order_id=${encodeURIComponent(orderId)}` : ''}`)
        },
        onPending: () => {
          toast.info(locale === 'id' ? 'Pembayaran masih pending.' : 'Payment is still pending.')
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
        },
        onError: () => toast.error(locale === 'id' ? 'Pembayaran gagal.' : 'Payment failed.'),
        onClose: () => {
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
        },
      })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error))
    },
  })
  const fallbackPlans = [
    {
      name: 'Free',
      price: t.landing.planFreePrice,
      originalPrice: null,
      period: '',
      badge: null,
      desc: locale === 'id' ? 'Fitur dasar untuk mulai mencatat arus kas harian.' : 'Core tools to start tracking daily cashflow.',
      features: planFeatures('free', locale) ?? [],
      cta: t.landing.ctaPrimary,
      tier: 'free',
    },
    {
      name: 'Pro',
      price: period === 'yearly' ? formatCurrency(278400, 'IDR') : t.landing.planProPrice,
      originalPrice: period === 'yearly' ? formatCurrency(348000, 'IDR') : null,
      period: period === 'yearly' ? (locale === 'id' ? '/tahun' : '/year') : t.landing.perMonth,
      badge: locale === 'id' ? 'Terpopuler' : 'Most Popular',
      desc: locale === 'id' ? 'Fitur AI dan kapasitas lebih luas untuk rutinitas finansial yang lebih aktif.' : 'AI features and higher capacity for more active finance routines.',
      features: planFeatures('pro', locale) ?? [],
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      tier: 'pro',
    },
    {
      name: 'Premium',
      price: period === 'yearly' ? formatCurrency(566400, 'IDR') : t.landing.planBizPrice,
      originalPrice: period === 'yearly' ? formatCurrency(708000, 'IDR') : null,
      period: period === 'yearly' ? (locale === 'id' ? '/tahun' : '/year') : t.landing.perMonth,
      badge: null,
      desc: locale === 'id' ? 'Paket lanjutan untuk kebutuhan kolaborasi dan laporan yang lebih dalam.' : 'Advanced plan for collaboration and deeper reporting needs.',
      features: planFeatures('premium', locale) ?? [],
      cta: locale === 'id' ? 'Mulai Premium' : 'Start Premium',
      tier: 'premium',
    },
  ]
  const planCopy: Record<string, { desc: string; cta: string; badge: string | null }> = {
    free: {
      desc: locale === 'id' ? 'Fitur dasar untuk mulai mencatat arus kas harian.' : 'Core tools to start tracking daily cashflow.',
      cta: t.landing.ctaPrimary,
      badge: null,
    },
    pro: {
      desc: locale === 'id' ? 'Fitur AI dan kapasitas lebih luas untuk rutinitas finansial yang lebih aktif.' : 'AI features and higher capacity for more active finance routines.',
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      badge: locale === 'id' ? 'Terpopuler' : 'Most Popular',
    },
    premium: {
      desc: locale === 'id' ? 'Paket lanjutan untuk kebutuhan kolaborasi dan laporan yang lebih dalam.' : 'Advanced plan for collaboration and deeper reporting needs.',
      cta: locale === 'id' ? 'Mulai Premium' : 'Start Premium',
      badge: null,
    },
  }
  const monthlyPlansByCode = new Map(
    plansQ.data
      ?.filter((plan) => plan.period === 'monthly')
      .map((plan) => [plan.code, plan]) ?? [],
  )
  const plans = plansQ.data && plansQ.data.length > 0
    ? plansQ.data
        .filter((plan) => plan.period === period && plan.is_active)
        .map((plan) => {
          const baseCode = basePlanCode(plan.code)
          const monthlyPlan = monthlyPlansByCode.get(baseCode)
          const yearlyOriginalPrice = plan.period === 'yearly' && plan.price > 0 && monthlyPlan?.price
            ? formatCurrency(monthlyPlan.price * 12, plan.currency)
            : null

          return {
            name: plan.name,
            price: plan.price <= 0 ? t.landing.planFreePrice : formatCurrency(plan.price, plan.currency),
            originalPrice: yearlyOriginalPrice,
            period: plan.price <= 0 ? '' : plan.period === 'yearly' ? (locale === 'id' ? '/tahun' : '/year') : t.landing.perMonth,
            badge: planCopy[baseCode]?.badge ?? null,
            desc: planCopy[baseCode]?.desc ?? (locale === 'id' ? 'Paket fleksibel untuk pengguna SAKU.' : 'Flexible plan for SAKU users.'),
            features: planFeatures(plan.code, locale) ?? plan.features.map((feature) => translatePlanFeature(feature, locale)),
            cta: planCopy[baseCode]?.cta ?? (locale === 'id' ? 'Mulai' : 'Start'),
            tier: plan.code,
          }
        })
    : fallbackPlans
  const hasYearly = Boolean(plansQ.data?.some((plan) => plan.period === 'yearly' && plan.is_active))

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const handlePlanClick = (plan: (typeof plans)[number]) => {
    if (!isAuthed) {
      navigate('/register')
      return
    }
    if (isActiveSub(activeQ.data)) {
      navigate('/app/profile')
      return
    }
    const pendingPlan = (subscriptionsQ.data ?? []).find((item) => item.status === 'pending')
    if (pendingPlan && pendingPlan.plan_code !== plan.tier) {
      toast.info(
        locale === 'id'
          ? 'Masih ada pembayaran pending. Batalkan pembayaran tersebut dulu sebelum memilih paket lain.'
          : 'You still have a pending payment. Cancel it first before choosing another plan.',
      )
      navigate('/app/profile')
      return
    }
    if (plan.tier === 'free') {
      navigate('/app/profile')
      return
    }
    setCheckoutPlanCode(String(plan.tier))
  }

  const confirmCheckout = () => {
    if (!checkoutPlanCode) return
    checkoutM.mutate(
      { planCode: checkoutPlanCode, referralCode },
      {
        onSuccess: () => {
          setCheckoutPlanCode(null)
          setReferralCode('')
        },
      },
    )
  }

  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.pricing}
          title={t.landing.pricingTitle}
          description={t.landing.pricingSubtitle}
        />

        {hasYearly ? (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white/75 p-1 shadow-sm">
              {([
                ['monthly', locale === 'id' ? 'Bulanan' : 'Monthly'],
                ['yearly', locale === 'id' ? 'Tahunan' : 'Yearly'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-bold transition',
                    period === value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isMobile ? (
          <div className="mt-10 grid gap-3">
            {plans.map((plan) => {
              const baseTier = basePlanCode(String(plan.tier))
              const isPro = baseTier === 'pro'
              const isPremium = baseTier.includes('premium')

              return (
                <div
                  key={plan.name}
                  className={cn(
                    'landing-mobile-hover rounded-2xl border bg-white/88 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/40',
                    isPro ? 'border-blue-200' : isPremium ? 'border-violet-200' : 'border-slate-200',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-slate-950">{plan.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{plan.desc}</p>
                    </div>
                    {plan.badge || (period === 'yearly' && plan.tier !== 'free') ? (
                      <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">
                        {period === 'yearly' && plan.tier !== 'free' ? (locale === 'id' ? 'Hemat' : 'Save') : plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-x-1 gap-y-1">
                    {plan.originalPrice ? (
                      <span className="mr-2 text-xs font-semibold text-slate-400 line-through">
                        {plan.originalPrice}
                      </span>
                    ) : null}
                    <span className={cn('text-2xl font-black tracking-tight', isPro ? 'text-blue-700' : 'text-slate-950')}>
                      {plan.price}
                    </span>
                    {plan.period ? <span className="pb-1 text-xs font-medium text-slate-400">{plan.period}</span> : null}
                  </div>

                  <ul className="mt-4 grid gap-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                        <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', isPro ? 'bg-blue-500' : isPremium ? 'bg-violet-500' : 'bg-slate-400')} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={checkoutM.isPending}
                    onClick={() => handlePlanClick(plan)}
                    className={cn(
                    'mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5',
                      isPro
                        ? 'bg-blue-600 text-white'
                        : isPremium
                          ? 'border border-violet-200 bg-violet-50 text-violet-700'
                          : 'border border-slate-200 bg-white text-slate-700',
                    )}
                  >
                    {checkoutM.isPending && isPro
                      ? (locale === 'id' ? 'Memproses...' : 'Processing...')
                      : plan.cta}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((plan) => {
            const baseTier = basePlanCode(String(plan.tier))
            const isPro = baseTier === 'pro'
            const isPremium = baseTier.includes('premium')
            const visibleFeatures = plan.features

            return (
              <div
                key={plan.name}
                className={cn(
                  'landing-mobile-hover relative flex flex-col overflow-hidden border bg-white/88 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/40',
                  'rounded-3xl p-8',
                  isPro ? 'border-blue-200 md:scale-105' : 'border-slate-200'
                )}
              >
                {(plan.badge || (period === 'yearly' && plan.tier !== 'free')) && (
                  <span className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-blue-200">
                    <RiSparklingLine className="h-3.5 w-3.5" />
                    {period === 'yearly' && plan.tier !== 'free' ? (locale === 'id' ? 'Hemat 20%' : 'Save 20%') : plan.badge}
                  </span>
                )}

                <div className="relative">
                  <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{plan.desc}</p>

                  {plan.originalPrice ? (
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        {plan.originalPrice}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                        {locale === 'id' ? 'Diskon tahunan' : 'Yearly discount'}
                      </span>
                    </div>
                  ) : null}

                  <div className={cn('flex items-end gap-1', plan.originalPrice ? 'mt-2' : 'mt-6')}>
                    <span
                      className={cn(
                        'font-extrabold tracking-tight',
                        'text-4xl',
                        isPro ? 'text-blue-700' : 'text-slate-950'
                      )}
                    >
                      {plan.price}
                    </span>

                    {plan.period && (
                      <span className="pb-1.5 text-sm font-medium text-slate-400">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="relative mt-7 flex-1 space-y-3">
                  {visibleFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          isPro
                            ? 'border-blue-200 bg-blue-50 text-blue-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        )}
                      >
                        <RiCheckLine className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={checkoutM.isPending}
                  onClick={() => handlePlanClick(plan)}
                  className={cn(
                    'relative inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-colors duration-200',
                    'mt-8',
                    isPremium && 'border-violet-200 bg-violet-50/80 text-violet-700 hover:border-violet-300 hover:bg-violet-50',
                    isPro
                      ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500'
                      : 'border border-slate-200 bg-white/80 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  )}
                >
                  {isPro && <RiFlashlightLine className="h-4 w-4" />}
                  {checkoutM.isPending && isPro
                    ? (locale === 'id' ? 'Memproses...' : 'Processing...')
                    : plan.cta}
                </button>
              </div>
            )
          })}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-slate-500">
          {(locale === 'id' ? ['Mulai dari gratis', 'Upgrade kapan saja', 'Akses langsung'] : ['Start for free', 'Upgrade anytime', 'Instant access']).map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <RiCheckLine className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(checkoutPlanCode)}
        title={locale === 'id' ? 'Kode referal' : 'Referral code'}
        onClose={() => {
          if (checkoutM.isPending) return
          setCheckoutPlanCode(null)
          setReferralCode('')
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCheckoutPlanCode(null)
                setReferralCode('')
              }}
              disabled={checkoutM.isPending}
            >
              {locale === 'id' ? 'Lewati' : 'Skip'}
            </Button>
            <Button onClick={confirmCheckout} loading={checkoutM.isPending}>
              {locale === 'id' ? 'Lanjut pembayaran' : 'Continue payment'}
            </Button>
          </>
        }
      >
        <Input
          label={locale === 'id' ? 'Kode referal' : 'Referral code'}
          placeholder={locale === 'id' ? 'Opsional saat pembayaran' : 'Optional before payment'}
          value={referralCode}
          maxLength={32}
          onChange={(e) => setReferralCode(sanitizeReferralCode(e.target.value))}
        />
      </Modal>
    </section>
  )
}
