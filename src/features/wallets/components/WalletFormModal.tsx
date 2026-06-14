import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCheckCircle } from 'react-icons/hi2'
import { walletApi, type WalletPayload } from '@/features/wallets/api'
import { Button, CurrencyInput, DateInput, Input, Modal } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { cn, formatCurrency } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import type { Wallet } from '@/types/api'
import { TYPE_THEME, WALLET_TYPE_OPTIONS } from '../utils/constants'
import { normalizeWalletType } from '../utils/helpers'
import type { WalletType } from '@/types/api'

function initialWalletForm(editing: Wallet | null): WalletPayload {
  return {
    name: editing?.name ?? '',
    type: normalizeWalletType(editing?.type),
    currency: editing?.currency ?? 'IDR',
    balance: editing ? Number(editing.balance) : 0,
    is_default: editing?.is_default ?? false,
    target_name: editing?.target_name ?? null,
    target_amount: editing?.target_amount ?? null,
    target_deadline: editing?.target_deadline ?? null,
  }
}

function walletTypeLabelEn(type: WalletType) {
  return ({
    cash: 'Cash',
    bank_account: 'Bank',
    e_wallet: 'E-Wallet',
    credit_card: 'Credit Card',
    savings: 'Savings',
    investment: 'Investment',
  } as Record<WalletType, string>)[type]
}

function walletTypeDescriptionEn(type: WalletType) {
  return ({
    cash: 'Physical money you keep or carry.',
    bank_account: 'Main bank account or bank pocket.',
    e_wallet: 'Digital payment app balance.',
    credit_card: 'Credit card or paylater limit to monitor.',
    savings: 'Dedicated pocket for a specific goal.',
    investment: 'Investment assets tracked as part of your wealth.',
  } as Record<WalletType, string>)[type]
}

function walletTypeExampleEn(type: WalletType) {
  return ({
    cash: 'Physical wallet, petty cash',
    bank_account: 'BCA, BRI, Mandiri, BNI, CIMB, Jago, Blu',
    e_wallet: 'GoPay, OVO, DANA, ShopeePay, LinkAja, AstraPay',
    credit_card: 'Visa, Mastercard, PayLater',
    savings: 'Emergency fund, vacation, self reward',
    investment: 'Stocks, mutual funds, ETF, deposit, gold',
  } as Record<WalletType, string>)[type]
}

