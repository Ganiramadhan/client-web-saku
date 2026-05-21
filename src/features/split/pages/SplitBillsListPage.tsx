import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
} from 'react-icons/hi2'
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { splitBillApi, type SplitBill } from '../api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { confirm } from '@/lib/confirm'

export function SplitBillsListPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['split-bills'], queryFn: splitBillApi.list })

  const remove = useMutation({
    mutationFn: splitBillApi.remove,
    onSuccess: () => {
      toast.success('Split bill dihapus')
      qc.invalidateQueries({ queryKey: ['split-bills'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const bills = q.data ?? []

  return (
    <div>
      <PageHeader
        title="Bagi Tagihan"
        subtitle="Bagi pengeluaran bersama teman dan share lewat WhatsApp."
        action={
          <Link to="/app/split-bills/new">
            <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>Buat Baru</Button>
          </Link>
        }
      />

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada split bill"
            description="Buat tagihan pertama untuk dibagi dengan teman."
            action={
              <Link to="/app/split-bills/new">
                <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>Buat Baru</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map((b) => (
            <SplitBillCard key={b.id} bill={b} onDelete={() => {
              confirm({
                title: 'Hapus split bill?',
                description: `"${b.title}" akan dihapus permanen.`,
                tone: 'danger',
                confirmLabel: 'Hapus',
              }).then((ok) => {
                if (ok) remove.mutate(b.id)
              })
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function SplitBillCard({ bill, onDelete }: { bill: SplitBill; onDelete: () => void }) {
  const paidCount = bill.participants.filter((p) => p.paid_at).length
  const total = bill.participants.length
  const pct = total > 0 ? Math.round((paidCount / total) * 100) : 0
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/64 p-5 shadow-md shadow-slate-200/25 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/78 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-brand-700 shadow-sm">
            <HiOutlineUserGroup className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <Link
              to={`/app/split-bills/${bill.id}`}
              className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700"
            >
              {bill.title}
            </Link>
            <div className="text-xs text-slate-500">
              {total} peserta · {new Date(bill.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <Badge tone={pct === 100 ? 'green' : pct > 0 ? 'amber' : 'gray'}>
          {paidCount}/{total} lunas
        </Badge>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Total Tagihan</div>
        <div className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
          {formatCurrency(bill.total_amount, bill.currency)}
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-white/80">
          <div
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1 border-t border-white/80 pt-3">
        <Link
          to={`/app/split-bills/${bill.id}/edit`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-brand-700"
          title="Edit"
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
        </Link>
        <button
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-rose-600"
          title="Hapus"
        >
          <HiOutlineTrash className="h-4 w-4" />
        </button>
      </div>

      {pct === 100 ? (
        <div className="absolute right-3 top-3 text-emerald-500">
          <HiOutlineCheckCircle className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  )
}

export default SplitBillsListPage
