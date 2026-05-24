import { useEffect, useState } from 'react'
import { HiOutlineArrowDownTray } from 'react-icons/hi2'
import { transactionApi } from '@/features/transactions/api'
import { Button, DateInput, Modal, RSelect, type SelectOption } from '@/components/ui'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { TransactionCopy } from '../constants/copy'

type TypeFilter = 'all' | 'income' | 'expense'

type ExportMode = 'month' | 'range'

export function ExportModal({
  open,
  onClose,
  categoryOptions,
  copy,
}: {
  open: boolean
  onClose: () => void
  categoryOptions: SelectOption[]
  copy: TransactionCopy
}) {
  const [mode, setMode] = useState<ExportMode>('month')
  const [month, setMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [typeF, setTypeF] = useState<TypeFilter>('all')
  const [catF, setCatF] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const invalidRange = mode === 'range' && !!from && !!to && to < from

  useEffect(() => {
    if (from && to && to < from) setTo(null)
  }, [from, to])

  const onExport = async () => {
    if (invalidRange) {
      toast.error(copy.invalidRange)
      return
    }
    setBusy(true)
    try {
      const params: Record<string, string> = {}
      if (mode === 'month') {
        if (month) {
          params.month = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
        }
      } else {
        if (from) params.from = from.toISOString()
        if (to) {
          const end = new Date(to)
          end.setHours(23, 59, 59, 999)
          params.to = end.toISOString()
        }
      }
      if (typeF !== 'all') params.type = typeF
      if (catF) params.category_id = catF

      const blob = await transactionApi.exportXlsx(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const monthStamp = month ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}` : 'bulan'
      const stamp = mode === 'month' ? monthStamp : `${(from ?? new Date()).toISOString().slice(0, 10)}_${(to ?? new Date()).toISOString().slice(0, 10)}`
      a.download = `transaksi-${stamp}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(copy.exportSuccess)
      onClose()
    } catch (e) {
      toast.error(toErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.exportTitle}
      description={copy.exportDescription}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{copy.cancel}</Button>
          <Button onClick={onExport} loading={busy} disabled={invalidRange}>
            <HiOutlineArrowDownTray className="mr-1 h-4 w-4" />
            {copy.download}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('month')}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
              mode === 'month'
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200/50'
                : 'border-white/80 bg-white/62 text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white',
            )}
          >
            {copy.byMonth}
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
              mode === 'range'
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200/50'
                : 'border-white/80 bg-white/62 text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white',
            )}
          >
            {copy.byRange}
          </button>
        </div>

        {mode === 'month' ? (
          <DateInput
            picker="month"
            label={copy.pickMonth}
            value={month}
            onChange={setMonth}
            placeholderText={copy.pickMonth}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label={copy.fromDate}
              value={from}
              onChange={(date) => {
                setFrom(date)
                if (date && to && to < date) setTo(null)
              }}
              placeholderText={copy.pickDate}
              maxDate={to ?? undefined}
            />
            <DateInput
              label={copy.toDate}
              value={to}
              onChange={setTo}
              placeholderText={from ? copy.pickDate : copy.pickStartFirst}
              minDate={from ?? undefined}
              disabled={!from}
            />
          </div>
        )}

        <RSelect
          label={copy.type}
          value={typeF}
          options={[
            { value: 'all', label: copy.all },
            { value: 'income', label: copy.income },
            { value: 'expense', label: copy.expense },
          ]}
          onChange={(v) => setTypeF((v as TypeFilter) ?? 'all')}
        />
        <RSelect
          label={copy.category}
          value={catF}
          options={categoryOptions}
          onChange={(v) => setCatF(v ?? '')}
        />
      </div>
    </Modal>
  )
}
