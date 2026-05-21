import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineWallet,
} from 'react-icons/hi2'
import { walletApi, type WalletPayload } from '@/features/wallets/api'
import { transactionApi } from '@/features/transactions/api'
import {
  Button,
  Card,
  CurrencyInput,
  DateInput,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  RSelect,
  Skeleton,
  type SelectOption,
} from '@/components/ui'
import { useT } from '@/i18n'
import { formatCurrency, cn } from '@/lib/utils'
import type { Wallet, WalletType } from '@/types/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'

type FilterTab = 'all' | WalletType

type WalletStat = {
  income: number
  expense: number
  count: number
  lastAt: number | null
}

function initialWalletForm(editing: Wallet | null): WalletPayload {
  return {
    name: editing?.name ?? '',
    type: editing?.type ?? 'personal',
    currency: editing?.currency ?? 'IDR',
    balance: editing ? Number(editing.balance) : 0,
    is_default: editing?.is_default ?? false,
    target_name: editing?.target_name ?? null,
    target_amount: editing?.target_amount ?? null,
    target_deadline: editing?.target_deadline ?? null,
  }
}

const TYPE_THEME: Record<
  WalletType,
  {
    Icon: ComponentType<{ className?: string }>
    iconBg: string
    iconText: string
    dot: string
    border: string
  }
> = {
  personal: {
    Icon: HiOutlineWallet,
    iconBg: 'bg-brand-50',
    iconText: 'text-brand-700',
    dot: 'bg-brand-500',
    border: 'border-brand-100',
  },
  business: {
    Icon: HiOutlineBuildingOffice2,
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-700',
    dot: 'bg-violet-500',
    border: 'border-violet-100',
  },
  shared: {
    Icon: HiOutlineUserGroup,
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-700',
    dot: 'bg-sky-500',
    border: 'border-sky-100',
  },
}

