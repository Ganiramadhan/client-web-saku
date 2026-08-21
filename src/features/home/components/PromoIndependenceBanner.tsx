import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RiCheckLine, RiFileCopyLine, RiFlag2Fill, RiSparklingLine, RiTimeLine, RiCloseLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'

const STORAGE_KEY = 'saku_promo_17agustus_dismissed_v1'
const VOUCHER_CODE = 'SAKUMERDEKA'

/**
 * Seasonal promo popup for Indonesian Independence Day (17 Agustus).
 * Shows once per browser (persisted via localStorage) shortly after the
 * landing page loads. Neo-brutalist style consistent with the rest of the
 * SAKU landing page: thick black borders, hard drop-shadow, single accent
 * color per block. Reuses the existing `animate-overlay-in` /
 * `animate-panel-in` keyframes already defined in index.css.
 */
export function PromoIndependenceBanner({ isAuthed }: { isAuthed: boolean }) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      // localStorage unavailable (e.g. private mode) — show the popup anyway
    }
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.classList.add('saku-modal-open')
    return () => document.body.classList.remove('saku-modal-open')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => {
    setOpen(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(VOUCHER_CODE)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard API unavailable — no-op, code is still visible to copy manually
    }
  }

  const copy = isId
    ? {
        eyebrow: 'Promo Kemerdekaan',
        title: 'Merdeka dari Catatan Keuangan Berantakan',
        desc: 'Rayakan HUT ke-81 RI bareng SAKU. Diskon 45% untuk paket Pro, berlaku terbatas selama periode 17 Agustusan.',
        badge: 'DISKON 45%',
        voucherLabel: 'Pakai kode voucher',
        copyLabel: copied ? 'Tersalin!' : 'Salin kode',
        cta: 'Klaim Diskon Sekarang',
        later: 'Nanti saja',
        period: 'Berlaku 1 - 31 Agustus',
        close: 'Tutup popup promo',
      }
    : {
        eyebrow: 'Independence Day Promo',
        title: 'Free Yourself From Messy Money Notes',
        desc: 'Celebrate Indonesia\u2019s 81st Independence Day with SAKU. Get 45% off the Pro plan for a limited time.',
        badge: '45% OFF',
        voucherLabel: 'Use voucher code',
        copyLabel: copied ? 'Copied!' : 'Copy code',
        cta: 'Claim The Discount',
        later: 'Maybe later',
        period: 'Valid Aug 1 - 31',
        close: 'Close promo popup',
      }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.eyebrow}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="animate-overlay-in absolute inset-0 bg-[#17120f]/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="animate-panel-in relative w-full max-w-md overflow-hidden rounded-[1.75rem] border-2 border-[#17120f] bg-[#e11d2e] p-5 shadow-[8px_8px_0_#17120f] sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-[45%_55%_35%_65%] border-2 border-[#17120f] bg-white/90"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rotate-12 rounded-[1.5rem] border-2 border-[#17120f] bg-white/25"
        />

        <button
          type="button"
          onClick={handleClose}
          aria-label={copy.close}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl border-2 border-[#17120f] bg-white text-[#17120f] shadow-[2px_2px_0_#17120f] transition hover:-translate-y-0.5 hover:bg-[#fddf82]"
        >
          <RiCloseLine className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-[#17120f] bg-white text-[#e11d2e] shadow-[3px_3px_0_#17120f]">
              <RiFlag2Fill className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                {copy.eyebrow}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-[#17120f] bg-[#fddf82] px-3 py-1 text-xs font-black text-[#17120f]">
                <RiSparklingLine className="h-3.5 w-3.5" />
                {copy.badge}
              </span>
            </div>
          </div>

          <h2 className="mt-5 text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-[1.7rem]">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm font-bold leading-6 text-white/85">
            {copy.desc}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/90">
            <RiTimeLine className="h-3.5 w-3.5" />
            {copy.period}
          </div>

          <div className="mt-5 rounded-2xl border-2 border-[#17120f] bg-[#fffaf6] p-3.5">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#4f4540]">
              {copy.voucherLabel}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex-1 rounded-xl border-2 border-dashed border-[#17120f]/60 bg-[#f6eee8] px-3 py-2 text-center text-lg font-black tracking-[0.2em] text-[#17120f]">
                {VOUCHER_CODE}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#17120f] bg-[#17120f] px-3 py-2.5 text-xs font-black text-white shadow-[2px_2px_0_rgba(23,18,15,0.3)] transition hover:-translate-y-0.5 hover:bg-[#2a221d]"
              >
                {copied ? <RiCheckLine className="h-4 w-4" /> : <RiFileCopyLine className="h-4 w-4" />}
                {copy.copyLabel}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to={isAuthed ? '/app' : '/register'}
              onClick={handleClose}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-[#17120f] bg-[#17120f] px-6 py-3 text-sm font-black text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#2a221d]"
            >
              {copy.cta}
            </Link>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-2xl border-2 border-[#17120f]/40 bg-transparent px-6 py-3 text-sm font-black text-white/85 transition hover:bg-white/10"
            >
              {copy.later}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoIndependenceBanner
