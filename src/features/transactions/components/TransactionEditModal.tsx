import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transactionApi, type TransactionUpdatePayload } from '@/features/transactions/api'
import { walletApi } from '@/features/wallets/api'
import { categoryApi } from '@/features/categories/api'
import { Button, CurrencyInput, DateInput, Input, Modal, RSelect, Textarea, type SelectOption } from '@/components/ui'
import { useT } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import type { Transaction } from '@/types/api'
import type { TransactionCopy } from '../constants/copy'

export function EditModal({
  tx,
  onClose,
  copy,
}: {
  tx: Transaction | null
  onClose: () => void
  copy: TransactionCopy
}) {
  const t = useT()
  const qc = useQueryClient()
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: walletApi.list })
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.list(),
  })

  const [form, setForm] = useState<TransactionUpdatePayload>(() => ({
    wallet_id: tx?.wallet_id,
    category_id: tx?.category_id,
    amount: tx ? Number(tx.amount) : 0,
    type: tx?.type ?? 'expense',
    description: tx?.description ?? '',
    merchant_name: tx?.merchant_name ?? '',
    transaction_date: tx?.transaction_date,
  }))

  const filteredCats = useMemo(
    () =>
      (categories.data ?? [])
        .filter((c) => c.type === form.type)
        .map<SelectOption>((c) => ({ value: c.id, label: c.name })),
    [categories.data, form.type],
  )

  const walletOpts = useMemo(
    () =>
      (wallets.data ?? []).map<SelectOption>((w) => ({
        value: w.id,
        label: w.name,
      })),
    [wallets.data],
  )

  const m = useMutation({
    mutationFn: () => {
      if (!tx) throw new Error('No transaction')
      const payload: TransactionUpdatePayload = {
        ...form,
        transaction_date: form.transaction_date
          ? new Date(form.transaction_date).toISOString()
          : undefined,
      }
      return transactionApi.update(tx.id, payload)
    },
    onSuccess: () => {
      toast.success(copy.updated)
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={Boolean(tx)}
      onClose={onClose}
      title={tx ? copy.editTitle : ''}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button loading={m.isPending} onClick={() => m.mutate()}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <RSelect
          label={copy.type}
          value={form.type ?? 'expense'}
          options={[
            { value: 'expense', label: copy.expense },
            { value: 'income', label: copy.income },
          ]}
          onChange={(v) =>
            setForm({
              ...form,
              type: (v as 'income' | 'expense') ?? 'expense',
              category_id: undefined,
            })
          }
        />
        <RSelect
          label={copy.wallet}
          value={form.wallet_id ?? ''}
          options={walletOpts}
          onChange={(v) => setForm({ ...form, wallet_id: v ?? '' })}
        />
        <RSelect
          label={copy.category}
          value={form.category_id ?? ''}
          options={filteredCats}
          onChange={(v) => setForm({ ...form, category_id: v ?? '' })}
        />
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            {copy.amount}
          </label>
          <CurrencyInput
            value={Number(form.amount ?? 0)}
            onChange={(val) => setForm({ ...form, amount: val })}
          />
        </div>
        <DateInput
          label={copy.date}
          value={form.transaction_date || null}
          onChange={(d) =>
            setForm({
              ...form,
              transaction_date: d ? d.toISOString() : undefined,
            })
          }
          placeholderText={copy.pickDate}
        />
        <Input
          label={copy.merchant}
          placeholder={copy.merchantPlaceholder}
          value={form.merchant_name ?? ''}
          onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
        />
        <Textarea
          label={copy.description}
          rows={2}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </Modal>
  )
}
