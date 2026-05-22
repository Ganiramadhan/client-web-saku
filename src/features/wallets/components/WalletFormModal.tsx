import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi, type WalletPayload } from '@/features/wallets/api'
import { Button, CurrencyInput, DateInput, Input, Modal, RSelect, type SelectOption } from '@/components/ui'
import { useT } from '@/i18n'
import { formatCurrency } from '@/lib/utils'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
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
            options={WALLET_TYPE_OPTIONS as SelectOption[]}
            onChange={(value) => setForm({ ...form, type: (value ?? 'cash') as WalletType })}
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
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </label>
  )
}
