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
import { MobileFab } from '@/components/MobileFab'
import { useLocale } from '@/i18n'
import { splitBillApi, type SplitBill } from '../api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { confirm } from '@/lib/confirm'

export function SplitBillsListPage() {
  const { locale } = useLocale()
  const qc = useQueryClient()
  const copy = locale === 'id'
    ? {
        deleted: 'Split bill dihapus',
        title: 'Bagi Tagihan',
        subtitle: 'Bagi pengeluaran bersama teman dan share lewat WhatsApp.',
        create: 'Buat Baru',
        emptyTitle: 'Belum ada split bill',
        emptyDesc: 'Buat tagihan pertama untuk dibagi dengan teman.',
        deleteTitle: 'Hapus split bill?',
        deleteDesc: (title: string) => `"${title}" akan dihapus permanen.`,
        delete: 'Hapus',
      }
    : {
        deleted: 'Split bill deleted',
        title: 'Split Bills',
        subtitle: 'Split shared expenses with friends and share via WhatsApp.',
        create: 'Create New',
        emptyTitle: 'No split bills yet',
        emptyDesc: 'Create your first bill to split with friends.',
        deleteTitle: 'Delete split bill?',
        deleteDesc: (title: string) => `"${title}" will be permanently deleted.`,
        delete: 'Delete',
      }
  const q = useQuery({ queryKey: ['split-bills'], queryFn: splitBillApi.list })

  const remove = useMutation({
    mutationFn: splitBillApi.remove,
    onSuccess: () => {
      toast.success(copy.deleted)
      qc.invalidateQueries({ queryKey: ['split-bills'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const bills = q.data ?? []

  return (
    <div>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Link to="/app/split-bills/new" className="hidden sm:inline-flex">
            <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>{copy.create}</Button>
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
            title={copy.emptyTitle}
            description={copy.emptyDesc}
            action={
              <Link to="/app/split-bills/new">
                <Button leftIcon={<HiOutlinePlus className="h-4 w-4" />}>{copy.create}</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map((b) => (
            <SplitBillCard key={b.id} bill={b} copy={copy} onDelete={() => {
              confirm({
                title: copy.deleteTitle,
                description: copy.deleteDesc(b.title),
                tone: 'danger',
                confirmLabel: copy.delete,
              }).then((ok) => {
                if (ok) remove.mutate(b.id)
              })
            }} />
          ))}
        </div>
      )}
      <MobileFab
        label={copy.create}
        icon={<HiOutlinePlus className="h-6 w-6" />}
        href="/app/split-bills/new"
      />
    </div>
  )
}

function SplitBillCard({
  bill,
  onDelete,
  copy,
}: {
  bill: SplitBill
  onDelete: () => void
  copy: {
    delete: string
    edit?: string
  }
}) {
  const { locale } = useLocale()
  const cardCopy = locale === 'id'
    ? { participants: 'peserta', paid: 'lunas', totalBill: 'Total Tagihan', edit: 'Edit', delete: copy.delete }
    : { participants: 'participants', paid: 'paid', totalBill: 'Total Bill', edit: 'Edit', delete: copy.delete }
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
              {total} {cardCopy.participants} · {new Date(bill.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <Badge tone={pct === 100 ? 'green' : pct > 0 ? 'amber' : 'gray'}>
          {paidCount}/{total} {cardCopy.paid}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">{cardCopy.totalBill}</div>
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
          title={cardCopy.edit}
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
        </Link>
        <button
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-rose-600"
          title={cardCopy.delete}
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
