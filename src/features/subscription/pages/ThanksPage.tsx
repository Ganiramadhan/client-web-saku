import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineReceiptPercent,
} from 'react-icons/hi2'
import { Card } from '@/components/ui'
import { subscriptionApi } from '../api'
import { formatCurrency } from '@/lib/utils'


export function ThanksPage() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const orderId = params.get('order_id') ?? params.get('order') ?? null

  useEffect(() => {
    document.title = 'Terima kasih • SAKU'
    qc.invalidateQueries({ queryKey: ['subscriptions'] })
  }, [qc])

  const activeQ = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.active,
  })
  const active = activeQ.data ?? null

  const endsAtLabel = useMemo(() => {
    if (!active?.ends_at) return null
    return new Date(active.ends_at).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [active])

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-0 shadow-sm">
        <div className="px-6 py-10 text-center sm:px-10">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <HiOutlineCheckCircle className="h-10 w-10" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Pembayaran berhasil
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Terima kasih sudah berlangganan SAKU. Akses premium sudah aktif —
            kamu bisa langsung pakai semua fitur Pro sekarang juga.
          </p>

          {active ? (
            <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <HiOutlineSparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Paket aktif
                  </p>
                  <p className="text-base font-semibold text-slate-950">
                    {active.plan_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatCurrency(active.amount, active.currency)} •{' '}
                    {endsAtLabel ? `berlaku hingga ${endsAtLabel}` : 'aktif'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {orderId ? (
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              <HiOutlineReceiptPercent className="h-4 w-4 text-slate-400" />
              <span className="font-mono">{orderId}</span>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Mulai pakai SAKU
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/subscription"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Lihat detail langganan
            </Link>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500">
        Bukti pembayaran sudah dikirim ke email-mu. Butuh bantuan?{' '}
        <a
          href="mailto:hello@saku.id"
          className="font-medium text-brand-700 hover:underline"
        >
          hello@saku.id
        </a>
      </p>
    </div>
  )
}

export default ThanksPage
