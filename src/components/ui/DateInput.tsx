import { forwardRef } from 'react'
import ReactDatePicker from 'react-datepicker'
import { HiOutlineCalendar } from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import 'react-datepicker/dist/react-datepicker.css'

export interface DateInputProps {
  label?: string
  hint?: string
  error?: string
  value?: Date | string | null
  onChange: (d: Date | null) => void
  showTime?: boolean
  className?: string
  placeholderText?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}


export const DateInput = forwardRef<HTMLDivElement, DateInputProps>(function DateInput(
  { label, hint, error, value, onChange, showTime, className, placeholderText, minDate, maxDate, disabled },
  ref,
) {
  const selected = value ? (typeof value === 'string' ? new Date(value) : value) : null
  return (
    <div ref={ref} className={cn('w-full', className)}>
      {label ? (
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      ) : null}
      <div className="relative">
        <HiOutlineCalendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <ReactDatePicker
          selected={selected}
          onChange={(d: Date | null) => onChange(d)}
          dateFormat={showTime ? 'dd MMM yyyy HH:mm' : 'dd MMM yyyy'}
          showTimeSelect={showTime}
          timeFormat="HH:mm"
          timeIntervals={15}
          showPopperArrow={false}
          placeholderText={placeholderText ?? (showTime ? 'Pilih tanggal & waktu' : 'Pilih tanggal')}
          autoComplete="off"
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          wrapperClassName="block w-full"
          className={cn(
            'w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:outline-none focus:ring-2',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
            disabled && 'cursor-not-allowed bg-slate-50 text-slate-400',
          )}
          popperClassName="!z-50"
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
})
