import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineArrowsRightLeft, HiOutlinePlus } from 'react-icons/hi2'
import { walletApi } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import { Button, Card, DataListPagination, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { MobileFab } from '@/components/MobileFab'
import { useLocale, useT } from '@/i18n'
import type { Wallet, WalletType } from '@/types/api'
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

  const [editing, setEditing] = useState<Wallet | null>(null)
  const [open, setOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [tab, setTab] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(WALLETS_PER_PAGE)

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
        }
      />

      <WalletsSummaryCard
        wallets={wallets}
        totalBalance={totalBalance}
        totalIncome30d={totalIncome30d}
        totalExpense30d={totalExpense30d}
      />

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
