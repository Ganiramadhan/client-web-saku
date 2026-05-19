import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineCheck,
  HiOutlineShare,
} from 'react-icons/hi2'
import { FaWhatsapp } from 'react-icons/fa'
import { Badge, Button, Card, PageHeader, Spinner } from '@/components/ui'
import { splitBillApi } from '../api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'

export function SplitBillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['split-bill', id],
    queryFn: () => splitBillApi.get(id!),
    enabled: Boolean(id),
  })

  const togglePaid = useMutation({
    mutationFn: ({ pid, paid }: { pid: string; paid: boolean }) =>
      splitBillApi.markPaid(id!, pid, paid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['split-bill', id] })
      qc.invalidateQueries({ queryKey: ['split-bills'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const share = useMutation({
    mutationFn: (phone?: string) => splitBillApi.share(id!, phone),
    onSuccess: (res) => {
      window.open(res.whatsapp_url, '_blank', 'noopener,noreferrer')
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const copyText = async () => {
    try {
      const res = await splitBillApi.share(id!)
      await navigator.clipboard.writeText(res.text)
      toast.success('Teks disalin ke clipboard')
    } catch (e) {
      toast.error(toErrorMessage(e))
    }
  }

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (!q.data) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Split bill tidak ditemukan.</p>
      </Card>
    )
  }
  const bill = q.data
  const paidCount = bill.participants.filter((p) => p.paid_at).length
  const total = bill.participants.length
  const pct = total > 0 ? Math.round((paidCount / total) * 100) : 0
  const paidAmount = bill.participants.reduce(
    (s, p) => s + (p.paid_at ? Number(p.amount) : 0),
    0,
  )

  return (
    <div>
      <PageHeader
        title={bill.title}
        subtitle={`${total} peserta · ${new Date(bill.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/split-bills">
              <Button variant="secondary" leftIcon={<HiOutlineArrowLeft className="h-4 w-4" />}>
                Kembali
              </Button>
            </Link>
            <Link to={`/app/split-bills/${bill.id}/edit`}>
              <Button variant="secondary" leftIcon={<HiOutlinePencilSquare className="h-4 w-4" />}>
                Edit
              </Button>
            </Link>
            <Button
              leftIcon={<FaWhatsapp className="h-4 w-4" />}
              onClick={() => share.mutate(undefined)}
              loading={share.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Share Semua
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Total Tagihan</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(bill.total_amount, bill.currency)}
          </div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Terkumpul</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">
            {formatCurrency(paidAmount, bill.currency)}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Status</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {paidCount}/{total}
          </div>
          <Badge tone={pct === 100 ? 'green' : pct > 0 ? 'amber' : 'gray'}>
            {pct === 100 ? 'Lunas semua' : pct > 0 ? 'Sebagian lunas' : 'Belum ada yang bayar'}
          </Badge>
        </Card>
      </div>

      {/* Notes */}
      {bill.notes ? (
        <Card className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Catatan</div>
          <p className="mt-1 text-sm text-slate-700">{bill.notes}</p>
        </Card>
      ) : null}

      {/* Participants */}
      <Card className="mt-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HiOutlineUserGroup className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900">Peserta</h3>
          </div>
          <button
            onClick={copyText}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-700"
          >
            <HiOutlineShare className="h-4 w-4" /> Salin teks
          </button>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {bill.participants.map((p) => {
            const isPaid = Boolean(p.paid_at)
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div
                  className={
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ' +
                    (isPaid
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600')
                  }
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    {isPaid ? (
                      <Badge tone="green">
                        <HiOutlineCheck className="mr-0.5 h-3 w-3" /> Lunas
                      </Badge>
                    ) : null}
                  </div>
                  {p.phone ? (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <HiOutlinePhone className="h-3 w-3" /> {p.phone}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums text-slate-900">
                    {formatCurrency(p.amount, bill.currency)}
                  </div>
                  {isPaid && p.paid_at ? (
                    <div className="text-[10px] text-slate-500">
                      {new Date(p.paid_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePaid.mutate({ pid: p.id, paid: !isPaid })}
                    disabled={togglePaid.isPending}
                    className={
                      'inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition ' +
                      (isPaid
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700')
                    }
                  >
                    {isPaid ? 'Batalkan' : 'Tandai Lunas'}
                  </button>
                  {p.phone ? (
                    <button
                      onClick={() => share.mutate(p.phone)}
                      disabled={share.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 transition hover:bg-emerald-50"
                      title="Kirim via WhatsApp"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

export default SplitBillDetailPage
