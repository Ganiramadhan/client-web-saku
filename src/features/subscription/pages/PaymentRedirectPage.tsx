import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineHome,
  HiOutlineReceiptPercent,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
} from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { subscriptionApi } from '@/features/subscription/api'
import { useLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import { analyticsEvents, trackEvent } from '@/lib/analytics'

export function PaymentRedirectPage({ mode }: { mode: 'finish' | 'error' }) {
  const { locale } = useLocale()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const orderId = params.get('order_id') ?? ''
  const status = (params.get('transaction_status') ?? params.get('status') ?? '').toLowerCase()
  const expired = status === 'expire' || status === 'expired'
  const cancelled = status === 'cancel' || status === 'cancelled'
  const failed = mode === 'error' && !expired && !cancelled
  const success = mode === 'finish' && !expired && !failed && !cancelled
  const copy = locale === 'id'
    ? {
        successTitle: 'Pembayaran berhasil diterima',
        successDesc: 'Kami sedang memastikan aktivasi paketmu. Jika pembayaran sudah settlement, akses SAKU Pro akan langsung aktif.',
        expiredTitle: 'Waktu pembayaran habis',
        expiredDesc: 'Invoice ini sudah melewati batas waktu pembayaran. Paket pilihanmu tetap tersimpan, jadi kamu cukup membuat invoice baru dari Profile.',
        failedTitle: 'Pembayaran belum berhasil',
        failedDesc: 'Transaksi tidak berhasil diproses oleh payment gateway. Tenang, tidak ada paket yang diaktifkan dan kamu bisa mencoba lagi.',
        cancelledTitle: 'Pembayaran dibatalkan',
        cancelledDesc: 'Checkout ditutup sebelum pembayaran selesai. Kamu bisa melanjutkan dari Profile atau membuat invoice baru saat siap.',
        newInvoice: 'Buat Invoice Baru',
        retry: 'Coba Lagi',
        viewDetail: 'Lihat Detail Aktivasi',
        dashboard: 'Kembali ke Dashboard',
        profile: 'Buka Profile',
        order: 'Order ID',
        secure: 'Diproses aman oleh payment gateway production',
        next: 'Langkah selanjutnya',
      }
    : {
        successTitle: 'Payment received successfully',
        successDesc: 'We are confirming your plan activation. If the payment is settled, SAKU Pro access will activate right away.',
        expiredTitle: 'Payment time has run out',
        expiredDesc: 'This invoice has passed its payment window. Your selected plan is still saved, so you can create a new invoice from Profile.',
        failedTitle: 'Payment was not completed',
        failedDesc: 'The transaction was not processed by the payment gateway. No plan has been activated, and you can try again safely.',
        cancelledTitle: 'Payment was cancelled',
        cancelledDesc: 'Checkout was closed before payment was completed. You can continue from Profile or create a new invoice when ready.',
        newInvoice: 'Create New Invoice',
        retry: 'Try Again',
        viewDetail: 'View Activation Detail',
        dashboard: 'Back to Dashboard',
        profile: 'Open Profile',
        order: 'Order ID',
        secure: 'Securely processed by a production payment gateway',
        next: 'Next step',
      }

  const confirm = useMutation({
    mutationFn: () => subscriptionApi.confirm(orderId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
      qc.invalidateQueries({ queryKey: ['subscription', 'active'] })
    },
  })

  useEffect(() => {
    if (success) trackEvent(analyticsEvents.paymentSuccess, { order_id: orderId })
    if (failed || expired || cancelled) trackEvent(analyticsEvents.paymentFailed, { order_id: orderId, payment_status: status || mode })
    if (token && orderId && success) confirm.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, orderId, success])

  const Icon = expired ? HiOutlineClock : cancelled ? HiOutlineXCircle : failed ? HiOutlineExclamationTriangle : HiOutlineReceiptPercent
  const title = expired ? copy.expiredTitle : cancelled ? copy.cancelledTitle : failed ? copy.failedTitle : copy.successTitle
  const desc = expired ? copy.expiredDesc : cancelled ? copy.cancelledDesc : failed ? copy.failedDesc : copy.successDesc
  const destination = token ? '/app/profile' : '/login'
  const dashboard = token ? '/app' : '/'
  const tone = expired
    ? {
        shell: 'from-amber-50 via-white to-blue-50',
        icon: 'text-amber-700 bg-amber-50 border-amber-100',
        badge: 'text-amber-700 bg-amber-50 border-amber-100',
      }
    : failed || cancelled
      ? {
          shell: 'from-rose-50 via-white to-blue-50',
          icon: 'text-rose-700 bg-rose-50 border-rose-100',
          badge: 'text-rose-700 bg-rose-50 border-rose-100',
        }
      : {
          shell: 'from-emerald-50 via-white to-blue-50',
          icon: 'text-emerald-700 bg-emerald-50 border-emerald-100',
          badge: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        }

  const orderText = useMemo(() => orderId ? orderId : '', [orderId])
  const primaryLabel = expired ? copy.newInvoice : failed ? copy.retry : cancelled ? copy.profile : copy.viewDetail
  const primaryAction = () => {
    if (success) {
      navigate('/app/subscription/thanks' + (orderId ? `?order_id=${encodeURIComponent(orderId)}` : ''))
      return
    }
    navigate(destination)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tone.shell} px-4 py-6 sm:py-10`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl lg:grid-cols-[1fr_0.82fr]">
          <div className="p-6 sm:p-9 lg:p-10">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${tone.badge}`}>
              <HiOutlineShieldCheck className="h-4 w-4" />
              {copy.secure}
            </div>
            <div className={`mt-7 flex h-16 w-16 items-center justify-center rounded-3xl border ${tone.icon}`}>
            <Icon className="h-7 w-7" />
            </div>
            <h1 className="mt-6 max-w-xl text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{desc}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{copy.next}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {success
                    ? locale === 'id' ? 'Buka detail aktivasi untuk memastikan paket sudah aktif.' : 'Open activation detail to confirm your plan is active.'
                    : expired
                      ? locale === 'id' ? 'Buat invoice baru dari paket yang sudah kamu pilih.' : 'Create a new invoice for your selected plan.'
                      : locale === 'id' ? 'Coba lagi dari Profile saat kamu sudah siap.' : 'Try again from Profile when you are ready.'}
                </p>
              </div>
              {orderText ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{copy.order}</p>
                  <p className="mt-2 break-all font-mono text-xs font-semibold leading-5 text-slate-700">{orderText}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Button onClick={primaryAction} rightIcon={success ? <HiOutlineArrowRight className="h-4 w-4" /> : <HiOutlineArrowPath className="h-4 w-4" />}>
                {primaryLabel}
              </Button>
              <Button variant="outline" leftIcon={<HiOutlineHome className="h-4 w-4" />} onClick={() => navigate(dashboard)}>
                {copy.dashboard}
              </Button>
            </div>
          </div>

          <aside className="border-t border-white/70 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">SAKU Checkout</p>
              <h2 className="mt-3 text-xl font-extrabold">
                {locale === 'id' ? 'Checkout jelas, akses tetap terkontrol.' : 'Clear checkout, controlled access.'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {locale === 'id'
                  ? 'Setiap perubahan status pembayaran disinkronkan ke paket langganan agar akses fitur tetap konsisten.'
                  : 'Every payment status change is synced to your subscription so feature access stays consistent.'}
              </p>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                locale === 'id' ? 'Status pembayaran diverifikasi otomatis' : 'Payment status is verified automatically',
                locale === 'id' ? 'Paket pending bisa dilanjutkan dari Profile' : 'Pending plans can be continued from Profile',
                locale === 'id' ? 'Invoice kedaluwarsa bukan kegagalan pembayaran' : 'Expired invoices are not payment failures',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <HiOutlineShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                  <span className="leading-6 text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

export default PaymentRedirectPage
