import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RiCheckLine, RiFlashlightLine, RiSparklingLine } from 'react-icons/ri'
import { useLocale, useT } from '@/i18n'
import { cn, formatCurrency } from '@/lib/utils'
import { subscriptionApi } from '@/features/subscription/api'
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

export function PricingSection({ isAuthed }: { isAuthed: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
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
  const checkoutM = useMutation({
    mutationFn: (planCode: string) => subscriptionApi.checkout(planCode),
    onSuccess: (checkout) => {
      window.location.href = checkout.redirect_url
    },
  })
  const fallbackPlans = [
    {
      name: t.landing.planFreeName,
      price: t.landing.planFreePrice,
      period: '',
      badge: null,
      desc: locale === 'id' ? 'Fitur dasar untuk mulai mencatat arus kas harian.' : 'Core tools to start tracking daily cashflow.',
      features: locale === 'id'
        ? ['Input transaksi manual', 'Dompet utama', 'Ringkasan bulanan', 'Akses web responsif']
        : ['Manual transaction entry', 'Primary wallet', 'Monthly summary', 'Responsive web access'],
      cta: t.landing.ctaPrimary,
      tier: 'free',
    },
    {
      name: 'Pro',
      price: t.landing.planProPrice,
      period: t.landing.perMonth,
      badge: locale === 'id' ? 'Terpopuler' : 'Most Popular',
      desc: locale === 'id' ? 'Fitur AI dan kapasitas lebih luas untuk rutinitas finansial yang lebih aktif.' : 'AI features and higher capacity for more active finance routines.',
      features: locale === 'id'
        ? ['Semua fitur Starter', 'Catat transaksi via AI', 'Scan struk', 'Bantu kategori otomatis', 'Budget dan target', 'Split bill', 'Insight pengeluaran', 'Dompet lebih fleksibel']
        : ['Everything in Starter', 'AI transaction entry', 'Receipt scanning', 'Assisted categorization', 'Budgets and goals', 'Split bills', 'Spending insights', 'More flexible wallets'],
      cta: locale === 'id' ? 'Mulai Pro' : 'Start Pro',
      tier: 'pro',
    },
    {
      name: 'Premium',
      price: t.landing.planBizPrice,
      period: t.landing.perMonth,
      badge: null,
      desc: locale === 'id' ? 'Paket lanjutan untuk kebutuhan kolaborasi dan laporan yang lebih dalam.' : 'Advanced plan for collaboration and deeper reporting needs.',
      features: locale === 'id'
        ? ['Semua fitur Pro', 'Kolaborasi keluarga atau tim', 'Analitik lanjutan', 'Laporan kustom', 'Ekspor data', 'Dukungan prioritas', 'Akses fitur awal']
        : ['Everything in Pro', 'Family or team collaboration', 'Advanced analytics', 'Custom reports', 'Data export', 'Priority support', 'Early feature access'],
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
  const plans = plansQ.data && plansQ.data.length > 0
    ? plansQ.data
        .filter((plan) => plan.period === 'monthly' && plan.is_active)
        .map((plan) => ({
          name: plan.name,
          price: plan.price <= 0 ? t.landing.planFreePrice : formatCurrency(plan.price, plan.currency),
          period: plan.price <= 0 ? '' : t.landing.perMonth,
          badge: planCopy[plan.code]?.badge ?? null,
          desc: planCopy[plan.code]?.desc ?? (locale === 'id' ? 'Paket fleksibel untuk pengguna SAKU.' : 'Flexible plan for SAKU users.'),
          features: plan.features.map((feature) => translatePlanFeature(feature, locale)),
          cta: planCopy[plan.code]?.cta ?? (locale === 'id' ? 'Mulai' : 'Start'),
          tier: plan.code,
        }))
    : fallbackPlans

  const handlePlanClick = (plan: (typeof plans)[number]) => {
    if (String(plan.tier).includes('premium')) return
    if (!isAuthed) {
      navigate('/register')
      return
    }
    if (isActiveSub(activeQ.data)) {
      navigate('/app/profile')
      return
    }
    if (plan.tier === 'free') {
      navigate('/app/profile')
      return
    }
    checkoutM.mutate(String(plan.tier))
  }

  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.pricing}
          title={t.landing.pricingTitle}
          description={t.landing.pricingSubtitle}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((plan) => {
            const isPro = plan.tier === 'pro'
            const isPremium = String(plan.tier).includes('premium')

            return (
              <div
                key={plan.name}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2',
                  isPro && 'md:scale-105'
                )}
                style={{
                  background: isPro
                    ? 'rgba(255,255,255,0.86)'
                    : 'rgba(255,255,255,0.68)',
                  backdropFilter: 'blur(36px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(36px) saturate(180%)',
                  border: isPro
                    ? '1px solid rgba(59,130,246,0.34)'
                    : '1px solid rgba(255,255,255,0.86)',
                  boxShadow: isPro
                    ? '0 24px 70px rgba(37,99,235,0.14), inset 0 1px 0 rgba(255,255,255,1)'
                    : '0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
                }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-3xl border border-blue-300/40" />
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-300/20 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" />
                </div>

                {plan.badge && (
                  <span className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-blue-200">
                    <RiSparklingLine className="h-3.5 w-3.5" />
                    {plan.badge}
                  </span>
                )}

                <div className="relative">
                  <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{plan.desc}</p>

                  <div className="mt-6 flex items-end gap-1">
                    <span
                      className={cn(
                        'text-4xl font-extrabold tracking-tight',
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
                  {plan.features.map((feature) => (
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
                  disabled={isPremium || checkoutM.isPending}
                  onClick={() => handlePlanClick(plan)}
                  className={cn(
                    'relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300',
                    isPremium && 'cursor-not-allowed opacity-60',
                    isPro
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-500 hover:shadow-blue-300'
                      : 'border border-slate-200 bg-white/80 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  )}
                >
                  {isPro && <RiFlashlightLine className="h-4 w-4" />}
                  {checkoutM.isPending && isPro
                    ? (locale === 'id' ? 'Memproses...' : 'Processing...')
                    : isPremium ? (locale === 'id' ? 'Belum Tersedia' : 'Coming Soon') : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-slate-500">
          {(locale === 'id' ? ['Mulai dari gratis', 'Upgrade kapan saja', 'Akses langsung'] : ['Start for free', 'Upgrade anytime', 'Instant access']).map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <RiCheckLine className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
