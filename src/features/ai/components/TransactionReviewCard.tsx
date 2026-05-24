import { useState } from 'react'
import { HiOutlineCheckCircle } from 'react-icons/hi2'
import { RiSparklingLine, RiWalletLine } from 'react-icons/ri'
import { CurrencyInput, RSelect, Textarea, type SelectOption } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types/api'
import { cleanMerchant, type Message, type TxForm } from '../utils/freeText'

function getCategoryEmoji(name?: string): string {
  if (!name) return '💰'
  const n = name.toLowerCase()
  if (n.includes('makan') || n.includes('minum') || n.includes('kuliner') || n.includes('food') || n.includes('drink') || n.includes('kopi') || n.includes('coffee') || n.includes('warung') || n.includes('restoran')) return '🍔'
  if (n.includes('trans') || n.includes('ojek') || n.includes('gojek') || n.includes('grab') || n.includes('bensin') || n.includes('mobil') || n.includes('motor') || n.includes('travel') || n.includes('bus') || n.includes('kereta')) return '🚗'
  if (n.includes('belanja') || n.includes('shop') || n.includes('supermarket') || n.includes('mall') || n.includes('baju') || n.includes('pakaian')) return '🛍️'
  if (n.includes('hiburan') || n.includes('nonton') || n.includes('bioskop') || n.includes('game') || n.includes('rekreasi') || n.includes('play')) return '🎮'
  if (n.includes('kesehatan') || n.includes('obat') || n.includes('dokter') || n.includes('rs') || n.includes('sakit') || n.includes('health') || n.includes('medical')) return '🏥'
  if (n.includes('tagihan') || n.includes('listrik') || n.includes('air') || n.includes('wifi') || n.includes('internet') || n.includes('pulsa') || n.includes('bill')) return '⚡'
  if (n.includes('gaji') || n.includes('salary') || n.includes('bonus') || n.includes('pendapatan') || n.includes('income')) return '💵'
  if (n.includes('investasi') || n.includes('saham') || n.includes('reksadana')) return '📈'
  if (n.includes('edukasi') || n.includes('sekolah') || n.includes('kuliah') || n.includes('buku')) return '🎓'
  return '💸'
}