export function WalletsPage() {
  const t = useT()
  const qc = useQueryClient()

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
    queryFn: () => transactionApi.list({ from: since.toISOString(), limit: 5000 }),
  })

  const [editing, setEditing] = useState<Wallet | null>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FilterTab>('all')

  const remove = useMutation({
    mutationFn: walletApi.remove,
    onSuccess: () => {
      toast.success('Wallet deleted')
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const setDefault = useMutation({
    mutationFn: (id: string) => walletApi.update(id, { is_default: true }),
    onSuccess: () => {
      toast.success('Dompet utama diperbarui')
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const wallets = useMemo(() => walletsQ.data ?? [], [walletsQ.data])

  const filteredWallets = useMemo(
    () => (tab === 'all' ? wallets : wallets.filter((wallet) => wallet.type === tab)),
    [wallets, tab],
  )

  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + Number(wallet.balance ?? 0), 0),
    [wallets],
  )

  const walletCountByType = useMemo(
    () => ({
      personal: wallets.filter((wallet) => wallet.type === 'personal').length,
      business: wallets.filter((wallet) => wallet.type === 'business').length,
      shared: wallets.filter((wallet) => wallet.type === 'shared').length,
    }),
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
    { key: 'all', label: 'Semua', count: wallets.length },
    { key: 'personal', label: t.wallets.typePersonal, count: walletCountByType.personal },
    { key: 'business', label: t.wallets.typeBusiness, count: walletCountByType.business },
    { key: 'shared', label: t.wallets.typeShared, count: walletCountByType.shared },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.wallets.title}
        subtitle={t.wallets.subtitle}
        action={
          <Button
            leftIcon={<HiOutlinePlus className="h-4 w-4" />}
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            {t.wallets.newWallet}
          </Button>
        }
      />

      <WalletsSummary
        wallets={wallets}
        totalBalance={totalBalance}
        totalIncome30d={totalIncome30d}
        totalExpense30d={totalExpense30d}
        byType={walletCountByType}
        walletStats={walletStats}
      />

      <FilterTabs tabs={tabs} active={tab} onChange={setTab} />

      {walletsQ.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : filteredWallets.length === 0 ? (
        <Card>
          <EmptyState
            title={tab === 'all' ? t.common.empty : 'Belum ada dompet di kategori ini'}
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
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredWallets.map((wallet) => (
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
                  title: 'Hapus dompet?',
                  description: `Dompet "${wallet.name}" akan dihapus permanen.`,
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

      {wallets.length > 0 ? (
        <div className="rounded-2xl border border-white/80 bg-white/58 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm backdrop-blur-xl">
          Gunakan beberapa dompet untuk memisahkan kebutuhan pribadi, bisnis, tabungan,
          atau dompet bersama agar laporan keuangan lebih mudah dianalisis.
        </div>
      ) : null}

      <WalletFormModal
        key={editing?.id ?? 'new'}
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
      />
    </div>
  )
}

function WalletsSummary({
  wallets,
  totalBalance,
  totalIncome30d,
  totalExpense30d,
}: {
  wallets: Wallet[]
  totalBalance: number
  totalIncome30d: number
  totalExpense30d: number
  byType: { personal: number; business: number; shared: number }
  walletStats: Map<string, WalletStat>
}) {
  const net30d = totalIncome30d - totalExpense30d
  const savingRate =
    totalIncome30d > 0 ? Math.max(0, Math.min(100, Math.round((net30d / totalIncome30d) * 100))) : 0



  return (
   <section className="rounded-xl border border-white/80 bg-white/72 p-5 shadow-sm backdrop-blur-2xl">
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr] lg:items-end">
      <div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <HiOutlineBanknotes className="h-4 w-4 text-slate-700" />
          Total Saldo
        </div>

        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {formatCurrency(totalBalance)}
        </p>

        <p className="mt-3 text-sm text-slate-500">
          Total saldo dari {wallets.length} dompet aktif.
        </p>

        <div
          className={[
            'mt-4 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold',
            net30d >= 0
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700',
          ].join(' ')}
        >
          Net 30 hari: {net30d >= 0 ? '+' : ''}
          {formatCurrency(net30d)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryMetric
          label="Pemasukan 30d"
          value={formatCurrency(totalIncome30d)}
          tone="emerald"
        />

        <SummaryMetric
          label="Pengeluaran 30d"
          value={formatCurrency(totalExpense30d)}
          tone="rose"
        />

        <SummaryMetric
          label="Saving Rate"
          value={`${savingRate}%`}
          tone="slate"
        />
      </div>
    </div>
  </section>
  )
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'rose' | 'slate'
}) {
  const valueClass =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'rose'
      ? 'text-rose-600'
      : 'text-slate-950'

  return (
    <div className="rounded-xl border border-slate-200 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-2 truncate text-lg font-bold tabular-nums', valueClass)}>
        {value}
      </p>
    </div>
  )
}



function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: FilterTab; label: string; count: number }[]
  active: FilterTab
  onChange: (value: FilterTab) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isAll = tab.key === 'all'
        const dot = !isAll ? TYPE_THEME[tab.key as WalletType].dot : ''

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              active === tab.key
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200/50'
                : 'border-white/80 bg-white/62 text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white hover:text-slate-950',
            )}
          >
            {isAll ? (
              <HiOutlineSquares2X2 className="h-3.5 w-3.5" />
            ) : (
              <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
            )}

            {tab.label}

            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                active === tab.key ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600',
              )}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function WalletCard({
  wallet,
  stat,
  onEdit,
  onDelete,
  onSetDefault,
  setDefaultLoading,
}: {
  wallet: Wallet
  stat?: WalletStat
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  setDefaultLoading?: boolean
}) {
  const theme = TYPE_THEME[wallet.type]
  const Icon = theme.Icon
  const income = stat?.income ?? 0
  const expense = stat?.expense ?? 0
  const count = stat?.count ?? 0
  const net = income - expense
  const lastActivity = formatRelativeFromMs(stat?.lastAt ?? null)
  const targetProgress = getTargetProgress(wallet)

  return (
    <article className="overflow-hidden rounded-xl border border-white/80 bg-white/72 shadow-sm backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-brand-100 hover:bg-white hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm', theme.iconText)}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-base font-bold text-slate-950">{wallet.name}</h3>
                {wallet.is_default ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                    <HiOutlineStar className="h-3 w-3" />
                    Default
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                {labelForType(wallet.type)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {!wallet.is_default ? (
              <button
                type="button"
                onClick={onSetDefault}
                disabled={setDefaultLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
                title="Jadikan dompet utama"
              >
                <HiOutlineStar className="h-4 w-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
              title="Edit"
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              title="Hapus"
            >
              <HiOutlineTrash className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-slate-500">Saldo</p>
          <p className="mt-1 truncate text-3xl font-bold tabular-nums text-slate-950">
            {formatCurrency(Number(wallet.balance ?? 0), wallet.currency)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <MiniStat label="Masuk 30d" value={formatCurrency(income, wallet.currency)} tone="emerald" />
          <MiniStat label="Keluar 30d" value={formatCurrency(expense, wallet.currency)} tone="rose" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className={cn('font-semibold tabular-nums', net >= 0 ? 'text-emerald-700' : 'text-rose-600')}>
            {net >= 0 ? '+' : ''}
            {formatCurrency(net, wallet.currency)} net
          </span>
          <span className="inline-flex items-center gap-1">
            <HiOutlineClock className="h-3.5 w-3.5" />
            {count} tx 30d · {lastActivity}
          </span>
        </div>
      </div>

      {targetProgress !== null ? (
        <div className="border-t border-emerald-50 bg-linear-to-b from-emerald-50/45 to-white/60 px-5 pb-4 pt-1">
          <TargetProgress wallet={wallet} progress={targetProgress} />
        </div>
      ) : null}
    </article>
  )
}

function TargetProgress({
  wallet,
  progress,
}: {
  wallet: Wallet
  progress: number
}) {
  const targetAmount = Number(wallet.target_amount ?? 0)
  const hasTargetAmount = targetAmount > 0

  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-white/86 p-4 shadow-sm shadow-emerald-100/30">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-semibold text-slate-800">
          {wallet.target_name || 'Kantong Tujuan'}
        </p>

        <p className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold tabular-nums text-emerald-700">
          {progress}%
        </p>
      </div>

      {hasTargetAmount ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              {formatCurrency(Number(wallet.balance ?? 0), wallet.currency)} /{' '}
              {formatCurrency(targetAmount, wallet.currency)}
            </span>

            {wallet.target_deadline ? (
              <span>
                s/d{' '}
                {new Date(wallet.target_deadline).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Target nominal belum ditetapkan.
        </p>
      )}
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'rose'
}) {
  const valueClass = tone === 'emerald' ? 'text-emerald-700' : 'text-rose-600'

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 truncate text-xs font-bold tabular-nums', valueClass)}>
        {value}
      </p>
    </div>
  )
}

function WalletFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Wallet | null
}) {
  const t = useT()
  const qc = useQueryClient()

  const [form, setForm] = useState<WalletPayload>(() => initialWalletForm(editing))

  const [isPocket, setIsPocket] = useState<boolean>(
    Boolean(editing?.target_amount && editing.target_amount > 0),
  )
  const [targetOpen, setTargetOpen] = useState(false)
  const currentBalance = Number(form.balance ?? 0)
  const targetAmount = Number(form.target_amount ?? 0)
  const targetError =
    isPocket && targetAmount > 0 && targetAmount < currentBalance
      ? `Target tidak boleh lebih kecil dari saldo sekarang (${formatCurrency(currentBalance)}).`
      : ''

  useEffect(() => {
    if (!open) return
    setForm(initialWalletForm(editing))
    setIsPocket(Boolean(editing?.target_amount && editing.target_amount > 0))
    setTargetOpen(false)
  }, [editing, open])

  const save = useMutation({
    mutationFn: () => {
      if (targetError) throw new Error(targetError)
      const payload: WalletPayload = {
        ...form,
        target_name: isPocket ? form.target_name || null : null,
        target_amount: isPocket ? form.target_amount || null : null,
        target_deadline: isPocket ? form.target_deadline || null : null,
      }

      return editing ? walletApi.update(editing.id, payload) : walletApi.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Wallet updated' : 'Wallet created')
      qc.invalidateQueries({ queryKey: ['wallets'] })
      setForm(initialWalletForm(null))
      setIsPocket(false)
      setTargetOpen(false)
      onClose()
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? `${t.common.edit} — ${editing.name}` : t.wallets.newWallet}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()} disabled={!!targetError}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.common.name}
            placeholder="Contoh: Dompet Utama, Bank BCA, GoPay"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />

        <RSelect
          label={t.wallets.type}
          value={form.type}
          options={[
            { value: 'personal', label: t.wallets.typePersonal },
            { value: 'business', label: t.wallets.typeBusiness },
            { value: 'shared', label: t.wallets.typeShared },
          ] as SelectOption[]}
          onChange={(value) => setForm({ ...form, type: (value ?? 'personal') as WalletType })}
        />

        <CurrencyInput
          label={`${t.wallets.balance} (IDR)`}
          value={Number(form.balance) || 0}
          onChange={(value) => setForm({ ...form, balance: value })}
          placeholder="0"
        />

        <FormCheckbox
          checked={form.is_default ?? false}
          title={t.wallets.isDefault}
          description="Dompet ini akan dipakai otomatis saat menambahkan transaksi baru."
          onChange={(checked) => setForm({ ...form, is_default: checked })}
        />

        <FormCheckbox
          checked={isPocket}
          title="Jadikan Kantong Tujuan"
          description="Aktifkan target tabungan dan atur detailnya lewat popup."
          onChange={(checked) => {
            setIsPocket(checked)
            if (checked) setTargetOpen(true)
          }}
        />

        {isPocket ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  {form.target_name || 'Kantong tujuan aktif'}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Target {formatCurrency(Number(form.target_amount ?? 0)) || 'Rp 0'}
                </p>
                {targetError ? (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{targetError}</p>
                ) : null}
              </div>
              <Button variant="outline" size="sm" onClick={() => setTargetOpen(true)}>
                Atur Target
              </Button>
            </div>
          </div>
        ) : null}
        </div>
      </Modal>

      <Modal
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        title="Atur Kantong Tujuan"
        footer={
          <>
            <Button variant="outline" onClick={() => setTargetOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => setTargetOpen(false)} disabled={!!targetError}>
              Simpan Target
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama Tujuan"
            placeholder="Contoh: Liburan Bali, DP Rumah"
            value={form.target_name ?? ''}
            onChange={(event) => setForm({ ...form, target_name: event.target.value })}
          />

          <CurrencyInput
            label="Target Nominal (IDR)"
            value={Number(form.target_amount) || 0}
            onChange={(value) => setForm({ ...form, target_amount: value })}
            placeholder="0"
            error={targetError}
          />

          <DateInput
            label="Target Tanggal (opsional)"
            value={form.target_deadline ?? null}
            onChange={(date) =>
              setForm({
                ...form,
                target_deadline: date ? date.toISOString() : null,
              })
            }
            placeholderText="Pilih tanggal target"
            minDate={new Date()}
          />
        </div>
      </Modal>
    </>
  )
}

function FormCheckbox({
  checked,
  title,
  description,
  onChange,
}: {
  checked: boolean
  title: string
  description: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/80 bg-white/55 px-4 py-3 text-sm shadow-sm backdrop-blur-xl transition hover:bg-white">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span>
        <span className="block font-semibold text-slate-950">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  )
}

function labelForType(type: WalletType): string {
  if (type === 'personal') return 'Personal'
  if (type === 'business') return 'Business'
  return 'Shared'
}

function getTargetProgress(wallet: Wallet): number | null {
  const targetAmount = Number(wallet.target_amount ?? 0)
  if (!wallet.target_name && targetAmount <= 0) return null

  if (targetAmount <= 0) {
    return 0
  }

  return Math.min(
    100,
    Math.round((Number(wallet.balance ?? 0) / targetAmount) * 100),
  )
}

function formatRelativeFromMs(ms: number | null): string {
  if (!ms) return 'Belum ada aktivitas'

  const diff = Date.now() - ms

  if (diff < 60_000) return 'Baru saja'

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`

  return new Date(ms).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  })
}

export default WalletsPage
