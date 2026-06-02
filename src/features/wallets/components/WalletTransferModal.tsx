import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '@/features/wallets/api'
import { Button, CurrencyInput, Modal, RSelect, type SelectOption } from '@/components/ui'
import { useLocale, useT } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import type { Wallet } from '@/types/api'

export function WalletTransferModal({
  open,
  onClose,
  wallets,
}: {
  open: boolean
  onClose: () => void
  wallets: Wallet[]
}) {
  const t = useT()
  const { locale } = useLocale()
  const qc = useQueryClient()
  const copy = locale === 'id'
    ? {
        title: 'Pindahkan Saldo',
        from: 'Dari wallet',
        to: 'Ke wallet',
        amount: 'Nominal',
        targetWarning: 'Wallet sumber memiliki target aktif. Jika saldo dipindahkan, target wallet sumber akan dihapus.',
        confirmTarget: 'Saya paham dan hapus target wallet sumber',
        sameWallet: 'Wallet sumber dan tujuan harus berbeda.',
        notEnough: 'Saldo wallet sumber tidak cukup.',
        success: 'Saldo berhasil dipindahkan',
        choose: 'Pilih wallet',
      }
    : {
        title: 'Transfer Balance',
        from: 'From wallet',
        to: 'To wallet',
        amount: 'Amount',
        targetWarning: 'The source wallet has an active target. Moving balance will remove the source wallet target.',
        confirmTarget: 'I understand and remove the source wallet target',
        sameWallet: 'Source and destination wallets must be different.',
        notEnough: 'The source wallet balance is not enough.',
        success: 'Balance transferred',
        choose: 'Choose wallet',
      }

  const options: SelectOption[] = useMemo(
    () =>
      wallets.map((wallet) => ({
        value: wallet.id,
        label: `${wallet.name} · ${formatCurrency(Number(wallet.balance ?? 0), wallet.currency)}`,
      })),
    [wallets],
  )
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [clearTarget, setClearTarget] = useState(false)

  const source = wallets.find((wallet) => wallet.id === fromId) ?? null
  const hasSourceTarget = Boolean(source?.target_amount && source.target_amount > 0)
  const validation =
    fromId && toId && fromId === toId
      ? copy.sameWallet
      : source && amount > Number(source.balance ?? 0)
        ? copy.notEnough
        : ''

  const transfer = useMutation({
    mutationFn: () =>
      walletApi.transfer({
        from_wallet_id: fromId,
        to_wallet_id: toId,
        amount,
        clear_source_target: clearTarget,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(copy.success)
      qc.invalidateQueries({ queryKey: ['wallets'] })
      qc.invalidateQueries({ queryKey: ['wallet-transfers'] })
      setFromId('')
      setToId('')
      setAmount(0)
      setNote('')
      setClearTarget(false)
      onClose()
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const disabled =
    !fromId ||
    !toId ||
    amount <= 0 ||
    Boolean(validation) ||
    (hasSourceTarget && !clearTarget)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button loading={transfer.isPending} disabled={disabled} onClick={() => transfer.mutate()}>
            {copy.title}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <RSelect
          label={copy.from}
          value={fromId}
          options={options}
          onChange={(value) => {
            setFromId(String(value ?? ''))
            setClearTarget(false)
          }}
          placeholder={copy.choose}
        />
        <RSelect
          label={copy.to}
          value={toId}
          options={options.filter((option) => option.value !== fromId)}
          onChange={(value) => setToId(String(value ?? ''))}
          placeholder={copy.choose}
        />
        <CurrencyInput
          label={`${copy.amount} (IDR)`}
          value={amount}
          onChange={setAmount}
          placeholder="0"
          error={validation}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Catatan</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={255}
            placeholder={locale === 'id' ? 'Opsional, misalnya pindah dana darurat' : 'Optional, e.g. emergency fund transfer'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        {hasSourceTarget ? (
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              checked={clearTarget}
              onChange={(event) => setClearTarget(event.target.checked)}
            />
            <span>
              <span className="block font-semibold">{copy.targetWarning}</span>
              <span className="mt-1 block text-xs">{copy.confirmTarget}</span>
            </span>
          </label>
        ) : null}
      </div>
    </Modal>
  )
}
