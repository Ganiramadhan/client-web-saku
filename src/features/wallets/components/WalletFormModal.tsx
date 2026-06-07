import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi, type WalletPayload } from '@/features/wallets/api'
import { Button, CurrencyInput, DateInput, Input, Modal, RSelect, type SelectOption } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { formatCurrency } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import type { Wallet } from '@/types/api'
import { WALLET_TYPE_OPTIONS } from './FilterTabs'
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
      }
    : {
        targetTooSmall: (balance: string) => `Target cannot be lower than the current balance (${balance}).`,
        created: 'Wallet created',
        updated: 'Wallet updated',
        namePlaceholder: 'Example: Main Wallet, BCA Bank, GoPay',
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
      }

  const [form, setForm] = useState<WalletPayload>(() => initialWalletForm(editing))
  const walletTypeOptions: SelectOption[] = WALLET_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: locale === 'id'
      ? option.label
      : ({
          cash: 'Cash',
          bank_account: 'Bank Account',
          e_wallet: 'E-Wallet',
          credit_card: 'Credit Card',
          savings: 'Savings',
          investment: 'Investment',
        } as Record<WalletType, string>)[option.value],
  }))

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

          <RSelect
            label={t.wallets.type}
            value={form.type}
            options={walletTypeOptions}
            onChange={(value) => setForm({ ...form, type: (value ?? 'cash') as WalletType })}
          />

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
