import { Link } from 'react-router-dom'
import { RiFlag2Fill, RiSparklingLine, RiTimeLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'

/**
 * Seasonal promo banner for Indonesian Independence Day (17 Agustus).
 * Neo-brutalist style consistent with the rest of the SAKU landing page:
 * thick black borders, hard drop-shadow, single accent color per block.
 */
export function PromoIndependenceBanner({ isAuthed }: { isAuthed: boolean }) {
  const { locale } = useLocale()
  const isId = locale === 'id'

  const copy = isId
    ? {
        eyebrow: 'Promo Kemerdekaan',
        title: 'Merdeka dari Catatan Keuangan Berantakan',
        desc: 'Rayakan HUT ke-81 RI bareng SAKU. Diskon 45% untuk paket Pro, berlaku terbatas selama periode 17 Agustusan.',
        badge: 'DISKON 45%',
        cta: 'Klaim Diskon 45%',
        period: 'Berlaku 1 - 31 Agustus',
      }
    : {
        eyebrow: 'Independence Day Promo',
        title: 'Free Yourself From Messy Money Notes',
        desc: 'Celebrate Indonesia\u2019s 81st Independence Day with SAKU. Get 45% off the Pro plan for a limited time.',
        badge: '45% OFF',
        cta: 'Claim 45% Off',
        period: 'Valid Aug 1 - 31',
      }

  return (
    <section
      id="promo-17agustus"
      aria-label={copy.eyebrow}
      className="relative overflow-hidden py-4 sm:py-6"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-[#17120f] bg-[#e11d2e] p-5 shadow-[6px_6px_0_#17120f] sm:p-7 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-8">
          {/* decorative doodles: stars + flag shapes, red/white palette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-[45%_55%_35%_65%] border-2 border-[#17120f] bg-white/90"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rotate-12 rounded-[1.5rem] border-2 border-[#17120f] bg-white/25"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-16 bottom-3 hidden text-3xl sm:block"
          >
            ⭐
          </div>

          <div className="relative flex shrink-0 items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-[#17120f] bg-white text-[#e11d2e] shadow-[3px_3px_0_#17120f]">
              <RiFlag2Fill className="h-7 w-7" />
            </div>
            <div className="lg:hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                {copy.eyebrow}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-[#17120f] bg-[#fddf82] px-3 py-1 text-xs font-black text-[#17120f]">
                <RiSparklingLine className="h-3.5 w-3.5" />
                {copy.badge}
              </span>
            </div>
          </div>

          <div className="relative mt-4 lg:mt-0">
            <p className="hidden text-[11px] font-black uppercase tracking-[0.2em] text-white/90 lg:block">
              {copy.eyebrow}
            </p>
            <h2 className="mt-1 max-w-2xl text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-white/85 sm:text-[15px]">
              {copy.desc}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/90">
              <RiTimeLine className="h-3.5 w-3.5" />
              {copy.period}
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center gap-3 lg:mt-0">
            <span className="hidden items-center gap-1 rounded-full border-2 border-[#17120f] bg-[#fddf82] px-4 py-2 text-sm font-black text-[#17120f] shadow-[3px_3px_0_#17120f] lg:inline-flex">
              <RiSparklingLine className="h-4 w-4" />
              {copy.badge}
            </span>
            <Link
              to={isAuthed ? '/app' : '/register'}
              className="inline-flex items-center justify-center rounded-2xl border-2 border-[#17120f] bg-[#17120f] px-6 py-3 text-sm font-black text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#2a221d]"
            >
              {copy.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoIndependenceBanner
