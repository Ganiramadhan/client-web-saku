import { useEffect, useState } from 'react'
import { HiOutlineArrowDownTray } from 'react-icons/hi2'
import { transactionApi } from '@/features/transactions/api'
import { Button, DateInput, Modal, RSelect, type SelectOption } from '@/components/ui'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type TypeFilter = 'all' | 'income' | 'expense'

type ExportMode = 'month' | 'range'

export function ExportModal({
  open,
  onClose,
  categoryOptions,
}: {
  open: boolean
  onClose: () => void
  categoryOptions: SelectOption[]
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
      toast.error('Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.')
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
      toast.success('File berhasil diunduh')
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
      title="Export Transaksi ke Excel"
      description="Pilih periode dan filter sebelum mengunduh data transaksi."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Batal</Button>
          <Button onClick={onExport} loading={busy} disabled={invalidRange}>
            <HiOutlineArrowDownTray className="mr-1 h-4 w-4" />
            Download .xlsx
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
            Per Bulan
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
            Range Tanggal
          </button>
        </div>

        {mode === 'month' ? (
          <DateInput
            picker="month"
            label="Pilih Bulan"
            value={month}
            onChange={setMonth}
            placeholderText="Pilih bulan"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Dari"
              value={from}
              onChange={(date) => {
                setFrom(date)
                if (date && to && to < date) setTo(null)
              }}
              placeholderText="Pilih tanggal"
              maxDate={to ?? undefined}
            />
            <DateInput
              label="Sampai"
              value={to}
              onChange={setTo}
              placeholderText={from ? 'Pilih tanggal' : 'Pilih tanggal mulai dulu'}
              minDate={from ?? undefined}
              disabled={!from}
            />
          </div>
        )}

        <RSelect
          label="Jenis"
          value={typeF}
          options={[
            { value: 'all', label: 'Semua' },
            { value: 'income', label: 'Pemasukan' },
            { value: 'expense', label: 'Pengeluaran' },
          ]}
          onChange={(v) => setTypeF((v as TypeFilter) ?? 'all')}
        />
        <RSelect
          label="Kategori"
          value={catF}
          options={categoryOptions}
          onChange={(v) => setCatF(v ?? '')}
        />
      </div>
    </Modal>
  )
}
