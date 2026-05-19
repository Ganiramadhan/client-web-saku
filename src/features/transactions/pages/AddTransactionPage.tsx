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
      const dateObj = new Date(form.transaction_date)
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
    <div className="min-h-screen bg-slate-50">
      <PageHeader 
        title="Tambah Transaksi" 
        subtitle="Catat pemasukan dan pengeluaran Anda"
      />

      <div className="mx-auto max-w-4xl px-3 pb-8 sm:px-4 lg:px-6">
        {/* Soft Tabs */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => { setActiveTab('expense'); setForm({ ...form, type: 'expense', category_id: '', merchant_name: '' }) }}
            className={cn(
              'flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-6 sm:text-base',
              activeTab === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-slate-50 border border-gray-200'
            )}
          >
            {t.transactions.expense}
          </button>
          <button
            onClick={() => { setActiveTab('income'); setForm({ ...form, type: 'income', category_id: '', merchant_name: '' }) }}
            className={cn(
              'flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-6 sm:text-base',
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-slate-50 border border-gray-200'
            )}
          >
            {t.transactions.income}
          </button>
        </div>

        <Card className="shadow-lg backdrop-blur-sm bg-white/95">
          {/* Amount Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
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
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              {t.transactions.category}
            </label>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 sm:gap-3">
              {filteredCats.map((cat) => {
                const Icon = categoryIconsMap[cat.name] || IoEllipsisHorizontal
                const isSelected = form.category_id === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, category_id: cat.id })}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 sm:p-4',
                      isSelected
                        ? activeTab === 'income'
                          ? 'bg-emerald-50 ring-2 ring-emerald-500'
                          : 'bg-rose-50 ring-2 ring-rose-500'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    )}
                  >
                    <Icon 
                      className={cn(
                        'h-6 w-6 sm:h-7 sm:w-7', 
                        isSelected 
                          ? (activeTab === 'income' ? 'text-green-600' : 'text-red-600') 
                          : 'text-gray-600'
                      )} 
                    />
                    <span 
                      className={cn(
                        'text-center text-xs font-medium leading-tight',
                        isSelected 
                          ? (activeTab === 'income' ? 'text-green-900' : 'text-red-900') 
                          : 'text-gray-700'
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
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              {t.transactions.wallet}
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
              {(wallets.data ?? []).map((w) => {
                const WalletIcon = getWalletIcon(w.name)
                const isSelected = form.wallet_id === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => setForm({ ...form, wallet_id: w.id })}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-medium transition-all duration-200 sm:flex-1 sm:px-4',
                      isSelected
                        ? 'bg-blue-50 ring-2 ring-blue-500 text-blue-900'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    )}
                  >
                    <WalletIcon className={cn('h-5 w-5', isSelected ? 'text-blue-600' : 'text-gray-600')} />
                    <span className="text-sm font-semibold">{w.name}</span>
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
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              {t.transactions.merchant}
            </label>
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {merchantOptions.map((merchant) => {
                const Icon = merchant.icon
                const isSelected = form.merchant_name === merchant.name
                const isLainnya = merchant.name === 'Lainnya'
                return (
                  <button
                    key={merchant.name}
                    onClick={() => setForm({ ...form, merchant_name: isLainnya ? '' : merchant.name })}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 sm:p-3.5',
                      isSelected
                        ? 'bg-violet-50 ring-2 ring-violet-500'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    )}
                  >
                    <Icon 
                      className={cn(
                        'h-5 w-5 sm:h-6 sm:w-6', 
                        isSelected ? 'text-purple-600' : 'text-gray-600'
                      )} 
                    />
                    <span 
                      className={cn(
                        'text-center text-xs font-medium leading-tight',
                        isSelected ? 'text-purple-900' : 'text-gray-700'
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
            className="mb-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-slate-100 border border-gray-200"
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
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              )}
            >
              Simpan Transaksi
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