export function TransactionReviewCard({
  message,
  walletOptions,
  categoryOptions,
  onSave,
  onFormChange,
  onToggleSelect,
  isSaving,
}: {
  message: Message
  walletOptions: SelectOption[]
  categoryOptions: (type: TransactionType) => SelectOption[]
  onSave: (form: TxForm) => void
  onFormChange: (form: TxForm) => void
  onToggleSelect?: () => void
  isSaving: boolean
}) {
  const t = useT()
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        saved: 'Tersimpan',
        preview: 'Pratinjau Transaksi',
        ready: 'Siap dicek',
        noDescription: 'Deskripsi tidak tersedia',
        noCategory: 'Kategori tidak tersedia',
        chooseWallet: 'Pilih Dompet',
        editDetail: 'Edit Detail',
        saving: 'Menyimpan...',
        confirm: 'Konfirmasi',
        willSave: 'Akan disimpan',
        skip: 'Lewati',
        detail: 'Detail Transaksi',
        editTx: 'Edit Transaksi',
        amount: 'Nominal',
        type: 'Tipe',
        category: 'Kategori',
        merchant: 'Merchant',
        wallet: 'Dompet',
        date: 'Tanggal Transaksi',
        merchantPlaceholder: 'Nama toko / sumber',
        description: 'Deskripsi (Opsional)',
        descriptionPlaceholder: 'Catatan tambahan...',
        cancelEdit: 'Batal Edit',
        saveTransaction: 'Simpan Transaksi',
      }
    : {
        saved: 'Saved',
        preview: 'Transaction Preview',
        ready: 'Ready to review',
        noDescription: 'No description available',
        noCategory: 'No category available',
        chooseWallet: 'Choose Wallet',
        editDetail: 'Edit Details',
        saving: 'Saving...',
        confirm: 'Confirm',
        willSave: 'Will be saved',
        skip: 'Skip',
        detail: 'Transaction Details',
        editTx: 'Edit Transaction',
        amount: 'Amount',
        type: 'Type',
        category: 'Category',
        merchant: 'Merchant',
        wallet: 'Wallet',
        date: 'Transaction Date',
        merchantPlaceholder: 'Store / source name',
        description: 'Description (Optional)',
        descriptionPlaceholder: 'Additional notes...',
        cancelEdit: 'Cancel Edit',
        saveTransaction: 'Save Transaction',
      }
  const form = message.form as TxForm
  const filteredCats = categoryOptions(form.type)
  const isBatch = !!message.batchId
  const saved = !!message.saved
  const selected = message.selected !== false
  const update = (patch: Partial<TxForm>) => onFormChange({ ...form, ...patch })
  const invalid = !form.wallet_id || !form.category_id || form.amount <= 0

  const [isEditing, setIsEditing] = useState(false)

  const walletName = walletOptions.find((w) => w.value === form.wallet_id)?.label
  const categoryName = filteredCats.find((c) => c.value === form.category_id)?.label
  const categoryEmoji = getCategoryEmoji(categoryName || message.extractedData?.category)

  if (!isEditing || saved) {
    return (
      <div className={cn('relative mt-3 overflow-hidden rounded-2xl border border-white/80 bg-white/68 shadow-lg shadow-slate-200/35 backdrop-blur-2xl transition duration-300 hover:shadow-xl', saved && 'ring-1 ring-emerald-200')}>
        {saved ? (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
            {copy.saved}
          </div>
        ) : null}
        <div className="px-5 pb-4 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <RiSparklingLine className="h-4 w-4 text-blue-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {copy.preview}
            </p>
            {!saved ? (
              <span className="ml-auto inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {copy.ready}
              </span>
            ) : null}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-2xl">
              {categoryEmoji}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {form.description || copy.noDescription}
              </p>
              <p className="truncate text-xs text-slate-400">
                {categoryName || copy.noCategory}
              </p>
            </div>

            <span
              className={cn(
                'ml-auto text-lg font-extrabold shrink-0',
                form.type === 'income' ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {form.type === 'income' ? '+' : '-'}Rp {form.amount.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <RiWalletLine className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate text-xs font-medium text-slate-600">
                {walletName || copy.chooseWallet}
              </span>
            </div>

            <span className="text-xs text-slate-400 shrink-0">
              {form.transaction_date}
            </span>
          </div>
        </div>

        {!saved ? (
          <div className="flex border-t border-slate-200/50 bg-white/30">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex-1 py-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/50"
            >
              {copy.editDetail}
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={isSaving || invalid}
              className="flex-1 py-3 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50/70 disabled:opacity-40"
            >
              {isSaving ? copy.saving : copy.confirm}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  // Edit / Saved Mode
  return (
    <div
      className={cn(
        'relative mt-3 overflow-hidden rounded-3xl border bg-white/40 backdrop-blur-xl transition shadow-md',
        saved
          ? 'border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50/10'
          : isBatch && selected && invalid
            ? 'border-amber-300 ring-1 ring-amber-100'
            : isBatch && selected
              ? 'border-brand-300 ring-1 ring-brand-100'
              : 'border-white/60',
      )}
    >
      {saved ? (
        <div className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          ✓ {copy.saved}
        </div>
      ) : null}

      <div
        className={cn(
          'border-b px-4 py-3',
          saved ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200/50 bg-slate-50/40',
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isBatch && !saved ? (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onToggleSelect}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  aria-label={copy.willSave}
                />
                <span>{selected ? copy.willSave : copy.skip}</span>
              </label>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {saved ? copy.detail : copy.editTx}
              </span>
            )}
          </div>
          {!saved ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {copy.ready}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          {[
            {
              label: copy.amount,
              value: `Rp ${(message.extractedData?.amount ?? 0).toLocaleString('id-ID')}`,
            },
            {
              label: copy.type,
              value:
                message.extractedData?.type === 'income' ? t.transactions.income : t.transactions.expense,
            },
            { label: copy.category, value: message.extractedData?.category ?? '-' },
            { label: copy.merchant, value: cleanMerchant(message.extractedData?.merchant_name) },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="truncate text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={cn('px-4 py-4', saved && 'pointer-events-none opacity-60')}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <RSelect
              label={copy.type}
              value={form.type}
              options={[
                { value: 'expense', label: t.transactions.expense },
                { value: 'income', label: t.transactions.income },
              ]}
              onChange={(v) => update({ type: (v as TransactionType) ?? 'expense' })}
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">{copy.amount}</label>
              <CurrencyInput
                value={form.amount}
                onChange={(val) => update({ amount: val })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              {copy.date}
            </label>
            <input
              type="date"
              aria-label={copy.date}
              value={form.transaction_date}
              onChange={(e) => update({ transaction_date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <RSelect
              label={copy.wallet}
              value={form.wallet_id}
              options={walletOptions}
              onChange={(v) => update({ wallet_id: v ?? '' })}
            />
            <RSelect
              label={copy.category}
              value={form.category_id}
              options={filteredCats}
              onChange={(v) => update({ category_id: v ?? '' })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">{copy.merchant}</label>
            <input
              type="text"
              value={form.merchant_name}
              onChange={(e) => update({ merchant_name: e.target.value })}
              placeholder={copy.merchantPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <Textarea
            label={copy.description}
            value={form.description || ''}
            onChange={(e) => update({ description: e.target.value })}
            placeholder={copy.descriptionPlaceholder}
            rows={2}
          />
        </div>

        {!saved ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
              }}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {copy.cancelEdit}
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(form)
                setIsEditing(false)
              }}
              disabled={isSaving || invalid}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {isSaving ? copy.saving : copy.saveTransaction}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ─────────────────────────── Batch Actions Card ─────────────────────────── */

export function BatchActionsCard({
  batchId,
  messages,
  onBulkSave,
  onBulkCancel,
  onSelectAll,
  isSaving,
}: {
  batchId: string
  messages: Message[]
  onBulkSave: (batchId: string) => void
  onBulkCancel: (batchId: string) => void
  onSelectAll: (batchId: string, value: boolean) => void
  isSaving: boolean
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        selectAll: 'Pilih semua',
        of: 'dari',
        selected: 'dipilih',
        saved: 'tersimpan',
        cancelAll: 'Batalkan semua',
        saving: 'Menyimpan...',
        saveSelected: 'Simpan terpilih',
      }
    : {
        selectAll: 'Select all',
        of: 'of',
        selected: 'selected',
        saved: 'saved',
        cancelAll: 'Cancel all',
        saving: 'Saving...',
        saveSelected: 'Save selected',
      }
  const reviews = messages.filter(
    (m) => m.batchId === batchId && m.type === 'transaction-review',
  )
  const remaining = reviews.filter((m) => !m.saved)
  const selectedCount = remaining.filter((m) => m.selected !== false).length
  const savedCount = reviews.length - remaining.length
  const allSelected = remaining.length > 0 && selectedCount === remaining.length
  if (reviews.length === 0) return null

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-linear-to-br from-brand-50 to-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(batchId, e.target.checked)}
              disabled={remaining.length === 0 || isSaving}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              aria-label={copy.selectAll}
            />
            {copy.selectAll}
          </label>
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-brand-700">{selectedCount}</span>{' '}
            {copy.of} {remaining.length} {copy.selected}
            {savedCount > 0 ? (
              <span className="ml-2 text-emerald-600">· {savedCount} {copy.saved}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulkCancel(batchId)}
            disabled={isSaving || remaining.length === 0}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {copy.cancelAll}
          </button>
          <button
            onClick={() => onBulkSave(batchId)}
            disabled={isSaving || selectedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {isSaving ? copy.saving : `${copy.saveSelected} (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}
