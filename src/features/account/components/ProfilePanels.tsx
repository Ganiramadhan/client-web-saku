import { useEffect, useState } from 'react'
import {
  HiOutlineCheckCircle,
  HiOutlineClipboardDocument,
  HiOutlineClock,
  HiOutlineStar,
} from 'react-icons/hi2'
import {
  Badge,
  Button,
  Card,
  Input,
} from '@/components/ui'
import type { Plan, Subscription } from '@/features/subscription/api'
import { useLocale } from '@/i18n'
import { formatCurrency } from '@/lib/utils'
import { sanitizeReferralCode } from '../utils/billing'

export function ReferralCard({ code, reward }: { code?: string; reward: number }) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        referralCode: 'Kode referal',
        loginAgain: 'Login ulang untuk membuat kode',
        reward: 'Reward',
        title: 'Kode Referal',
        desc: 'Bagikan kode ini. Reward masuk saat pengguna lain membayar langganan dengan kode kamu.',
        copy: 'Salin kode referal',
      }
    : {
        referralCode: 'Referral code',
        loginAgain: 'Log in again to generate a code',
        reward: 'Reward',
        title: 'Referral Code',
        desc: 'Share this code. Rewards are added when another user pays a subscription with your code.',
        copy: 'Copy referral code',
      }
  const [copied, setCopied] = useState(false)
  const rows = [
    { label: copy.referralCode, value: code || copy.loginAgain },
    { label: copy.reward, value: formatCurrency(reward, 'IDR') },
  ]
  const copyCode = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineStar className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-900">{copy.title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {copy.desc}
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-white/80 bg-white/60 shadow-sm">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label}>
                <th className="w-36 bg-slate-50/70 px-3 py-2 font-semibold text-slate-500">
                  {row.label}
                </th>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  <span className="flex items-center justify-between gap-2">
                    <span className={row.label === copy.referralCode ? 'font-mono tracking-wide' : undefined}>
                      {row.value}
                    </span>
                    {row.label === copy.referralCode && code ? (
                      <button
                        type="button"
                        onClick={copyCode}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                        title={copy.copy}
                      >
                        {copied ? (
                          <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <HiOutlineClipboardDocument className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

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
  onSubscribe: (planCode: string, referralCode?: string, resumePending?: boolean) => void
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
        payBefore: 'Bayar sebelum',
        expiresIn: 'Sisa waktu',
        expired: 'Kedaluwarsa',
        continuePay: 'Lanjutkan Pembayaran',
        cancelPayment: 'Batalkan Pembayaran',
        freeDesc: 'Akun masih berada di paket Free. Pilih paket untuk membuka fitur AI, laporan lanjutan, dan workflow finansial yang lebih lengkap.',
        referral: 'Kode Referal',
        referralPlaceholder: 'Opsional saat pembayaran',
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
        payBefore: 'Pay before',
        expiresIn: 'Time left',
        expired: 'Expired',
        continuePay: 'Continue Payment',
        cancelPayment: 'Cancel Payment',
        freeDesc: 'Your account is still on the Free plan. Choose a plan to unlock AI features, advanced reports, and richer financial workflows.',
        referral: 'Referral Code',
        referralPlaceholder: 'Optional during payment',
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
  const [referralCode, setReferralCode] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const cleanReferralCode = sanitizeReferralCode(referralCode)
  const monthlyPlans = new Map(plans.filter((plan) => plan.period === 'monthly').map((plan) => [basePlanCode(plan.code), plan]))
  const hasMonthly = plans.some((plan) => plan.period === 'monthly')
  const hasYearly = plans.some((plan) => plan.period === 'yearly')
  const visiblePlans = plans.filter((plan) => plan.period === period)

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
      <Card>
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">{copy.info}</h3>
        </div>
        <p className="mt-3 text-xs text-slate-500">{copy.loading}</p>
      </Card>
    )
  }
  if (!sub) {
    const pendingExpiresAt = pendingSub?.expires_at ? new Date(pendingSub.expires_at) : null
    const remainingMs = pendingExpiresAt ? pendingExpiresAt.getTime() - nowMs : null
    const isPendingExpired = remainingMs !== null && remainingMs <= 0
    return (
      <Card>
        {pendingSub ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{copy.pendingTitle}</p>
                  <Badge tone={isPendingExpired ? 'red' : 'amber'}>{isPendingExpired ? copy.expired : 'Pending'}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {pendingSub.plan_name} · {formatCurrency(Number(pendingSub.amount), pendingSub.currency)}
                </p>
                {pendingExpiresAt ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <HiOutlineClock className="h-4 w-4" />
                    {copy.payBefore}{' '}
                    {pendingExpiresAt.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}
                    {isPendingExpired ? copy.expired : formatPaymentRemaining(remainingMs ?? 0, locale)}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2 sm:w-56">
                <Button
                  size="sm"
                  className="w-full"
                  loading={resumeLoading}
                  onClick={() => onSubscribe(pendingSub.plan_code, cleanReferralCode, true)}
                >
                  {copy.continuePay}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-200 bg-white/80 text-amber-800 hover:border-amber-300 hover:bg-amber-50"
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
        <div className="mt-4">
          <Input
            label={copy.referral}
            placeholder={copy.referralPlaceholder}
            value={referralCode}
            onChange={(e) => setReferralCode(sanitizeReferralCode(e.target.value))}
            maxLength={32}
          />
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
                      {yearlyOriginal ? (
                        <span className="font-semibold text-slate-400 line-through">
                          {formatCurrency(yearlyOriginal, plan.currency)}
                        </span>
                      ) : null}
                      <span className="text-base font-extrabold text-slate-950">
                        {formatCurrency(Number(plan.price), plan.currency)}
                      </span>
                      <span>/{plan.period === 'monthly' ? copy.month : copy.year}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={busyPlan === plan.code}
                    onClick={() => onSubscribe(plan.code, cleanReferralCode)}
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
