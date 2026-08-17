import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import QRCode from 'qrcode'
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineClipboard,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
} from 'react-icons/hi2'
import { Button, Modal, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { subscriptionApi, type Subscription } from '../api'
import type { QrisCheckoutRequest } from '../utils/qrisCheckoutBus'
import { clearPendingOrder, invalidateSubscriptionQueries, type CheckoutOutcome } from '../utils/checkoutFlow'
import { streamOrderStatus } from '../utils/statusStream'

const LOW_TIME_MS = 60_000
const QR_PIXEL_SIZE = 360
const AUTO_DISMISS_MS = 6000
const AUTO_DISMISS_SECONDS = Math.ceil(AUTO_DISMISS_MS / 1000)

const CONFETTI = [
  { tx: '-34px', ty: '-26px', color: '#6ee7b7' },
  { tx: '30px', ty: '-32px', color: '#10b981' },
  { tx: '-40px', ty: '10px', color: '#fddf82' },
  { tx: '38px', ty: '14px', color: '#34d399' },
  { tx: '-16px', ty: '38px', color: '#059669' },
  { tx: '18px', ty: '40px', color: '#6ee7b7' },
] as const


type Phase = 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed' | 'error'

function InfoRow({ label, value, mono, accent }: { label: string; value: ReactNode; mono?: boolean; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-dashed border-[#17120f]/14 pt-2 first:mt-0 first:border-t-0 first:pt-0">
      <span className="shrink-0 font-semibold text-[#4f4540]">{label}</span>
      <span className={cn('font-black', accent ?? 'text-[#17120f]', mono && 'truncate font-mono text-[11px]')}>{value}</span>
    </div>
  )
}

/** Info card shell — same structure/spacing in every phase; `tone` tints the
 * border/background to match the phase's accent color instead of a flat,
 * washed-out neutral card. */
function InfoCard({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'emerald' }) {
  const tones: Record<string, string> = {
    brand: 'border-brand-200 bg-brand-50/60',
    emerald: 'border-emerald-200 bg-emerald-50/60',
  }
  return (
    <div className={cn('w-full space-y-2 rounded-2xl border px-4 py-4 text-left text-xs shadow-sm shadow-[#17120f]/5', tones[tone])}>
      {children}
    </div>
  )
}

function planLabel(planCode: string, isId: boolean): string {
  const base = planCode.replace(/_yearly$/i, '')
  const label = base ? base.charAt(0).toUpperCase() + base.slice(1) : planCode
  return /_yearly$/i.test(planCode) ? `${label} (${isId ? 'Tahunan' : 'Yearly'})` : label
}

export function QrisPaymentModal({
  req,
  onSettle,
}: {
  req: QrisCheckoutRequest
  onSettle: (outcome: CheckoutOutcome) => void
}) {
  const { checkout, planCode, locale, queryClient } = req
  const isId = locale === 'id'

  const hasQR = Boolean(checkout.qr_string || checkout.qr_image_url)
  const [phase, setPhase] = useState<Phase>(hasQR ? 'pending' : 'error')
  const [qrImage, setQrImage] = useState<string>('')
  const [remainingMs, setRemainingMs] = useState<number>(msUntil(checkout.expires_at))
  const [checking, setChecking] = useState(false)
  const [paidSubscription, setPaidSubscription] = useState<Subscription | null>(null)
  const [autoCloseIn, setAutoCloseIn] = useState(AUTO_DISMISS_SECONDS)
  const [barShrunk, setBarShrunk] = useState(false)
  const settledRef = useRef(false)
  const terminalRef = useRef(false)

  const copy = isId
    ? {
        title: 'Bayar dengan QRIS',
        desc: 'Scan kode ini dari e-wallet atau m-banking yang mendukung QRIS.',
        preparing: 'Menyiapkan kode QRIS…',
        expiresIn: 'Kedaluwarsa',
        checkNow: 'Cek status sekarang',
        copyCode: 'Salin kode',
        copied: 'Kode QRIS disalin',
        download: 'Download QR',
        downloaded: 'QR disimpan',
        paid: 'Pembayaran berhasil!',
        paidDesc: 'Paket kamu sudah aktif.',
        plan: 'Paket',
        activeUntil: 'Aktif hingga',
        done: 'Selesai',
        autoClosing: (s: number) => `Menutup otomatis dalam ${s}d`,
        expired: 'QR kedaluwarsa',
        expiredDesc: 'Waktu pembayaran sudah habis. Buat invoice baru untuk mencoba lagi.',
        cancelledTitle: 'Pembayaran dibatalkan',
        cancelledDesc: 'Transaksi ini dibatalkan sebelum selesai. Kamu bisa membuat invoice baru kapan saja.',
        failedTitle: 'Pembayaran gagal',
        failedDesc: 'Transaksi ditolak oleh payment gateway. Tidak ada saldo yang terpotong — coba lagi atau pakai metode lain.',
        errorTitle: 'QRIS tidak tersedia',
        errorDesc: 'Terjadi kendala saat menyiapkan pembayaran. Silakan coba lagi.',
        close: 'Tutup',
        amount: 'Total',
        order: 'Order ID',
        secure: 'Diproses aman melalui Midtrans',
        closedToast: 'Checkout ditutup. Kamu tetap di halaman ini dan bisa membuka QRIS lagi.',
        successToast: 'Pembayaran diterima, paket kamu sedang diaktifkan.',
        streamLostToast: 'Update otomatis terputus. Tap "Cek status sekarang" kalau sudah bayar.',
      }
    : {
        title: 'Pay with QRIS',
        desc: 'Scan this code from any e-wallet or m-banking app that supports QRIS.',
        preparing: 'Preparing your QRIS code…',
        expiresIn: 'Expires',
        checkNow: 'Check status now',
        copyCode: 'Copy code',
        copied: 'QRIS code copied',
        download: 'Download QR',
        downloaded: 'QR saved',
        paid: 'Payment successful!',
        paidDesc: 'Your plan is now active.',
        plan: 'Plan',
        activeUntil: 'Active until',
        done: 'Done',
        autoClosing: (s: number) => `Closing automatically in ${s}s`,
        expired: 'QR expired',
        expiredDesc: 'The payment window has passed. Create a new invoice to try again.',
        cancelledTitle: 'Payment cancelled',
        cancelledDesc: 'This transaction was cancelled before it completed. You can create a new invoice anytime.',
        failedTitle: 'Payment failed',
        failedDesc: 'The transaction was declined by the payment gateway. No balance was deducted — try again or use another method.',
        errorTitle: 'QRIS unavailable',
        errorDesc: 'Something went wrong while preparing this payment. Please try again.',
        close: 'Close',
        amount: 'Total',
        order: 'Order ID',
        secure: 'Securely processed through Midtrans',
        closedToast: 'Checkout was closed. You can stay here and reopen QRIS.',
        successToast: 'Payment received, your plan is being activated.',
        streamLostToast: 'Live updates disconnected. Tap "Check status now" once you\'ve paid.',
      }

  // Render the QR code locally from the raw EMV string when we have one — no image
  // hotlinked from Midtrans. Some accounts/acquirers don't return qr_string though,
  // so fall back to Midtrans's own hosted QR image (checkout.qr_image_url) below.
  useEffect(() => {
    if (!checkout.qr_string) return
    let cancelled = false
    QRCode.toDataURL(checkout.qr_string, { width: QR_PIXEL_SIZE, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setQrImage(url)
      })
      .catch(() => {
        if (!cancelled && !checkout.qr_image_url) setPhase('error')
      })
    return () => {
      cancelled = true
    }
  }, [checkout.qr_string, checkout.qr_image_url])

  const displayImage = qrImage || checkout.qr_image_url || ''

  const settle = (outcome: CheckoutOutcome) => {
    if (settledRef.current) return
    settledRef.current = true
    invalidateSubscriptionQueries(queryClient)
    onSettle(outcome)
  }

  // Applies a real, gateway-verified subscription status — whether it arrived by
  // push from the SSE stream or from a manual "check now" tap. Never invents a
  // "paid" state on its own, and only ever acts on the first terminal result it
  // sees (the stream and a manual check can race each other close to the end).
  const applyStatus = (subscription: Subscription) => {
    if (settledRef.current || terminalRef.current) return
    const active = subscription.status === 'active' && subscription.payment_status === 'paid'
    if (active) {
      terminalRef.current = true
      clearPendingOrder(checkout.order_id)
      trackEvent(analyticsEvents.paymentSuccess, {
        subscription_plan: planCode,
        payment_method: 'qris',
        amount: checkout.amount,
      })
      // Stay right here — no page navigation. The result is shown inline in this
      // same card, and invalidating the subscription queries below is enough for
      // the rest of the page (plan badges, buttons, etc.) to update on its own.
      setPaidSubscription(subscription)
      setPhase('paid')
      invalidateSubscriptionQueries(queryClient)
      toast.success(copy.successToast)
      return
    }
    if (subscription.payment_status === 'expired' || subscription.payment_status === 'cancelled' || subscription.payment_status === 'failed') {
      terminalRef.current = true
      trackEvent(analyticsEvents.paymentFailed, {
        subscription_plan: planCode,
        payment_status: subscription.payment_status,
        amount: checkout.amount,
      })
      setPhase(subscription.payment_status)
    }
  }

  // User-triggered nudge — e.g. right after paying, without waiting for the next
  // server push. Only this sets `checking`, so the button never animates on its
  // own, and it no-ops while already in flight so a double-tap can't fire two
  // overlapping confirm() calls.
  const handleManualCheck = async () => {
    if (settledRef.current || terminalRef.current || checking) return
    setChecking(true)
    try {
      applyStatus(await subscriptionApi.confirm(checkout.order_id))
    } catch {
      // Transient network/gateway hiccup — the stream will catch the real status.
    } finally {
      setChecking(false)
    }
  }

  // Countdown tick. When the client clock hits zero, do one last real check
  // instead of assuming expired outright — a payment made right at the wire
  // can still settle a moment after the QR's nominal expiry, and the gateway
  // is the actual source of truth, not the local clock.
  useEffect(() => {
    if (phase !== 'pending') return
    const id = window.setInterval(() => {
      const left = msUntil(checkout.expires_at)
      setRemainingMs(left)
      if (left > 0) return
      window.clearInterval(id)
      void (async () => {
        try {
          applyStatus(await subscriptionApi.confirm(checkout.order_id))
        } catch {
          // Couldn't reach the server for the final check — fall back below.
        }
        if (!terminalRef.current) setPhase('expired')
      })()
    }, 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, checkout.expires_at])

  // Live status via Server-Sent Events — the backend pushes an update whenever the
  // payment status actually changes (webhook-driven, with a server-side Midtrans
  // reconciliation poll as a safety net). No client-side polling loop here at all.
  useEffect(() => {
    if (phase !== 'pending') return
    const stream = streamOrderStatus<Subscription>(
      checkout.order_id,
      (subscription) => applyStatus(subscription),
      () => toast.info(copy.streamLostToast),
    )
    return () => stream.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Auto-close a few seconds after success, in case the user doesn't tap "Done" —
  // with a visible countdown (number + shrinking bar) so it's never a surprise.
  useEffect(() => {
    if (phase !== 'paid') return
    // phase only ever transitions to 'paid' once, so autoCloseIn/barShrunk's
    // initial state values already start correct — just kick off the timers.
    const raf = requestAnimationFrame(() => setBarShrunk(true))
    const tickId = window.setInterval(() => {
      setAutoCloseIn((s) => Math.max(0, s - 1))
    }, 1000)
    const closeId = window.setTimeout(() => settle('active'), AUTO_DISMISS_MS)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(tickId)
      window.clearTimeout(closeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleClose = () => {
    if (phase === 'paid') return
    if (phase === 'pending') toast.info(copy.closedToast)
    settle('closed')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkout.qr_string)
      toast.success(copy.copied)
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context); ignore silently.
    }
  }

  const handleDownload = () => {
    if (!displayImage) return
    const link = document.createElement('a')
    link.href = displayImage
    link.download = `SAKU-QRIS-${checkout.order_id}.png`
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (qrImage) toast.success(copy.downloaded)
  }

  const lowTime = remainingMs <= LOW_TIME_MS
  const amountText = `IDR ${Math.round(checkout.amount).toLocaleString(isId ? 'id-ID' : 'en-US')}`

  // Each negative outcome gets its own icon/color/copy instead of one generic
  // "error" bucket — a cancelled payment isn't a "QRIS unavailable" technical
  // fault, and an expired QR isn't the same thing as a declined transaction.
  const negativeContent: Partial<Record<Phase, { Icon: typeof HiOutlineClock; tone: string; title: string; desc: string }>> = {
    expired: { Icon: HiOutlineClock, tone: 'bg-amber-50 text-amber-600 ring-amber-100', title: copy.expired, desc: copy.expiredDesc },
    cancelled: { Icon: HiOutlineNoSymbol, tone: 'bg-slate-100 text-slate-500 ring-slate-200', title: copy.cancelledTitle, desc: copy.cancelledDesc },
    failed: { Icon: HiOutlineXCircle, tone: 'bg-rose-50 text-rose-600 ring-rose-100', title: copy.failedTitle, desc: copy.failedDesc },
    error: { Icon: HiOutlineExclamationTriangle, tone: 'bg-amber-50 text-amber-600 ring-amber-100', title: copy.errorTitle, desc: copy.errorDesc },
  }
  const negative = negativeContent[phase]

  return (
    <Modal open onClose={handleClose} title={copy.title} description={copy.desc} size="md" mobilePlacement="center">
      <div className="flex flex-col items-center gap-4 text-center">
        {phase === 'pending' && (
          <>
            <div className="relative flex h-72 w-72 max-w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-brand-200 bg-white p-4 shadow-lg shadow-brand-500/10 ring-4 ring-brand-50">
              <span className="absolute left-4 top-4 rounded-full bg-[#17120f] px-2.5 py-1 text-[10px] font-black tracking-widest text-white">
                QRIS
              </span>
              {displayImage ? (
                <img src={displayImage} alt="QRIS" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Spinner />
                  <span className="text-[11px] font-semibold text-[#4f4540]/70">{copy.preparing}</span>
                </div>
              )}
            </div>

            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-black tabular-nums',
                lowTime
                  ? 'border-rose-300 bg-rose-100 text-rose-700'
                  : 'border-brand-300 bg-brand-100 text-brand-800',
              )}
            >
              <HiOutlineClock className="h-3.5 w-3.5" />
              {copy.expiresIn} {formatCountdown(remainingMs)}
            </div>

            <InfoCard tone="brand">
              <InfoRow label={copy.amount} value={amountText} accent="text-brand-700" />
              <InfoRow label={copy.plan} value={planLabel(planCode, isId)} />
              <InfoRow label={copy.order} value={checkout.order_id} mono />
            </InfoCard>

            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="!bg-white"
                leftIcon={<HiOutlineArrowDownTray className="h-4 w-4" />}
                onClick={handleDownload}
                disabled={!displayImage}
              >
                {copy.download}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!bg-white"
                leftIcon={<HiOutlineClipboard className="h-4 w-4" />}
                onClick={handleCopy}
                disabled={!checkout.qr_string}
              >
                {copy.copyCode}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              loading={checking}
              leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}
              onClick={() => void handleManualCheck()}
            >
              {copy.checkNow}
            </Button>

            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4f4540]/60">
              <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" /> {copy.secure}
            </p>
          </>
        )}

        {phase === 'paid' && (
          <div className="animate-panel-in flex w-full flex-col items-center gap-5 py-2">
            <div className="relative flex h-24 w-24 items-center justify-center">
              {CONFETTI.map((dot, i) => (
                <span
                  key={i}
                  className="confetti-dot"
                  style={{ '--tx': dot.tx, '--ty': dot.ty, background: dot.color, animationDelay: `${i * 25}ms` } as CSSProperties}
                  aria-hidden
                />
              ))}
              <span className="scan-pulse-motion absolute inset-0 rounded-full bg-emerald-400" aria-hidden />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_10px_26px_rgba(16,185,129,0.35),3px_3px_0_rgba(23,18,15,0.82)] ring-4 ring-[#fffaf6]">
                <HiOutlineCheckCircle className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-lg font-black text-[#17120f]">{copy.paid}</p>
              <p className="text-xs font-semibold text-[#4f4540]/80">{copy.paidDesc}</p>
            </div>

            {/* Same InfoCard/InfoRow structure as the pending QR screen, just
                switched to the emerald tone to match this phase's checkmark,
                with the confirmed plan/expiry filled in once we have them. */}
            <InfoCard tone="emerald">
              <InfoRow label={copy.amount} value={amountText} accent="text-emerald-700" />
              <InfoRow label={copy.plan} value={paidSubscription?.plan_name || planLabel(planCode, isId)} />
              {paidSubscription?.ends_at && (
                <InfoRow label={copy.activeUntil} value={formatDate(paidSubscription.ends_at, isId)} />
              )}
              <InfoRow label={copy.order} value={checkout.order_id} mono />
            </InfoCard>

            <div className="w-full space-y-2">
              <Button className="w-full" onClick={() => settle('active')}>
                {copy.done}
              </Button>
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] ease-linear"
                    style={{ width: barShrunk ? '0%' : '100%', transitionDuration: `${AUTO_DISMISS_MS}ms` }}
                  />
                </div>
                <p className="text-center text-[11px] font-semibold text-[#4f4540]/50">{copy.autoClosing(autoCloseIn)}</p>
              </div>
            </div>
          </div>
        )}

        {negative && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-full ring-1', negative.tone)}>
              <negative.Icon className="h-7 w-7" />
            </div>
            <p className="text-sm font-black text-[#17120f]">{negative.title}</p>
            <p className="max-w-xs text-xs leading-5 text-[#4f4540]">{negative.desc}</p>
            <Button variant="outline" className="!bg-white" onClick={handleClose}>
              {copy.close}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function msUntil(expiresAt?: string | null): number {
  if (!expiresAt) return 0
  const t = new Date(expiresAt).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, t - Date.now())
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDate(value: string, isId: boolean): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
