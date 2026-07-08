import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineCreditCard, HiOutlineSparkles } from 'react-icons/hi2'
import { Card } from '@/components/ui'
import { useT } from '@/i18n'

type WalletRequiredFeature = keyof ReturnType<typeof useT>['wallets']['requiredFeatures']

export function WalletRequiredState({ feature = 'default' }: { feature?: WalletRequiredFeature }) {
  const t = useT()
  const featureName = t.wallets.requiredFeatures[feature] ?? t.wallets.requiredFeatures.default
  const description = t.wallets.requiredDescription.replace('{feature}', featureName)

  return (
    <div className="mx-auto flex min-h-[420px] max-w-2xl items-center px-4 py-8">
      <Card className="relative w-full overflow-hidden border-brand-100 bg-white/90 text-center shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-600" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-700 shadow-sm">
          <HiOutlineCreditCard className="h-8 w-8" />
        </div>
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{t.wallets.requiredEyebrow}</p>
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{t.wallets.requiredTitle}</h2>
          <p className="mx-auto max-w-lg text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/app/wallets"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-200/60 transition hover:-translate-y-0.5 hover:bg-brand-700"
          >
            <HiOutlineSparkles className="h-4 w-4" />
            {t.wallets.requiredPrimary}
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {t.wallets.requiredSecondary}
          </Link>
        </div>
      </Card>
    </div>
  )
}
