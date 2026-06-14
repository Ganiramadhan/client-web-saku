import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineStar,
} from 'react-icons/hi2'
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
} from '@/components/ui'
import { subscriptionApi, type Plan, type Subscription, type ValidateVoucherResponse } from '@/features/subscription/api'
import { useLocale } from '@/i18n'
import { formatCurrency } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { sanitizeReferralCode } from '../utils/billing'
import { analyticsEvents, trackEvent } from '@/lib/analytics'

export function SubscriptionCard({
  sub,
  pendingSub,
  loading,
  activePlan,
  plans,
  plansLoading,
  busyPlan,
  resumeLoading,
  onSubscribe,
  onCancel,
  cancelLoading,
}: {
  sub: Subscription | null
  pendingSub: Subscription | null
  loading: boolean
  activePlan?: Plan | null
  plans: Plan[]
  plansLoading: boolean
  busyPlan: string | null
  resumeLoading: boolean
  onSubscribe: (planCode: string, voucherCode?: string, resumePending?: boolean) => void
  onCancel: (id: string) => void
  cancelLoading: boolean
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        info: 'Informasi Langganan',
        loading: 'Memuat...',
        pendingTitle: 'Pembayaran Belum Selesai',
        pendingDesc: 'Selesaikan pembayaran untuk mengaktifkan paket',
        expiredTitle: 'Waktu pembayaran habis',
        expiredDesc: 'Invoice pembayaran telah kedaluwarsa. Buat invoice baru untuk melanjutkan aktivasi langganan.',
        payBefore: 'Bayar sebelum',
        expiresIn: 'Sisa waktu',
        expired: 'Kedaluwarsa',
        continuePay: 'Lanjutkan Pembayaran',
        createInvoice: 'Buat Invoice Baru',
        cancelPayment: 'Batalkan Pembayaran',
        freeDesc: 'Akun masih berada di paket Free. Pilih paket untuk membuka fitur AI, laporan lanjutan, dan workflow finansial yang lebih lengkap.',
        referral: 'Kode Voucher',
        referralPlaceholder: 'Contoh: HEMAT20',
        voucherTitle: 'Gunakan voucher?',
        voucherDesc: 'Masukkan kode voucher jika memiliki promo. Kosongkan jika tidak memiliki voucher.',
        voucherApply: 'Terapkan',
        voucherContinue: 'Lanjut Pembayaran',
        voucherSuccess: (code: string) => `Voucher ${code} berhasil digunakan`,
        launchPromo: 'Promo launching',
        voucherInvalid: 'Kode voucher tidak ditemukan atau sudah kedaluwarsa.',
        discount: 'Diskon',
        originalPrice: 'Harga Awal',
        totalPay: 'Total Bayar',
        loadingPlans: 'Memuat paket...',
        noPlans: 'Paket berbayar belum tersedia.',
        month: 'bulan',
        year: 'tahun',
        soon: 'Segera',
        choose: 'Pilih',
        yearlyDiscount: 'Hemat 20%',
        yearly: 'Tahunan',
        monthly: 'Bulanan',
        active: 'Aktif',
        trialEnds: 'Trial berakhir',
        periodUntil: 'Periode hingga',
        nextBilling: 'Tagihan berikutnya',
        activeServices: 'Layanan aktif',
        featureScan: 'Scan struk AI',
        featureNlp: 'Catat transaksi lewat AI',
        featureReports: 'Laporan lanjutan',
        featureWallets: 'Multi wallet',
        featureSupport: 'Dukungan prioritas',
        featureFree: 'Semua fitur Free',
        featureTarget: 'Kantong Tujuan',
        featureBudget: 'Anggaran bulanan',
        unavailable: 'Belum tersedia',
        cancel: 'Batalkan Langganan',
        trialWarning: 'Trial akan segera berakhir',
        renewalWarning: 'Langganan mendekati tanggal perpanjangan',
        autoCharge: 'Auto charge akan digunakan saat metode pembayaran recurring sudah tersedia.',
      }
    : {
        info: 'Subscription Information',
        loading: 'Loading...',
        pendingTitle: 'Payment Not Completed',
        pendingDesc: 'Complete payment to activate plan',
        expiredTitle: 'Payment time has run out',
        expiredDesc: 'The payment invoice has expired. Create a new invoice to continue activating your subscription.',
        payBefore: 'Pay before',
        expiresIn: 'Time left',
        expired: 'Expired',
        continuePay: 'Continue Payment',
        createInvoice: 'Create New Invoice',
        cancelPayment: 'Cancel Payment',
        freeDesc: 'Your account is still on the Free plan. Choose a plan to unlock AI features, advanced reports, and richer financial workflows.',
        referral: 'Voucher Code',
        referralPlaceholder: 'Example: HEMAT20',
        voucherTitle: 'Use a voucher?',
        voucherDesc: 'Enter a voucher code if you have a promo. Leave it empty if you do not have a voucher.',
        voucherApply: 'Apply',
        voucherContinue: 'Continue Payment',
        voucherSuccess: (code: string) => `Voucher ${code} applied successfully`,
        launchPromo: 'Launch promo',
        voucherInvalid: 'Voucher code was not found or has expired.',
        discount: 'Discount',
        originalPrice: 'Original Price',
        totalPay: 'Total Pay',
        loadingPlans: 'Loading plans...',
        noPlans: 'No paid plans are available yet.',
        month: 'month',
        year: 'year',
        soon: 'Soon',
        choose: 'Choose',
        yearlyDiscount: 'Save 20%',
        yearly: 'Yearly',
        monthly: 'Monthly',
        active: 'Active',
        trialEnds: 'Trial ends',
        periodUntil: 'Period until',
        nextBilling: 'Next billing',
        activeServices: 'Active services',
        featureScan: 'AI receipt scanning',
        featureNlp: 'AI transaction recording',
        featureReports: 'Advanced reports',
        featureWallets: 'Multi-wallet',
        featureSupport: 'Priority support',
        featureFree: 'All Free features',
        featureTarget: 'Target Pockets',
        featureBudget: 'Monthly budgets',
        unavailable: 'Unavailable',
        cancel: 'Cancel Subscription',
        trialWarning: 'Trial ends soon',
        renewalWarning: 'Subscription renewal is coming up',
        autoCharge: 'Auto charge will be used once recurring payment method is available.',
      }
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<ValidateVoucherResponse | null>(null)
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const cleanVoucherCode = sanitizeReferralCode(voucherCode)
  const monthlyPlans = new Map(plans.filter((plan) => plan.period === 'monthly').map((plan) => [basePlanCode(plan.code), plan]))
  const hasMonthly = plans.some((plan) => plan.period === 'monthly')
  const hasYearly = plans.some((plan) => plan.period === 'yearly')
  const visiblePlans = plans.filter((plan) => plan.period === period)

  const openVoucherModal = (plan: Plan) => {
    setVoucherCode('')
    setVoucherError('')
    setAppliedVoucher(null)
    setCheckoutPlan(plan)
  }

  const submitVoucherCheckout = async (code?: string) => {
    if (!checkoutPlan) return
    const cleanCode = sanitizeReferralCode(code ?? '')
    if (cleanCode && appliedVoucher?.code !== cleanCode) {
      try {
        const result = await validateVoucher.mutateAsync()
        onSubscribe(checkoutPlan.code, result.code)
      } catch {
        return
      }
    } else {
      onSubscribe(checkoutPlan.code, cleanCode)
    }
    setCheckoutPlan(null)
    setVoucherCode('')
    setVoucherError('')
    setAppliedVoucher(null)
  }

  const validateVoucher = useMutation({
    mutationFn: async () => {
      if (!checkoutPlan) throw new Error(copy.voucherInvalid)
      const code = sanitizeReferralCode(voucherCode)
      if (!code) throw new Error(copy.voucherInvalid)
      return subscriptionApi.validateVoucher(checkoutPlan.code, code)
    },
    onSuccess: (result) => {
      trackEvent(analyticsEvents.voucherApplied, {
        subscription_plan: checkoutPlan?.code,
        amount: result.pay_amount,
      })
      setAppliedVoucher(result)
      setVoucherError('')
      setVoucherCode(result.code)
    },
    onError: (error) => {
      setAppliedVoucher(null)
      const message = toErrorMessage(error)
      setVoucherError(message && /minimum payment/i.test(message) ? message : copy.voucherInvalid)
    },
  })

  const handleVoucherChange = (value: string) => {
    setVoucherCode(sanitizeReferralCode(value))
    setVoucherError('')
    setAppliedVoucher(null)
  }

  useEffect(() => {
    if (!hasMonthly && hasYearly) setPeriod('yearly')
    else if (hasMonthly && !hasYearly) setPeriod('monthly')
  }, [hasMonthly, hasYearly])

  useEffect(() => {
    if (!pendingSub?.expires_at) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [pendingSub?.expires_at])

  if (loading) {
    return (
      <>
      <Card>
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">{copy.info}</h3>
        </div>
        <p className="mt-3 text-xs text-slate-500">{copy.loading}</p>
      </Card>
      <Modal
        open={Boolean(checkoutPlan)}
        title={copy.voucherTitle}
        description={copy.voucherDesc}
        onClose={() => {
          setCheckoutPlan(null)
          setVoucherCode('')
          setVoucherError('')
          setAppliedVoucher(null)
        }}
        footer={
          <Button
            className="w-full sm:w-auto"
            loading={Boolean(checkoutPlan && busyPlan === checkoutPlan.code) || validateVoucher.isPending}
            onClick={() => void submitVoucherCheckout(voucherCode)}
          >
            {copy.voucherContinue}
          </Button>
        }
      >
        <VoucherModalContent
          copy={copy}
          voucherCode={voucherCode}
          voucherError={voucherError}
          appliedVoucher={appliedVoucher}
          validateLoading={validateVoucher.isPending}
          onChange={handleVoucherChange}
          onApply={() => validateVoucher.mutate()}
        />
      </Modal>
      </>
    )
  }
  if (!sub) {
    const pendingExpiresAt = pendingSub?.expires_at ? new Date(pendingSub.expires_at) : null
    const remainingMs = pendingExpiresAt ? pendingExpiresAt.getTime() - nowMs : null
    const isPendingExpired = pendingSub?.payment_status === 'expired' || (remainingMs !== null && remainingMs <= 0)
    const pendingVoucherCode = String(pendingSub?.voucher_code ?? '').trim()
    const isLaunchPromoDiscount = !pendingVoucherCode || /^(welcome|launch|promo)/i.test(pendingVoucherCode)
    const pendingDiscountLabel = isLaunchPromoDiscount ? copy.launchPromo : `Voucher ${pendingVoucherCode}`
    return (
      <>
      <Card>
        {pendingSub && !isPendingExpired ? (
          <div className="mb-5 rounded-2xl border border-white/75 bg-white/70 p-4 shadow-sm shadow-slate-200/50">
            <div className="grid gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{copy.pendingTitle}</p>
                  <Badge tone="amber">Pending</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {pendingSub.plan_name} · {formatCurrency(Number(pendingSub.amount), pendingSub.currency)}
                </p>
                <p className="mt-3 w-full text-xs leading-5 text-slate-500">
                  {copy.pendingDesc}
                </p>
                {Number(pendingSub.discount_amount ?? 0) > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    {pendingDiscountLabel}: -{formatCurrency(Number(pendingSub.discount_amount), pendingSub.currency)}
                  </p>
                ) : null}
                {pendingExpiresAt ? (
                  <div className="mt-3 flex w-full flex-col gap-1 rounded-xl border border-amber-100 bg-amber-50/75 px-3 py-2 text-xs font-semibold text-amber-900 sm:flex-row sm:items-center sm:gap-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <HiOutlineClock className="h-4 w-4" />
                      {copy.payBefore}{' '}
                      {pendingExpiresAt.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-amber-800/80 sm:ml-1">
                      {formatPaymentRemaining(remainingMs ?? 0, locale)}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  size="sm"
                  className="min-h-9 w-full whitespace-nowrap transition hover:-translate-y-0.5 hover:shadow-md"
                  loading={resumeLoading}
                  onClick={() => onSubscribe(pendingSub.plan_code, cleanVoucherCode, true)}
                >
                  {copy.continuePay}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-rose-200 bg-rose-50/80 text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:shadow-md"
                  loading={cancelLoading}
                  onClick={() => onCancel(pendingSub.id)}
                >
                  {copy.cancelPayment}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlineStar className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">{copy.info}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {copy.freeDesc}
            </p>
          </div>
          <Badge tone="gray">Free</Badge>
        </div>
        {hasMonthly && hasYearly ? (
          <div className="mt-4 grid grid-cols-2 rounded-2xl border border-white/80 bg-white/60 p-1 shadow-sm">
            {([
              ['monthly', copy.monthly],
              ['yearly', copy.yearly],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                  period === value
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-100'
                    : 'text-slate-500 hover:bg-white hover:text-brand-700'
                }`}
              >
                {label}
                {value === 'yearly' ? (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${period === value ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                    {copy.yearlyDiscount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3">
          {plansLoading ? (
            <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
              {copy.loadingPlans}
            </p>
          ) : visiblePlans.length === 0 ? (
            <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
              {copy.noPlans}
            </p>
          ) : (
            visiblePlans.map((plan) => {
              const baseCode = basePlanCode(plan.code)
              const monthlyPlan = monthlyPlans.get(baseCode)
              const yearlyOriginal = plan.period === 'yearly' && monthlyPlan?.price
                ? Number(monthlyPlan.price) * 12
                : null
              const isYearly = plan.period === 'yearly'
              const isPro = baseCode === 'pro'
              const hasLaunchPromo = plan.code === 'pro' && plan.period === 'monthly'
              const displayPrice = hasLaunchPromo ? Math.round(Number(plan.price) * 0.7) : Number(plan.price)
              return (
              <div
                key={plan.id}
                className="group rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-950">{plan.name}</p>
                      <Badge tone={isYearly ? 'green' : isPro ? 'blue' : 'gray'}>
                        {isYearly ? copy.yearly : copy.monthly}
                      </Badge>
                      {isYearly ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          {copy.yearlyDiscount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 flex flex-wrap items-end gap-2 text-xs text-slate-500">
                      {hasLaunchPromo ? (
                        <span className="font-semibold text-slate-400 line-through">
                          {formatCurrency(Number(plan.price), plan.currency)}
                        </span>
                      ) : yearlyOriginal ? (
                        <span className="font-semibold text-slate-400 line-through">
                          {formatCurrency(yearlyOriginal, plan.currency)}
                        </span>
                      ) : null}
                      <span className="text-base font-extrabold text-slate-950">
                        {formatCurrency(displayPrice, plan.currency)}
                      </span>
                      <span>/{plan.period === 'monthly' ? copy.month : copy.year}</span>
                      {hasLaunchPromo ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          Promo launching 30%
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={busyPlan === plan.code}
                    onClick={() => openVoucherModal(plan)}
                    className="shrink-0"
                  >
                    {copy.choose}
                  </Button>
                </div>
              </div>
              )
            })
          )}
        </div>
      </Card>
      <Modal
        open={Boolean(checkoutPlan)}
        title={copy.voucherTitle}
        description={copy.voucherDesc}
        onClose={() => {
          setCheckoutPlan(null)
          setVoucherCode('')
          setVoucherError('')
          setAppliedVoucher(null)
        }}
        footer={
          <Button
            className="w-full sm:w-auto"
            loading={Boolean(checkoutPlan && busyPlan === checkoutPlan.code) || validateVoucher.isPending}
            onClick={() => void submitVoucherCheckout(voucherCode)}
          >
            {copy.voucherContinue}
          </Button>
        }
      >
        <VoucherModalContent
          copy={copy}
          voucherCode={voucherCode}
          voucherError={voucherError}
          appliedVoucher={appliedVoucher}
          validateLoading={validateVoucher.isPending}
          onChange={handleVoucherChange}
          onApply={() => validateVoucher.mutate()}
        />
      </Modal>
      </>
    )
  }
  const isTrial = sub.is_trial || sub.status === 'trialing'
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
  const periodEnd = sub.ends_at ? new Date(sub.ends_at) : null
  const warningDate = isTrial ? trialEnd : periodEnd
  const daysLeft = warningDate ? Math.ceil((warningDate.getTime() - Date.now()) / 86_400_000) : null
  const tone: 'green' | 'amber' | 'red' =
    sub.status === 'active' ? 'green' : isTrial ? 'amber' : 'red'
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-amber-500 animate-spin-slow" />
          <h3 className="text-sm font-bold text-slate-900">{copy.info}</h3>
        </div>
        <Badge tone={tone}>
          {isTrial ? 'Trial' : sub.status === 'active' ? copy.active : sub.status}
        </Badge>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-base font-extrabold text-slate-950">{sub.plan_name}</p>
        <p className="text-xs font-semibold text-slate-600">
          {formatCurrency(Number(sub.amount), sub.currency)}
        </p>
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/60 pt-3 text-xs">
        {isTrial && trialEnd ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">{copy.trialEnds}</dt>
            <dd className="font-semibold text-amber-700">
              {trialEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
        {periodEnd ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">{copy.periodUntil}</dt>
            <dd className="font-semibold text-slate-700">
              {periodEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
        {sub.next_billing_at ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">{copy.nextBilling}</dt>
            <dd className="font-semibold text-slate-700">
              {new Date(sub.next_billing_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
      </dl>
      {activePlan && activePlan.features.length > 0 ? (
        <div className="mt-4 border-t border-white/60 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {copy.activeServices}
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {activePlan.features.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <HiOutlineCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="leading-snug">{translatePlanFeature(f, copy)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="font-extrabold text-amber-950">{isTrial ? copy.trialWarning : copy.renewalWarning}</p>
          <p className="mt-1 leading-5">
            {daysLeft === 0 ? (locale === 'id' ? 'Berakhir hari ini.' : 'Ends today.') : `${daysLeft} ${locale === 'id' ? 'hari tersisa' : 'days left'}.`} {copy.autoCharge}
          </p>
        </div>
      ) : null}
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-700">
        {copy.nextBilling}: {sub.next_billing_at
          ? new Date(sub.next_billing_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : periodEnd
            ? periodEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : copy.unavailable}
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="danger"
          size="sm"
          className="shadow-rose-200/50 transition hover:-translate-y-0.5 hover:shadow-md"
          loading={cancelLoading}
          onClick={() => onCancel(sub.id)}
        >
          {copy.cancel}
        </Button>
      </div>
    </Card>
  )
}

function basePlanCode(code: string) {
  return code.replace('_yearly', '')
}

type VoucherModalCopy = {
  referral: string
  referralPlaceholder: string
  voucherApply: string
  voucherSuccess: (code: string) => string
  voucherInvalid: string
  discount: string
  originalPrice: string
  totalPay: string
}

function VoucherModalContent({
  copy,
  voucherCode,
  voucherError,
  appliedVoucher,
  validateLoading,
  onChange,
  onApply,
}: {
  copy: VoucherModalCopy
  voucherCode: string
  voucherError: string
  appliedVoucher: ValidateVoucherResponse | null
  validateLoading: boolean
  onChange: (value: string) => void
  onApply: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          {copy.referral}
        </label>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              className="h-10"
              placeholder={copy.referralPlaceholder}
              value={voucherCode}
              onChange={(e) => onChange(e.target.value)}
              maxLength={32}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 px-4"
            loading={validateLoading}
            disabled={!voucherCode.trim()}
            onClick={onApply}
          >
            {copy.voucherApply}
          </Button>
        </div>
      </div>

      {appliedVoucher ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          <p className="font-extrabold text-emerald-700">✓ {copy.voucherSuccess(appliedVoucher.code)}</p>
          <dl className="mt-3 grid gap-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-emerald-700/80">{copy.discount}</dt>
              <dd className="font-bold">{formatVoucherDiscount(appliedVoucher)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-emerald-700/80">{copy.originalPrice}</dt>
              <dd className="font-bold">{formatCurrency(appliedVoucher.original_amount, appliedVoucher.currency)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-emerald-200/70 pt-2">
              <dt className="font-extrabold text-emerald-900">{copy.totalPay}</dt>
              <dd className="font-extrabold">{formatCurrency(appliedVoucher.pay_amount, appliedVoucher.currency)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {voucherError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold text-rose-700">
          ✕ {voucherError}
        </div>
      ) : null}
    </div>
  )
}

function formatVoucherDiscount(voucher: ValidateVoucherResponse) {
  if (voucher.discount_type === 'percent') {
    return `${voucher.discount_value}%`
  }
  return formatCurrency(voucher.discount_amount, voucher.currency)
}

function formatPaymentRemaining(ms: number, locale: 'id' | 'en') {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return locale === 'id'
      ? `${hours}j ${minutes}m ${seconds}d`
      : `${hours}h ${minutes}m ${seconds}s`
  }
  return locale === 'id'
    ? `${minutes}m ${seconds}d`
    : `${minutes}m ${seconds}s`
}

function translatePlanFeature(
  feature: string,
  copy: {
    featureScan: string
    featureNlp: string
    featureReports: string
    featureWallets: string
    featureSupport: string
    featureFree: string
    featureTarget: string
    featureBudget: string
  },
) {
  const normalized = feature.toLowerCase()
  if (normalized.includes('free')) return copy.featureFree
  if (normalized.includes('scan') || normalized.includes('struk') || normalized.includes('receipt')) return copy.featureScan
  if (normalized.includes('nlp') || normalized.includes('catat') || normalized.includes('recording')) return copy.featureNlp
  if (normalized.includes('report') || normalized.includes('laporan')) return copy.featureReports
  if (normalized.includes('wallet') || normalized.includes('dompet')) return copy.featureWallets
  if (normalized.includes('kantong') || normalized.includes('tujuan') || normalized.includes('target')) return copy.featureTarget
  if (normalized.includes('anggaran') || normalized.includes('budget')) return copy.featureBudget
  if (normalized.includes('support') || normalized.includes('dukungan')) return copy.featureSupport
  return feature
}