export function WalletFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Wallet | null
}) {
  const t = useT()
  const { locale } = useLocale()
  const qc = useQueryClient()
  const copy = locale === 'id'
    ? {
        targetTooSmall: (balance: string) => `Target tidak boleh lebih kecil dari saldo sekarang (${balance}).`,
        created: 'Wallet dibuat',
        updated: 'Wallet diperbarui',
        namePlaceholder: 'Contoh: Dompet Utama, Bank BCA, GoPay',
        typeHelp: 'Pilih jenis dompet yang paling mendekati sumber dana ini.',
        defaultDesc: 'Dompet ini akan dipakai otomatis saat menambahkan transaksi baru.',
        targetPocket: 'Jadikan Kantong Tujuan',
        targetPocketDesc: 'Aktifkan target tabungan dan atur detailnya lewat popup.',
        activePocket: 'Kantong tujuan aktif',
        target: 'Target',
        setTarget: 'Atur Target',
        targetTitle: 'Atur Kantong Tujuan',
        saveTarget: 'Simpan Target',
        targetName: 'Nama Tujuan',
        targetNamePlaceholder: 'Contoh: Liburan Bali, DP Rumah',
        targetAmount: 'Target Nominal (IDR)',
        targetDate: 'Target Tanggal (opsional)',
        targetDatePlaceholder: 'Pilih tanggal target',
        required: 'Nama, jenis, dan nominal wajib diisi. Nominal boleh Rp 0.',
        showMoreTypes: 'Lihat jenis lainnya',
        showLessTypes: 'Ringkas pilihan',
      }
    : {
        targetTooSmall: (balance: string) => `Target cannot be lower than the current balance (${balance}).`,
        created: 'Wallet created',
        updated: 'Wallet updated',
        namePlaceholder: 'Example: Main Wallet, BCA Bank, GoPay',
        typeHelp: 'Choose the wallet type that best matches this money source.',
        defaultDesc: 'This wallet will be used automatically when adding new transactions.',
        targetPocket: 'Make it a Target Pocket',
        targetPocketDesc: 'Enable a savings target and configure its details in a modal.',
        activePocket: 'Target pocket active',
        target: 'Target',
        setTarget: 'Set Target',
        targetTitle: 'Set Target Pocket',
        saveTarget: 'Save Target',
        targetName: 'Target Name',
        targetNamePlaceholder: 'Example: Bali Trip, Home Down Payment',
        targetAmount: 'Target Amount (IDR)',
        targetDate: 'Target Date (optional)',
        targetDatePlaceholder: 'Choose target date',
        required: 'Name, type, and amount are required. The amount can be Rp 0.',
        showMoreTypes: 'Show more types',
        showLessTypes: 'Show less',
      }

  const [form, setForm] = useState<WalletPayload>(() => initialWalletForm(editing))
  const [showAllTypes, setShowAllTypes] = useState(false)

  const [isPocket, setIsPocket] = useState<boolean>(
    Boolean(editing?.target_amount && editing.target_amount > 0),
  )
  const [targetOpen, setTargetOpen] = useState(false)
  const currentBalance = Number(form.balance ?? 0)
  const targetAmount = Number(form.target_amount ?? 0)
  const targetError =
    isPocket && targetAmount > 0 && targetAmount < currentBalance
      ? copy.targetTooSmall(formatCurrency(currentBalance))
      : ''
  const formError = !form.name.trim() || !form.type || !Number.isFinite(Number(form.balance))
    ? copy.required
    : ''

  useEffect(() => {
    if (!open) return
    setForm(initialWalletForm(editing))
    setIsPocket(Boolean(editing?.target_amount && editing.target_amount > 0))
    setTargetOpen(false)
    setShowAllTypes(false)
  }, [editing, open])

  const save = useMutation({
    mutationFn: () => {
      if (formError) throw new Error(formError)
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
      if (!editing) {
        trackEvent(analyticsEvents.walletCreated, {
          feature_name: 'wallet',
          wallet_type: form.type,
        })
      }
      toast.success(editing ? copy.updated : copy.created)
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
            <Button loading={save.isPending} onClick={() => save.mutate()} disabled={!!targetError || !!formError}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.common.name}
            placeholder={copy.namePlaceholder}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-600">{t.wallets.type}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{copy.typeHelp}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {WALLET_TYPE_OPTIONS.map((option, index) => {
                const selected = form.type === option.value
                const visibleOnMobile = index < 3 || showAllTypes || selected
                const theme = TYPE_THEME[option.value]
                const label = locale === 'id' ? option.label : walletTypeLabelEn(option.value)
                const description = locale === 'id' ? option.description : walletTypeDescriptionEn(option.value)
                const example = locale === 'id' ? option.example : walletTypeExampleEn(option.value)
                const Icon = theme.Icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: option.value })}
                    className={cn(
                      'group relative rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                      !visibleOnMobile && 'hidden sm:block',
                      selected
                        ? 'border-brand-300 bg-brand-50 shadow-sm shadow-brand-100'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', theme.iconBg, theme.iconText)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-950">{label}</span>
                          {selected ? <HiOutlineCheckCircle className="h-4 w-4 text-brand-600" /> : null}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
                        <span className="mt-1 block text-[11px] font-medium text-slate-400">{example}</span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowAllTypes((value) => !value)}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50 sm:hidden"
            >
              {showAllTypes ? copy.showLessTypes : copy.showMoreTypes}
            </button>
          </div>

          <CurrencyInput
            label={`${t.wallets.balance} (IDR)`}
            value={Number(form.balance) || 0}
            onChange={(value) => setForm({ ...form, balance: value })}
            placeholder="0"
          />
          {formError ? <p className="-mt-2 text-xs font-semibold text-rose-600">{formError}</p> : null}

          <FormCheckbox
            checked={form.is_default ?? false}
            title={t.wallets.isDefault}
            description={copy.defaultDesc}
            onChange={(checked) => setForm({ ...form, is_default: checked })}
          />

          <FormCheckbox
            checked={isPocket}
            title={copy.targetPocket}
            description={copy.targetPocketDesc}
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
                    {form.target_name || copy.activePocket}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {copy.target} {formatCurrency(Number(form.target_amount ?? 0)) || 'Rp 0'}
                  </p>
                  {targetError ? (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{targetError}</p>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" onClick={() => setTargetOpen(true)}>
                  {copy.setTarget}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        title={copy.targetTitle}
        footer={
          <>
            {/* <Button variant="outline" onClick={() => setTargetOpen(false)}>
              Tutup
            </Button> */}
            <Button onClick={() => setTargetOpen(false)} disabled={!!targetError}>
              {copy.saveTarget}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={copy.targetName}
            placeholder={copy.targetNamePlaceholder}
            value={form.target_name ?? ''}
            onChange={(event) => setForm({ ...form, target_name: event.target.value })}
          />

          <CurrencyInput
            label={copy.targetAmount}
            value={Number(form.target_amount) || 0}
            onChange={(value) => setForm({ ...form, target_amount: value })}
            placeholder="0"
            error={targetError}
          />

          <DateInput
            label={copy.targetDate}
            value={form.target_deadline ?? null}
            onChange={(date) =>
              setForm({
                ...form,
                target_deadline: date ? date.toISOString() : null,
              })
            }
            placeholderText={copy.targetDatePlaceholder}
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
    <label
      className={`
        group flex cursor-pointer items-start gap-3 rounded-2xl border
        px-4 py-3 transition-all duration-200
        ${
          checked
            ? 'border-brand-300 bg-brand-50 shadow-md shadow-brand-100/40'
            : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="
          mt-1 h-5 w-5 shrink-0 rounded-md
          border-slate-300
          text-brand-600
          focus:ring-2
          focus:ring-brand-500/30
        "
      />

      <div className="min-w-0">
        <p
          className={`
            text-sm font-semibold transition
            ${checked ? 'text-brand-700' : 'text-slate-900'}
          `}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </label>
  )
}
