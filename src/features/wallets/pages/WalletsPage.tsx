import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineArrowsRightLeft, HiOutlineClock, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2'
import { walletApi } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import { Button, Card, DataListPagination, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { MobileFab } from '@/components/MobileFab'
import { useLocale, useT } from '@/i18n'
import type { Wallet, WalletType } from '@/types/api'
import { formatCurrency } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import {
  WalletsSummaryCard,
  FilterTabs,
  WalletCard,
  WalletFormModal,
  WalletTransferModal,
  type WalletStat,
} from '@/features/wallets/components'
import { WALLET_TYPE_OPTIONS, normalizeWalletType } from '@/features/wallets/utils'


type FilterTab = 'all' | WalletType
const WALLETS_PER_PAGE = 6


export function WalletsPage() {
  const t = useT()
  const { locale } = useLocale()
  const qc = useQueryClient()
  const copy = locale === 'id'
    ? {
        all: 'Semua',
        deleted: 'Wallet dihapus',
        defaultUpdated: 'Dompet utama diperbarui',
        emptyByType: 'Belum ada dompet di kategori ini',
        deleteTitle: 'Hapus dompet?',
        deleteDesc: (name: string) => `Dompet "${name}" akan dihapus permanen.`,
        hint: 'Gunakan beberapa dompet untuk memisahkan kebutuhan pribadi, bisnis, tabungan, atau dompet bersama agar laporan keuangan lebih mudah dianalisis.',
        transfer: 'Pindahkan Saldo',
        historyTitle: 'Riwayat Transfer Saldo',
        historySubtitle: 'Aktivitas pemindahan saldo antar wallet terbaru.',
        emptyTransfer: 'Belum ada transfer saldo.',
        selectedTransfer: 'riwayat dipilih',
        deleteHistory: 'Hapus Riwayat',
        deleteHistoryTitle: (count: number) => `Hapus ${count} riwayat transfer?`,
        deleteHistoryDesc: 'Riwayat transfer akan dihapus dari daftar. Saldo wallet tidak berubah.',
        historyDeleted: 'Riwayat transfer dihapus',
        cancelSelect: 'Batal Pilih',
      }
    : {
        all: 'All',
        deleted: 'Wallet deleted',
        defaultUpdated: 'Default wallet updated',
        emptyByType: 'No wallets in this category yet',
        deleteTitle: 'Delete wallet?',
        deleteDesc: (name: string) => `Wallet "${name}" will be permanently deleted.`,
        hint: 'Use multiple wallets to separate personal needs, business, savings, or shared money so reports are easier to analyze.',
        transfer: 'Transfer Balance',
        historyTitle: 'Transfer History',
        historySubtitle: 'Recent balance movements between wallets.',
        emptyTransfer: 'No balance transfers yet.',
        selectedTransfer: 'history selected',
        deleteHistory: 'Delete History',
        deleteHistoryTitle: (count: number) => `Delete ${count} transfer history rows?`,
        deleteHistoryDesc: 'Transfer history will be removed from the list. Wallet balances will not change.',
        historyDeleted: 'Transfer history deleted',
        cancelSelect: 'Cancel Selection',
      }

  const walletsQ = useQuery({
    queryKey: ['wallets'],
    queryFn: walletApi.list,
  })

  const since = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const txnsQ = useQuery({
    queryKey: ['transactions', 'wallets-30d', since.toISOString()],
    queryFn: () => transactionApi.list({ from: since.toISOString(), limit: 500 }),
  })
  const transferHistoryQ = useQuery({
    queryKey: ['wallet-transfers'],
    queryFn: () => walletApi.transfers(20),
  })

  const [editing, setEditing] = useState<Wallet | null>(null)
  const [open, setOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [tab, setTab] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(WALLETS_PER_PAGE)
  const [transferPage, setTransferPage] = useState(1)
  const [selectedTransfers, setSelectedTransfers] = useState<Set<string>>(() => new Set())

  const remove = useMutation({
    mutationFn: walletApi.remove,
    onSuccess: () => {
      toast.success(copy.deleted)
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const setDefault = useMutation({
    mutationFn: (id: string) => walletApi.update(id, { is_default: true }),
    onSuccess: () => {
      toast.success(copy.defaultUpdated)
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const deleteTransfers = useMutation({
    mutationFn: (ids: string[]) => walletApi.deleteTransfers(ids),
    onSuccess: (_, ids) => {
      toast.success(copy.historyDeleted)
      setSelectedTransfers((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
      qc.invalidateQueries({ queryKey: ['wallet-transfers'] })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const wallets = useMemo(() => walletsQ.data ?? [], [walletsQ.data])

  const filteredWallets = useMemo(
    () => (tab === 'all' ? wallets : wallets.filter((wallet) => normalizeWalletType(wallet.type) === tab)),
    [wallets, tab],
  )
  const totalPages = Math.max(1, Math.ceil(filteredWallets.length / pageSize))
  const pagedWallets = useMemo(
    () => filteredWallets.slice((page - 1) * pageSize, page * pageSize),
    [filteredWallets, page, pageSize],
  )

  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + Number(wallet.balance ?? 0), 0),
    [wallets],
  )

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const walletCountByType = useMemo(
    () =>
      WALLET_TYPE_OPTIONS.reduce(
        (acc, option) => ({
          ...acc,
          [option.value]: wallets.filter((wallet) => normalizeWalletType(wallet.type) === option.value).length,
        }),
        {} as Record<WalletType, number>,
      ),
    [wallets],
  )

  const walletStats = useMemo(() => {
    const map = new Map<string, WalletStat>()

    for (const tx of txnsQ.data?.data ?? []) {
      const current = map.get(tx.wallet_id) ?? {
        income: 0,
        expense: 0,
        count: 0,
        lastAt: null,
      }

      if (tx.type === 'income') current.income += Number(tx.amount)
      else current.expense += Number(tx.amount)

      current.count += 1

      const timestamp = new Date(tx.transaction_date).getTime()
      if (!current.lastAt || timestamp > current.lastAt) {
        current.lastAt = timestamp
      }

      map.set(tx.wallet_id, current)
    }

    return map
  }, [txnsQ.data])

  const totalIncome30d = useMemo(
    () => Array.from(walletStats.values()).reduce((sum, stat) => sum + stat.income, 0),
    [walletStats],
  )

  const totalExpense30d = useMemo(
    () => Array.from(walletStats.values()).reduce((sum, stat) => sum + stat.expense, 0),
    [walletStats],
  )

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: copy.all, count: wallets.length },
    ...WALLET_TYPE_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      count: walletCountByType[option.value] ?? 0,
    })),
  ]
  const transferRows = transferHistoryQ.data ?? []
  const transferPageSize = 3
  const transferTotalPages = Math.max(1, Math.ceil(transferRows.length / transferPageSize))
  const visibleTransfers = transferRows.slice((transferPage - 1) * transferPageSize, transferPage * transferPageSize)
  const allVisibleTransferSelected = visibleTransfers.length > 0 && visibleTransfers.every((item) => selectedTransfers.has(item.id))

  useEffect(() => {
    if (transferPage > transferTotalPages) setTransferPage(transferTotalPages)
  }, [transferPage, transferTotalPages])

  const onDeleteTransferHistory = async () => {
    const ids = Array.from(selectedTransfers)
    if (ids.length === 0) return
    const ok = await confirm({
      title: copy.deleteHistoryTitle(ids.length),
      description: copy.deleteHistoryDesc,
      tone: 'danger',
      confirmLabel: copy.deleteHistory,
    })
    if (ok) deleteTransfers.mutate(ids)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.wallets.title}
        subtitle={t.wallets.subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<HiOutlineArrowsRightLeft className="h-4 w-4" />}
              onClick={() => setTransferOpen(true)}
              disabled={wallets.length < 2}
            >
              {copy.transfer}
            </Button>
            <div className="hidden sm:block">
              <Button
                leftIcon={<HiOutlinePlus className="h-4 w-4" />}
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                {t.wallets.newWallet}
              </Button>
            </div>
          </div>
        }
      />

      <WalletsSummaryCard
        wallets={wallets}
        totalBalance={totalBalance}
        totalIncome30d={totalIncome30d}
        totalExpense30d={totalExpense30d}
      />

      <Card className="bg-white/70">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-950">{copy.historyTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{copy.historySubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <HiOutlineClock className="h-5 w-5" />
            </div>
          </div>
        </div>
        {selectedTransfers.size > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <HiOutlineTrash className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-rose-950">
                  {selectedTransfers.size} {copy.selectedTransfer}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-rose-700">
                  {copy.deleteHistoryDesc}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => setSelectedTransfers(new Set())}
              >
                {copy.cancelSelect}
              </Button>
              <Button
                variant="danger"
                loading={deleteTransfers.isPending}
                onClick={onDeleteTransferHistory}
                leftIcon={<HiOutlineTrash className="h-4 w-4" />}
              >
                {copy.deleteHistory}
              </Button>
            </div>
          </div>
        ) : null}
        {transferHistoryQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : transferRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm font-medium text-slate-500">
            {copy.emptyTransfer}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="mb-1 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={allVisibleTransferSelected}
                onChange={() => {
                  setSelectedTransfers((prev) => {
                    const next = new Set(prev)
                    if (allVisibleTransferSelected) visibleTransfers.forEach((item) => next.delete(item.id))
                    else visibleTransfers.forEach((item) => next.add(item.id))
                    return next
                  })
                }}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {locale === 'id' ? 'Pilih halaman ini' : 'Select page'}
            </label>
            {visibleTransfers.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTransfers.has(item.id)}
                    onChange={() => {
                      setSelectedTransfers((prev) => {
                        const next = new Set(prev)
                        if (next.has(item.id)) next.delete(item.id)
                        else next.add(item.id)
                        return next
                      })
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="truncate">{item.from_wallet_name || '-'}</span>
                    <HiOutlineArrowsRightLeft className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{item.to_wallet_name || '-'}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {new Date(item.created_at).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {item.note ? ` · ${item.note}` : ''}
                  </p>
                  </div>
                </div>
                <div className="text-sm font-extrabold text-slate-950">
                  {formatCurrency(Number(item.amount || 0), item.currency)}
                </div>
              </div>
            ))}
            <DataListPagination
              page={transferPage}
              pageSize={transferPageSize}
              totalRows={transferRows.length}
              onPageChange={setTransferPage}
              onPageSizeChange={() => undefined}
              labels={{
                show: locale === 'id' ? 'Tampilkan' : 'Show',
                rows: locale === 'id' ? 'data' : 'rows',
                showing: locale === 'id' ? 'Menampilkan' : 'Showing',
                entries: locale === 'id' ? 'entri' : 'entries',
                previous: locale === 'id' ? 'Sebelumnya' : 'Previous',
                next: locale === 'id' ? 'Berikutnya' : 'Next',
                page: locale === 'id' ? 'Halaman' : 'Page',
              }}
            />
          </div>
        )}
      </Card>

      <FilterTabs
        tabs={tabs}
        active={tab}
        onChange={(next) => {
          setTab(next)
          setPage(1)
        }}
      />

      {walletsQ.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : filteredWallets.length === 0 ? (
        <Card>
          <EmptyState
            title={tab === 'all' ? t.common.empty : copy.emptyByType}
            description={t.wallets.subtitle}
            action={
              <Button
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                + {t.wallets.newWallet}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {pagedWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              stat={walletStats.get(wallet.id)}
              onEdit={() => {
                setEditing(wallet)
                setOpen(true)
              }}
              onSetDefault={() => setDefault.mutate(wallet.id)}
              onDelete={async () => {
                const ok = await confirm({
                  title: copy.deleteTitle,
                  description: copy.deleteDesc(wallet.name),
                  tone: 'danger',
                  confirmLabel: t.common.delete,
                })

                if (ok) remove.mutate(wallet.id)
              }}
              setDefaultLoading={setDefault.isPending}
            />
          ))}
        </div>
      )}

      <DataListPagination
        page={page}
        pageSize={pageSize}
        totalRows={filteredWallets.length}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
        labels={{
          show: locale === 'id' ? 'Tampilkan' : 'Show',
          rows: locale === 'id' ? 'data' : 'rows',
          showing: locale === 'id' ? 'Menampilkan' : 'Showing',
          entries: locale === 'id' ? 'entri' : 'entries',
          previous: locale === 'id' ? 'Sebelumnya' : 'Previous',
          next: locale === 'id' ? 'Berikutnya' : 'Next',
          page: locale === 'id' ? 'Halaman' : 'Page',
        }}
      />

      {wallets.length > 0 ? (
        <div className="rounded-2xl border border-white/80 bg-white/58 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm backdrop-blur-xl">
          {copy.hint}
        </div>
      ) : null}

      <WalletFormModal
        key={editing?.id ?? 'new'}
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
      />
      <WalletTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        wallets={wallets}
      />
      <MobileFab
        label={t.wallets.newWallet}
        icon={<HiOutlinePlus className="h-6 w-6" />}
        onClick={() => {
          setEditing(null)
          setOpen(true)
        }}
      />
    </div>
  )
}

export default WalletsPage
