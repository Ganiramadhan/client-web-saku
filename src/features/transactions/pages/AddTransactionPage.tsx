import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IoFastFoodOutline,
  IoCar,
  IoCart,
  IoReceipt,
  IoGameController,
  IoMedkit,
  IoSchool,
  IoHome,
  IoShirt,
  IoEllipsisHorizontal,
  IoCash,
  IoGift,
  IoBriefcase,
  IoTrendingUp,
  IoStorefront,
  IoWallet as IoWalletIcon,
  IoCard,
  IoCashOutline,
  IoCardOutline,
  IoBagOutline,
  IoBicycle,
  IoRestaurant,
} from 'react-icons/io5'
import { transactionApi, type TransactionPayload } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import { Button, Card, CurrencyInput, Input, Textarea, PageHeader, DateInput } from '@/components/ui'
import { useT } from '@/i18n'
import type { TransactionType } from '@/types/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function AddTransactionPage() {
  const t = useT()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType: TransactionType =
    searchParams.get('type') === 'income' ? 'income' : 'expense'
  const initialWallet = searchParams.get('wallet') ?? ''
  const [activeTab, setActiveTab] = useState<TransactionType>(initialType)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [form, setForm] = useState<TransactionPayload>({
    wallet_id: initialWallet,
    category_id: '',
    amount: 0,
    type: initialType,
    description: '',
    merchant_name: '',
    transaction_date: new Date().toISOString().split('T')[0],
    source: 'manual',
  })

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const categories = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoryApi.list() })

  useEffect(() => {
    if (initialWallet && wallets.data?.some((w) => w.id === initialWallet)) {
      setForm((prev) => (prev.wallet_id ? prev : { ...prev, wallet_id: initialWallet }))
    }
  }, [initialWallet, wallets.data])

  useEffect(() => {
    if (form.wallet_id || !wallets.data?.length) return
    const fallback = wallets.data.find((w) => w.is_default) ?? wallets.data[0]
    setForm((prev) => (prev.wallet_id ? prev : { ...prev, wallet_id: fallback.id }))
  }, [form.wallet_id, wallets.data])

  const filteredCats = useMemo(() => {
    const cats = (categories.data ?? []).filter((c) => c.type === activeTab)
    return cats.sort((a, b) => {
      if (a.name === 'Lainnya') return 1
      if (b.name === 'Lainnya') return -1
      return 0
    })
  }, [categories.data, activeTab])

  const m = useMutation({
    mutationFn: () => {
      const dateObj = new Date(`${form.transaction_date}T00:00:00`)
      const isoDateTime = dateObj.toISOString()
      
      const payload = {
        ...form,
        type: activeTab,
        source: 'manual' as const,
        transaction_date: isoDateTime,
      }
      return transactionApi.create(payload)
    },
    onSuccess: () => {
      toast.success('Transaksi tersimpan')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      navigate('/app/transactions')
    },
    onError: (e) => {
      console.error('Transaction error:', e)
      toast.error(toErrorMessage(e))
    },
  })

  const categoryIconsMap: Record<string, any> = {
    'Makanan & Minuman': IoFastFoodOutline,
    'Transportasi': IoCar,
    'Belanja': IoCart,
    'Tagihan': IoReceipt,
    'Hiburan': IoGameController,
    'Kesehatan': IoMedkit,
    'Pendidikan': IoSchool,
    'Rumah': IoHome,
    'Pakaian': IoShirt,
    'Lainnya': IoEllipsisHorizontal,
    'Gaji': IoCash,
    'Bonus': IoGift,
    'Freelance': IoBriefcase,
    'Investasi': IoTrendingUp,
    'Hadiah': IoGift,
    'Penjualan': IoStorefront,
    'Bunga Bank': IoWalletIcon,
    'Cashback': IoCard,
  }

  const getWalletIcon = (walletName: string) => {
    if (walletName.toLowerCase().includes('cash') || walletName.toLowerCase().includes('tunai')) {
      return IoCashOutline
    }
    if (walletName.toLowerCase().includes('bank')) {
      return IoCardOutline
    }
    if (walletName.toLowerCase().includes('wallet') || walletName.toLowerCase().includes('gopay') || 
        walletName.toLowerCase().includes('ovo') || walletName.toLowerCase().includes('dana')) {
      return IoWalletIcon
    }
    return IoWalletIcon
  }

  // Predefined merchant options
  const merchantOptions = [
    { name: 'Alfamart', icon: IoStorefront },
    { name: 'Indomaret', icon: IoStorefront },
    { name: 'Shopee', icon: IoBagOutline },
    { name: 'Tokopedia', icon: IoBagOutline },
    { name: 'Gojek', icon: IoBicycle },
    { name: 'Grab', icon: IoCar },
    { name: 'Warteg', icon: IoRestaurant },
    { name: 'Lainnya', icon: IoEllipsisHorizontal },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tambah Transaksi" 
        subtitle="Catat pemasukan dan pengeluaran secara manual."
      />

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/80 bg-white/62 p-1 shadow-sm backdrop-blur-xl">
          <button
            onClick={() => { setActiveTab('expense'); setForm({ ...form, type: 'expense', category_id: '', merchant_name: '' }) }}
            className={cn(
              'rounded-lg py-2.5 text-sm font-bold transition',
              activeTab === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            )}
          >
            {t.transactions.expense}
          </button>
          <button
            onClick={() => { setActiveTab('income'); setForm({ ...form, type: 'income', category_id: '', merchant_name: '' }) }}
            className={cn(
              'rounded-lg py-2.5 text-sm font-bold transition',
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            )}
          >
            {t.transactions.income}
          </button>
        </div>

        <Card className="border border-white/80 bg-white/68 shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
          {/* Amount Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {t.common.amount}
            </label>
            <CurrencyInput
              value={form.amount}
              onChange={(val) => setForm({ ...form, amount: val })}
              className="text-2xl font-bold text-slate-900 sm:text-3xl"
            />
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-bold text-slate-700">
              {t.transactions.category}
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
              {filteredCats.map((cat) => {
                const Icon = categoryIconsMap[cat.name] || IoEllipsisHorizontal
                const isSelected = form.category_id === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, category_id: cat.id })}
                    className={cn(
                      'min-h-24 rounded-xl border p-3 text-left transition hover:-translate-y-0.5',
                      isSelected
                        ? activeTab === 'income'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-100'
                          : 'border-rose-300 bg-rose-50 text-rose-950 ring-1 ring-rose-100'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-brand-200 hover:bg-white'
                    )}
                  >
                    <Icon 
                      className={cn(
                        'h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-300', 
                        isSelected 
                          ? (activeTab === 'income' ? 'text-emerald-600 scale-110' : 'text-rose-600 scale-110') 
                          : 'text-slate-500'
                      )} 
                    />
                    <span
                      className={cn(
                        'mt-3 block text-xs font-semibold leading-tight transition-colors',
                        isSelected 
                          ? (activeTab === 'income' ? 'text-emerald-950' : 'text-rose-950') 
                          : 'text-slate-600'
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wallet Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-bold text-slate-700">
              {t.transactions.wallet}
            </label>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(wallets.data ?? []).map((w) => {
                const WalletIcon = getWalletIcon(w.name)
                const isSelected = form.wallet_id === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => setForm({ ...form, wallet_id: w.id })}
                    className={cn(
                      'flex min-w-0 items-center gap-2.5 rounded-xl border px-4 py-3 font-semibold transition hover:-translate-y-0.5',
                      isSelected
                        ? 'border-blue-300 bg-blue-50 text-blue-950 ring-1 ring-blue-100'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-200 hover:bg-white'
                    )}
                  >
                    <WalletIcon className={cn('h-5 w-5', isSelected ? 'text-blue-600' : 'text-gray-500')} />
                    <span className="truncate text-sm font-semibold">{w.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Field - Mandatory */}
          <div className="mb-6">
            <DateInput
              label={t.transactions.date}
              value={form.transaction_date || null}
              onChange={(d) =>
                setForm({
                  ...form,
                  transaction_date: d ? d.toISOString().slice(0, 10) : '',
                })
              }
              placeholderText="Pilih tanggal transaksi"
            />
          </div>

          {/* Merchant Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-bold text-slate-700">
              {t.transactions.merchant}
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {merchantOptions.map((merchant) => {
                const Icon = merchant.icon
                const isSelected = form.merchant_name === merchant.name
                const isLainnya = merchant.name === 'Lainnya'
                return (
                  <button
                    key={merchant.name}
                    onClick={() => setForm({ ...form, merchant_name: isLainnya ? '' : merchant.name })}
                    className={cn(
                      'rounded-xl border p-3 text-left transition hover:-translate-y-0.5',
                      isSelected
                        ? 'border-violet-300 bg-violet-50 text-violet-950 ring-1 ring-violet-100'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-200 hover:bg-white'
                    )}
                  >
                    <Icon 
                      className={cn(
                        'h-5 w-5 sm:h-6 sm:w-6', 
                        isSelected ? 'text-purple-600' : 'text-gray-500'
                      )} 
                    />
                    <span 
                      className={cn(
                        'mt-2 block text-xs font-semibold leading-tight',
                        isSelected ? 'text-purple-950' : 'text-slate-600'
                      )}
                    >
                      {merchant.name}
                    </span>
                  </button>
                )
              })}
            </div>
            {/* Custom Merchant Input - shows when Lainnya is selected or merchant is custom */}
            {(form.merchant_name === '' || !merchantOptions.some(m => m.name === form.merchant_name)) && (
              <div className="mt-3">
                <Input
                  value={form.merchant_name ?? ''}
                  onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
                  placeholder="Nama toko lainnya (opsional)"
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-white"
          >
            <span>Deskripsi (Opsional)</span>
            {showAdvanced ? <HiChevronUp className="h-5 w-5" /> : <HiChevronDown className="h-5 w-5" />}
          </button>

          {showAdvanced && (
            <div className="mb-6">
              <Textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
                className="rounded-xl"
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/app/transactions')}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={() => m.mutate()}
              loading={m.isPending}
              disabled={!form.wallet_id || !form.category_id || form.amount <= 0 || !form.transaction_date}
              className={cn(
                'flex-1 rounded-xl py-3.5 text-sm font-bold shadow-sm sm:py-4 sm:text-base transition-all duration-200',
                activeTab === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
                  : 'bg-rose-600 hover:bg-rose-700 text-white border-0'
              )}
            >
              Simpan Transaksi
            </Button>
          </div>
        </Card>
        </div>

        <Card className="h-fit">
          <div className="flex items-center gap-2 border-b border-white/60 pb-4">
            <span className={cn('h-2.5 w-2.5 rounded-full', activeTab === 'income' ? 'bg-emerald-500' : 'bg-rose-500')} />
            <h3 className="text-sm font-semibold text-slate-900">Ringkasan</h3>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <SummaryRow label="Tipe" value={activeTab === 'income' ? t.transactions.income : t.transactions.expense} />
            <SummaryRow label="Nominal" value={`Rp ${Number(form.amount || 0).toLocaleString('id-ID')}`} />
            <SummaryRow
              label="Dompet"
              value={(wallets.data ?? []).find((w) => w.id === form.wallet_id)?.name ?? 'Belum dipilih'}
            />
            <SummaryRow
              label="Kategori"
              value={filteredCats.find((c) => c.id === form.category_id)?.name ?? 'Belum dipilih'}
            />
            <SummaryRow label="Tanggal" value={form.transaction_date || 'Belum dipilih'} />
          </dl>
          <p className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs leading-5 text-slate-500">
            Pastikan dompet, kategori, nominal, dan tanggal sudah benar sebelum menyimpan transaksi.
          </p>
        </Card>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[11rem] text-right font-semibold text-slate-900">{value}</span>
    </div>
  )
}
