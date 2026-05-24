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
  picker?: 'date' | 'month'
  className?: string
  placeholderText?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}


export const DateInput = forwardRef<HTMLDivElement, DateInputProps>(
  function DateInput(
    {
      label,
      hint,
      error,
      value,
      onChange,
      showTime,
      picker = 'date',
      className,
      placeholderText,
      minDate,
      maxDate,
      disabled,
    },
    ref,
  ) {
    const selected =
      value
        ? typeof value === 'string'
          ? new Date(value)
          : value
        : null

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          disabled && 'opacity-70',
          className,
        )}
      >
        {label ? (
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            {label}
          </label>
        ) : null}

        <div className="relative">
          <HiOutlineCalendar
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2',
              disabled
                ? 'text-slate-300'
                : 'text-slate-400',
            )}
          />

          <ReactDatePicker
            selected={selected}
            onChange={(d: Date | null) => onChange(d)}
            dateFormat={
              picker === 'month'
                ? 'MMMM yyyy'
                : showTime
                  ? 'dd MMM yyyy HH:mm'
                  : 'dd MMM yyyy'
            }
            showMonthYearPicker={picker === 'month'}
            showTimeSelect={showTime}
            timeFormat="HH:mm"
            timeIntervals={15}
            showPopperArrow={false}
            placeholderText={
              placeholderText ??
              (
                picker === 'month'
                  ? 'Pilih bulan'
                  : showTime
                    ? 'Pilih tanggal & waktu'
                    : 'Pilih tanggal'
              )
            }
            autoComplete="off"
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            wrapperClassName="block w-full"
            calendarClassName={
              picker === 'month'
                ? 'saku-datepicker saku-month-picker'
                : 'saku-datepicker'
            }
            className={cn(
              `
              w-full
              rounded-xl
              border
              py-2.5
              pl-9
              pr-3
              text-sm
              text-slate-900
              shadow-sm
              backdrop-blur-xl
              transition-all
              duration-150
              placeholder:text-slate-400
              hover:border-slate-300
              hover:bg-white/90
              focus:outline-none
              focus:ring-2
              `,

              error
                ? `
                  border-rose-300
                  bg-white/80
                  focus:border-rose-500
                  focus:ring-rose-500/30
                `
                : `
                  border-slate-200
                  bg-white/80
                  focus:border-brand-400
                  focus:ring-brand-500/20
                `,

              disabled &&
                `
                pointer-events-none
                cursor-not-allowed
                border-slate-200
                bg-slate-100
                text-slate-400
                shadow-none
              `,
            )}
            popperClassName="!z-[9999]"
            popperProps={{
              strategy: 'fixed',
            }}
            portalId="root"
          />
        </div>

        {error ? (
          <p className="mt-1 text-xs text-rose-600">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)