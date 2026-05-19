import { useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCalendarDays,
  HiOutlineWallet,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineBuildingStorefront,
  HiOutlineHashtag,
} from 'react-icons/hi2'
import { transactionApi } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import { Button, Card, Badge, Skeleton, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'

export function TransactionDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const txQ = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => transactionApi.get(id),
    enabled: Boolean(id),
  })
  const walletsQ = useQuery({ queryKey: ['wallets'], queryFn: () => walletApi.list() })
  const catsQ = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.list() })

  const walletMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const w of walletsQ.data ?? []) m.set(w.id, w.name)
    return m
  }, [walletsQ.data])
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of catsQ.data ?? []) m.set(c.id, c.name)
    return m
  }, [catsQ.data])

  const remove = useMutation({
    mutationFn: transactionApi.remove,
    onSuccess: () => {
      toast.success('Transaksi dihapus')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      navigate('/app/transactions')
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async () => {
    if (!txQ.data) return
    const ok = await confirm({
      title: 'Hapus transaksi?',
      description: 'Saldo dompet akan di-recalc setelah penghapusan.',
      tone: 'danger',
      confirmLabel: 'Hapus',
    })
    if (ok) remove.mutate(txQ.data.id)
  }

  if (txQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-44" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (txQ.isError || !txQ.data) {
    return (
      <Card>
        <EmptyState
          title="Transaksi tidak ditemukan"
          description="Mungkin sudah dihapus atau tautan tidak valid."
          action={
            <Button onClick={() => navigate('/app/transactions')}>
              <HiOutlineArrowLeft className="mr-1 h-4 w-4" /> Kembali
            </Button>
          }
        />
      </Card>
    )
  }

  const tx = txQ.data
  const isIncome = tx.type === 'income'
  const categoryName = categoryMap.get(tx.category_id) ?? '—'
  const walletName = walletMap.get(tx.wallet_id) ?? '—'

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app/transactions"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <HiOutlineArrowLeft className="h-4 w-4" /> Kembali ke daftar
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/app/transactions?edit=${tx.id}`)}
            leftIcon={<HiOutlinePencilSquare className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            loading={remove.isPending}
            leftIcon={<HiOutlineTrash className="h-4 w-4" />}
          >
            Hapus
          </Button>
        </div>
      </div>

      {/* Hero card */}
      <Card
        className={cn(
          'overflow-hidden border-0 p-0 shadow-md ring-1',
          isIncome
            ? 'bg-linear-to-br from-emerald-50 via-white to-white ring-emerald-100'
            : 'bg-linear-to-br from-rose-50 via-white to-white ring-rose-100',
        )}
      >
        <div className="px-6 py-7">
          <Badge tone={isIncome ? 'green' : 'red'} className="mb-3">
            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </Badge>
          <div
            className={cn(
              'text-4xl font-bold tabular-nums sm:text-5xl',
              isIncome ? 'text-emerald-700' : 'text-rose-700',
            )}
          >
            {isIncome ? '+ ' : '- '}
            {formatCurrency(Number(tx.amount))}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {categoryName} · {formatDate(tx.transaction_date)}
          </div>
        </div>
      </Card>

      {/* Info grid */}
      <Card>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <InfoRow Icon={HiOutlineHashtag} label="Kategori" value={categoryName} />
          <InfoRow Icon={HiOutlineWallet} label="Dompet" value={walletName} />
          <InfoRow Icon={HiOutlineCalendarDays} label="Tanggal" value={formatDate(tx.transaction_date)} />
          {tx.merchant_name ? (
            <InfoRow Icon={HiOutlineBuildingStorefront} label="Merchant" value={tx.merchant_name} />
          ) : null}
          {tx.description ? (
            <div className="sm:col-span-2">
              <InfoRow Icon={HiOutlineDocumentText} label="Deskripsi" value={tx.description} multiline />
            </div>
          ) : null}
        </div>
      </Card>

      {/* AI block */}
      {tx.source && tx.source !== 'manual' && tx.confidence_score != null ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <HiOutlineSparkles className="h-4 w-4 text-violet-600" /> Tingkat Keyakinan AI
            </div>
            <span className="text-sm font-bold tabular-nums text-slate-900">
              {Math.round(Number(tx.confidence_score) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
              style={{ width: `${Math.round(Number(tx.confidence_score) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Transaksi ini diekstrak otomatis. Periksa kembali jika perlu.
          </p>
        </Card>
      ) : null}
    </div>
  )
}

function InfoRow({
  Icon,
  label,
  value,
  multiline,
}: {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        <div className={cn('text-sm text-slate-900', multiline ? 'whitespace-pre-wrap' : 'truncate font-medium')}>
          {value}
        </div>
      </div>
    </div>
  )
}
