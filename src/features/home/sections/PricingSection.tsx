import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  RiCheckLine,
  RiFlashlightLine,
  RiSparklingLine,
} from 'react-icons/ri'
import { useLocale, useT } from '@/i18n'
import { cn, formatCurrency } from '@/lib/utils'
import {
  subscriptionApi,
  type ValidateVoucherResponse,
} from '@/features/subscription/api'
import { Button, Input, Modal } from '@/components/ui'
import { sanitizeReferralCode } from '@/features/subscription/utils/referral'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { openSubscriptionCheckout } from '@/features/subscription/utils/checkoutFlow'
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

  const normalized = code.includes('premium')
    ? 'premium'
    : code.startsWith('pro')
      ? 'pro'
      : code === 'free'
        ? 'free'
        : null

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

  const [voucherCode, setVoucherCode] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [appliedVoucher, setAppliedVoucher] =
    useState<ValidateVoucherResponse | null>(null)
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
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
    mutationFn: async ({
      planCode,
      voucherCode,
    }: {
      planCode: string
      voucherCode?: string
    }) => {
      const checkout = await subscriptionApi.checkout(
        planCode,
        false,
        undefined,
        sanitizeReferralCode(voucherCode ?? ''),
      )

      return openSubscriptionCheckout({
        checkout,
        planCode,
        locale,
        navigate,
        queryClient: qc,
      })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error))
    },
  })

  const validateVoucherM = useMutation({
    mutationFn: async () => {
      if (!checkoutPlanCode) {
        throw new Error(
          locale === 'id'
            ? 'Kode voucher tidak ditemukan atau sudah kedaluwarsa.'
            : 'Voucher code was not found or has expired.',
        )
      }

      return subscriptionApi.validateVoucher(
        checkoutPlanCode,
        sanitizeReferralCode(voucherCode),
      )
    },
    onSuccess: (result) => {
      trackEvent(analyticsEvents.voucherApplied, {
        subscription_plan: checkoutPlanCode ?? undefined,
        amount: result.pay_amount,
      })

      setAppliedVoucher(result)
      setVoucherCode(result.code)
      setVoucherError('')
    },
    onError: () => {
      setAppliedVoucher(null)
      setVoucherError(
        locale === 'id'
          ? 'Kode voucher tidak ditemukan atau sudah kedaluwarsa.'
          : 'Voucher code was not found or has expired.',
      )
    },
  })

  const fallbackPlans = [
    {
      name: 'Free',
      price: t.landing.planFreePrice,
      originalPrice: null,
      period: '',
      badge: null,
      desc:
        locale === 'id'
          ? 'Untuk mulai membangun kebiasaan mencatat tanpa komitmen.'
          : 'For building a tracking habit without commitment.',
      features: planFeatures('free', locale) ?? [],
      cta: t.landing.ctaPrimary,
      tier: 'free',
    },
    {
      name: 'Pro',
      price:
        period === 'yearly'
          ? formatCurrency(278400, 'IDR')
          : formatCurrency(29000, 'IDR'),
      originalPrice:
        period === 'yearly'
          ? formatCurrency(348000, 'IDR')
          : null,
      period:
        period === 'yearly'
          ? locale === 'id'
            ? '/tahun'
            : '/year'
          : t.landing.perMonth,
      badge: locale === 'id' ? 'Paling Populer' : 'Most Popular',
      desc:
        locale === 'id'
          ? 'Pilihan terbaik untuk pemakaian harian dengan AI, OCR, wallet, dan insight lebih lega.'
          : 'Best for daily use with more AI, OCR, wallets, and insights.',
      features: planFeatures('pro', locale) ?? [],
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      tier: 'pro',
    },
    {
      name: 'Premium',
      price:
        period === 'yearly'
          ? formatCurrency(566400, 'IDR')
          : t.landing.planBizPrice,
      originalPrice:
        period === 'yearly' ? formatCurrency(708000, 'IDR') : null,
      period:
        period === 'yearly'
          ? locale === 'id'
            ? '/tahun'
            : '/year'
          : t.landing.perMonth,
      badge: null,
      desc:
        locale === 'id'
          ? 'Untuk pengguna yang butuh laporan lebih dalam, export PDF, dan dukungan prioritas.'
          : 'For users who need deeper reports, PDF export, and priority support.',
      features: planFeatures('premium', locale) ?? [],
      cta: locale === 'id' ? 'Mulai Premium' : 'Start Premium',
      tier: 'premium',
    },
  ]

  const planCopy: Record<
    string,
    { desc: string; cta: string; badge: string | null }
  > = {
    free: {
      desc:
        locale === 'id'
          ? 'Untuk mulai membangun kebiasaan mencatat tanpa komitmen.'
          : 'For building a tracking habit without commitment.',
      cta: t.landing.ctaPrimary,
      badge: null,
    },
    pro: {
      desc:
        locale === 'id'
          ? 'Pilihan terbaik untuk pemakaian harian dengan AI, OCR, wallet, dan insight lebih lega.'
          : 'Best for daily use with more AI, OCR, wallets, and insights.',
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      badge: locale === 'id' ? 'Paling Populer' : 'Most Popular',
    },
    premium: {
      desc:
        locale === 'id'
          ? 'Untuk pengguna yang butuh laporan lebih dalam, export PDF, dan dukungan prioritas.'
          : 'For users who need deeper reports, PDF export, and priority support.',
      cta: locale === 'id' ? 'Mulai Premium' : 'Start Premium',
      badge: null,
    },
  }

  const monthlyPlansByCode = new Map(
    plansQ.data
      ?.filter((plan) => plan.period === 'monthly')
      .map((plan) => [plan.code, plan]) ?? [],
  )

  const plans =
    plansQ.data && plansQ.data.length > 0
      ? plansQ.data
          .filter((plan) => plan.period === period && plan.is_active)
          .map((plan) => {
            const baseCode = basePlanCode(plan.code)
            const monthlyPlan = monthlyPlansByCode.get(baseCode)
            const yearlyOriginalPrice =
              plan.period === 'yearly' && plan.price > 0 && monthlyPlan?.price
                ? formatCurrency(monthlyPlan.price * 12, plan.currency)
                : null

            return {
              name: plan.name,
              price:
                plan.price <= 0
                  ? t.landing.planFreePrice
                  : formatCurrency(plan.price, plan.currency),
              originalPrice: yearlyOriginalPrice,
              period:
                plan.price <= 0
                  ? ''
                  : plan.period === 'yearly'
                    ? locale === 'id'
                      ? '/tahun'
                      : '/year'
                    : t.landing.perMonth,
              badge: planCopy[baseCode]?.badge ?? null,
              desc:
                planCopy[baseCode]?.desc ??
                (locale === 'id'
                  ? 'Paket fleksibel untuk pengguna SAKU.'
                  : 'Flexible plan for SAKU users.'),
              features:
                planFeatures(plan.code, locale) ??
                plan.features.map((feature) =>
                  translatePlanFeature(feature, locale),
                ),
              cta:
                planCopy[baseCode]?.cta ?? (locale === 'id' ? 'Mulai' : 'Start'),
              tier: plan.code,
            }
          })
      : fallbackPlans

  const hasYearly = Boolean(
    plansQ.data?.some((plan) => plan.period === 'yearly' && plan.is_active),
  )

  const handlePlanClick = (plan: (typeof plans)[number]) => {
    if (!isAuthed) {
      navigate('/register')
      return
    }

    if (isActiveSub(activeQ.data)) {
      navigate('/app/profile')
      return
    }

    const pendingPlan = (subscriptionsQ.data ?? []).find(
      (item) => item.status === 'pending',
    )

    if (pendingPlan && isBlockingPendingPayment(pendingPlan)) {
      toast.info(
        locale === 'id'
          ? 'Masih ada pembayaran pending. Lanjutkan atau batalkan dari Profile sebelum memilih paket lagi.'
          : 'You still have a pending payment. Continue or cancel it from Profile before choosing another plan.',
      )
      navigate('/app/profile')
      return
    }

    if (plan.tier === 'free') {
      navigate('/app/profile')
      return
    }

    trackEvent(analyticsEvents.productSelected, {
      subscription_plan: String(plan.tier),
    })

    setVoucherCode('')
    setVoucherError('')
    setAppliedVoucher(null)
    setCheckoutPlanCode(String(plan.tier))
  }

  const confirmCheckout = async () => {
    if (!checkoutPlanCode) return

    const cleanCode = sanitizeReferralCode(voucherCode)
    let finalVoucherCode = cleanCode

    if (cleanCode && appliedVoucher?.code !== cleanCode) {
      try {
        const result = await validateVoucherM.mutateAsync()
        finalVoucherCode = result.code
      } catch {
        return
      }
    }

    checkoutM.mutate(
      { planCode: checkoutPlanCode, voucherCode: finalVoucherCode },
      {
        onSuccess: (outcome) => {
          if (outcome === 'active') {
            setCheckoutPlanCode(null)
            setVoucherCode('')
            setVoucherError('')
            setAppliedVoucher(null)
          }
        },
      },
    )
  }

  return (
    <section id="pricing" className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.pricing}
          title={
            locale === 'id'
              ? 'Mulai gratis, upgrade saat sudah jadi kebiasaan.'
              : 'Start free, upgrade when it becomes a habit.'
          }
          description={
            locale === 'id'
              ? 'Coba alurnya dulu tanpa tekanan. Pilih Pro atau Premium ketika kamu butuh kapasitas AI, OCR, wallet, dan insight yang lebih luas.'
              : 'Try the workflow first without pressure. Choose Pro or Premium when you need more AI, OCR, wallets, and insights.'
          }
        />

        {hasYearly ? (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-2xl border border-[#17120f]/25 bg-[#fffaf6] p-1 shadow-[0_14px_36px_rgba(23,18,15,0.07)]">
              {[
                ['monthly', locale === 'id' ? 'Bulanan' : 'Monthly'],
                ['yearly', locale === 'id' ? 'Tahunan' : 'Yearly'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value as 'monthly' | 'yearly')}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-black transition-all duration-200',
                    period === value
                      ? 'bg-brand-500 text-[#17120f] shadow-[0_8px_18px_rgba(255,111,97,0.24)]'
                      : 'text-[#4f4540] hover:bg-[#fddf82] hover:text-[#17120f]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:items-stretch">
          {plans.map((plan) => {
            const baseTier = basePlanCode(String(plan.tier))
            const isPro = baseTier === 'pro'
            const isPremium = baseTier.includes('premium')
            const isFree = baseTier === 'free'

            return (
              <div
                key={plan.name}
                className={cn(
                  'landing-mobile-hover relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#17120f]/45 p-6 shadow-[0_20px_55px_rgba(23,18,15,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(23,18,15,0.11)] md:p-7 lg:p-8',
                  isPro
                    ? 'bg-brand-100 md:scale-105'
                    : isPremium
                      ? 'bg-[#fddf82]'
                      : 'bg-[#fffaf6]',
                )}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#17120f]/20 bg-[#fffaf6]/70" />

                {(plan.badge || (period === 'yearly' && plan.tier !== 'free')) && (
                  <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#17120f]/45 bg-brand-500 px-3 py-1 text-xs font-black text-[#17120f] shadow-[0_8px_18px_rgba(255,111,97,0.24)]">
                    <RiSparklingLine className="h-3.5 w-3.5" />
                    {period === 'yearly' && plan.tier !== 'free'
                      ? locale === 'id'
                        ? 'Hemat 20%'
                        : 'Save 20%'
                      : plan.badge}
                  </span>
                )}

                <div className="relative">
                  <h3 className="text-lg font-black text-[#17120f]">
                    {plan.name}
                  </h3>

                  <p className="mt-2 min-h-[3rem] text-sm leading-6 text-[#4f4540]">
                    {plan.desc}
                  </p>

                  {plan.originalPrice ? (
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#4f4540]/60 line-through">
                        {plan.originalPrice}
                      </span>

                      <span className="rounded-full border-2 border-[#17120f] bg-emerald-100 px-2.5 py-1 text-xs font-black text-[#17120f]">
                        {locale === 'id' ? 'Diskon tahunan' : 'Yearly discount'}
                      </span>
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      'flex flex-wrap items-end gap-x-1 gap-y-1',
                      plan.originalPrice ? 'mt-2' : 'mt-6',
                    )}
                  >
                    <span
                      className={cn(
                        'text-3xl font-black tracking-tight sm:text-4xl',
                        isPro ? 'text-brand-700' : 'text-[#17120f]',
                      )}
                    >
                      {plan.price}
                    </span>

                    {plan.period ? (
                      <span className="pb-1.5 text-sm font-bold text-[#4f4540]">
                        {plan.period}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ul className="relative mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm leading-6 text-[#4f4540]"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#17120f]/45',
                          isPro
                            ? 'bg-brand-500 text-[#17120f]'
                            : isPremium
                              ? 'bg-[#fffaf6] text-[#17120f]'
                              : 'bg-[#fddf82] text-[#17120f]',
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
                    'relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#17120f]/55 px-4 py-3 text-sm font-black shadow-[0_12px_28px_rgba(23,18,15,0.08)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70',
                    isPro
                      ? 'bg-brand-500 text-[#17120f] hover:bg-brand-300'
                      : isPremium
                        ? 'bg-[#fffaf6] text-[#17120f] hover:bg-[#f6eee8]'
                        : 'bg-white text-[#17120f] hover:bg-[#fddf82]',
                  )}
                >
                  {isPro && <RiFlashlightLine className="h-4 w-4" />}
                  {checkoutM.isPending && !isFree
                    ? locale === 'id'
                      ? 'Memproses...'
                      : 'Processing...'
                    : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
          {(locale === 'id'
            ? ['Mulai dari Free', 'Voucher opsional', 'Akses langsung setelah aktif']
            : ['Start from Free', 'Voucher optional', 'Instant access after activation']
          ).map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-[#17120f]/30 bg-[#fffaf6] px-3 py-1 text-xs font-black text-[#17120f]"
            >
              <RiCheckLine className="h-4 w-4 text-brand-600" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(checkoutPlanCode)}
        title={locale === 'id' ? 'Kode voucher' : 'Voucher code'}
        description={
          locale === 'id'
            ? 'Punya kode voucher? Masukkan di sini. Kalau tidak punya, kosongkan saja dan lanjut pembayaran.'
            : 'Have a voucher code? Enter it here. If not, leave it empty and continue to payment.'
        }
        onClose={() => {
          if (checkoutM.isPending) return

          setCheckoutPlanCode(null)
          setVoucherCode('')
          setVoucherError('')
          setAppliedVoucher(null)
        }}
        footer={
          <Button
            className="w-full sm:w-auto"
            onClick={() => void confirmCheckout()}
            loading={checkoutM.isPending || validateVoucherM.isPending}
          >
            {locale === 'id' ? 'Lanjut Pembayaran' : 'Continue Payment'}
          </Button>
        }
        mobilePlacement="center"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-black text-[#17120f]">
              {locale === 'id' ? 'Kode Voucher' : 'Voucher Code'}
            </label>

            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  className="h-10 rounded-2xl border-2 border-[#17120f]"
                  placeholder="HEMAT20"
                  value={voucherCode}
                  maxLength={32}
                  onChange={(e) => {
                    setVoucherCode(sanitizeReferralCode(e.target.value))
                    setVoucherError('')
                    setAppliedVoucher(null)
                  }}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-2xl border-2 border-[#17120f] px-4 font-black"
                loading={validateVoucherM.isPending}
                disabled={!voucherCode.trim()}
                onClick={() => validateVoucherM.mutate()}
              >
                {locale === 'id' ? 'Terapkan' : 'Apply'}
              </Button>
            </div>
          </div>

          {appliedVoucher ? (
            <div className="rounded-2xl border-2 border-[#17120f] bg-emerald-100 p-4 text-sm text-[#17120f] shadow-[4px_4px_0_#17120f]">
              <p className="font-black">
                ✓{' '}
                {locale === 'id'
                  ? `Voucher ${appliedVoucher.code} berhasil digunakan`
                  : `Voucher ${appliedVoucher.code} applied successfully`}
              </p>

              <dl className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt>{locale === 'id' ? 'Diskon' : 'Discount'}</dt>
                  <dd className="font-black">
                    {appliedVoucher.discount_type === 'percent'
                      ? `${appliedVoucher.discount_value}%`
                      : formatCurrency(
                          appliedVoucher.discount_amount,
                          appliedVoucher.currency,
                        )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt>{locale === 'id' ? 'Harga Awal' : 'Original Price'}</dt>
                  <dd className="font-black">
                    {formatCurrency(
                      appliedVoucher.original_amount,
                      appliedVoucher.currency,
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 border-t-2 border-[#17120f] pt-2">
                  <dt className="font-black">
                    {locale === 'id' ? 'Total Bayar' : 'Total Pay'}
                  </dt>
                  <dd className="font-black">
                    {formatCurrency(
                      appliedVoucher.pay_amount,
                      appliedVoucher.currency,
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {voucherError ? (
            <div className="rounded-2xl border-2 border-[#17120f] bg-rose-100 px-4 py-3 text-xs font-black text-[#17120f] shadow-[4px_4px_0_#17120f]">
              ✕ {voucherError}
            </div>
          ) : null}
        </div>
      </Modal>
    </section>
  )
}

function isBlockingPendingPayment(subscription: { payment_status?: string; expires_at?: string | null }) {
  if (subscription.payment_status !== 'pending') return false
  if (!subscription.expires_at) return true
  const expiresAt = new Date(subscription.expires_at).getTime()
  return Number.isNaN(expiresAt) || expiresAt > Date.now()
}
