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
import { TransactionInfoRow } from '../components/TransactionInfoRow'

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
          'overflow-hidden border shadow-xl shadow-slate-200/40 backdrop-blur-2xl transition-all duration-300',
          isIncome
            ? 'border-emerald-200/70 bg-gradient-to-br from-emerald-500/12 via-white/62 to-white/38'
            : 'border-rose-200/70 bg-gradient-to-br from-rose-500/12 via-white/62 to-white/38',
        )}
      >
        <div className="px-6 py-7">
          <Badge tone={isIncome ? 'green' : 'red'} className="mb-3">
            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </Badge>
          <div
            className={cn(
              'text-4xl font-black tabular-nums sm:text-5xl',
              isIncome ? 'text-emerald-700' : 'text-rose-700',
            )}
          >
            {isIncome ? '+ ' : '- '}
            {formatCurrency(Number(tx.amount))}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            {categoryName} · {formatDate(tx.transaction_date)}
          </div>
        </div>
      </Card>

      {/* Info grid */}
      <Card className="border border-white/80 bg-white/55 shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <TransactionInfoRow Icon={HiOutlineHashtag} label="Kategori" value={categoryName} />
          <TransactionInfoRow Icon={HiOutlineWallet} label="Dompet" value={walletName} />
          <TransactionInfoRow Icon={HiOutlineCalendarDays} label="Tanggal" value={formatDate(tx.transaction_date)} />
          {tx.merchant_name ? (
            <TransactionInfoRow Icon={HiOutlineBuildingStorefront} label="Merchant" value={tx.merchant_name} />
          ) : null}
          {tx.description ? (
            <div className="sm:col-span-2">
              <TransactionInfoRow Icon={HiOutlineDocumentText} label="Deskripsi" value={tx.description} multiline />
            </div>
          ) : null}
        </div>
      </Card>

      {/* AI block */}
      {tx.source && tx.source !== 'manual' && tx.confidence_score != null ? (
        <Card className="border border-violet-200/70 bg-linear-to-br from-violet-500/10 via-white/55 to-white/30 shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <HiOutlineSparkles className="h-4 w-4 text-violet-600 animate-pulse" /> Tingkat Keyakinan AI
            </div>
            <span className="text-sm font-black tabular-nums text-violet-700">
              {Math.round(Number(tx.confidence_score) * 100)}%
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100/50">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
              style={{ width: `${Math.round(Number(tx.confidence_score) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Transaksi ini diekstrak otomatis. Periksa kembali jika perlu.
          </p>
        </Card>
      ) : null}
    </div>
  )
}
