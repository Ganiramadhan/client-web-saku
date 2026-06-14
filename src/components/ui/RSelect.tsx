import { type ReactNode, useId } from 'react'
import ReactSelect, {
  type FormatOptionLabelMeta,
  type GroupBase,
  type Props as RSProps,
  type StylesConfig,
} from 'react-select'

export interface SelectOption<V = string> {
  value: V
  label: string
  description?: string
  isDisabled?: boolean
}

interface RSelectProps<V = string>
  extends Omit<
    RSProps<SelectOption<V>, false, GroupBase<SelectOption<V>>>,
    'value' | 'onChange' | 'options'
  > {
  label?: ReactNode
  error?: string
  hint?: string
  value: V | null | undefined
  options: SelectOption<V>[]
  onChange: (value: V | null) => void
  clearable?: boolean
}

const hasDescriptionOption = <V,>(options: SelectOption<V>[]) =>
  options.some((option) => Boolean(option.description))

const createStyles = <V,>(
  hasDescription: boolean,
): StylesConfig<SelectOption<V>, false> => ({
  control: (base, s) => ({
    ...base,
    minHeight: hasDescription ? 54 : 44,
    borderRadius: 16,
    borderColor: s.isFocused ? 'rgba(255, 111, 97, 0.55)' : 'rgba(23, 18, 15, 0.12)',
    boxShadow: s.isFocused
      ? '0 0 0 3px rgba(255, 111, 97, 0.16), 0 12px 28px rgba(23, 18, 15, 0.06)'
      : '0 8px 22px rgba(23, 18, 15, 0.035)',
    backgroundColor: 'rgba(255,250,246,0.86)',
    backdropFilter: 'blur(18px) saturate(170%)',
    WebkitBackdropFilter: 'blur(18px) saturate(170%)',
    fontSize: 14,
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    ':hover': {
      borderColor: s.isFocused ? 'rgba(255, 111, 97, 0.62)' : 'rgba(23, 18, 15, 0.20)',
    },
  }),

  valueContainer: (base) => ({
    ...base,
    padding: hasDescription ? '6px 12px' : '2px 8px',
  }),

  menu: (base) => ({
    ...base,
    marginTop: 6,
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid rgba(23, 18, 15, 0.12)',
    backgroundColor: 'rgba(255,250,246,0.98)',
    boxShadow: '0 20px 42px rgba(23, 18, 15, 0.12)',
    zIndex: 9999,
  }),

  menuList: (base) => ({
    ...base,
    padding: 6,
    backgroundColor: 'rgb(255 250 246)',
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),

  option: (base, s) => ({
    ...base,
    borderRadius: hasDescription ? 14 : 12,
    fontSize: 14,
    backgroundColor: s.isSelected
      ? 'rgb(255 111 97)'
      : s.isFocused
        ? 'rgb(255 243 238)'
        : 'transparent',
    color: s.isSelected ? 'rgb(23 18 15)' : 'rgb(23 18 15)',
    cursor: s.isDisabled ? 'not-allowed' : 'pointer',
    paddingTop: hasDescription ? 12 : 9,
    paddingBottom: hasDescription ? 12 : 9,
    paddingLeft: hasDescription ? 14 : 12,
    paddingRight: hasDescription ? 14 : 12,
    minHeight: hasDescription ? 68 : undefined,
    transition: 'all 0.15s ease',
    opacity: s.isDisabled ? 0.5 : 1,
    ':active': {
      backgroundColor: s.isSelected ? 'rgb(255 111 97)' : 'rgb(255 228 220)',
    },
  }),

  singleValue: (base) => ({
    ...base,
    color: 'rgb(23 18 15)',
  }),

  placeholder: (base) => ({
    ...base,
    color: 'rgba(79, 69, 64, 0.55)',
  }),

  input: (base) => ({
    ...base,
    color: 'rgb(23 18 15)',
  }),

  indicatorSeparator: () => ({
    display: 'none',
  }),

  dropdownIndicator: (base) => ({
    ...base,
    color: 'rgba(79, 69, 64, 0.72)',
    padding: 6,
  }),

  clearIndicator: (base) => ({
    ...base,
    color: 'rgba(79, 69, 64, 0.72)',
    padding: 6,
  }),
})

function renderOptionLabel<V>(
  option: SelectOption<V>,
  meta: FormatOptionLabelMeta<SelectOption<V>>,
) {
  const isValue = meta.context === 'value'
  const isSelected = meta.selectValue.some((item) => item.value === option.value)

  if (!option.description) {
    return option.label
  }

  if (isValue) {
    return (
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {option.label}
        </div>
        <div className="truncate text-xs leading-5 text-slate-500">
          {option.description}
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div
        className={
          isSelected
            ? 'text-sm font-semibold text-white'
            : 'text-sm font-semibold text-slate-950'
        }
      >
        {option.label}
      </div>

      <div
        className={
          isSelected
            ? 'mt-1 text-xs leading-5 text-white/85'
            : 'mt-1 text-xs leading-5 text-slate-500'
        }
      >
        {option.description}
      </div>
    </div>
  )
}

export function RSelect<V extends string | number = string>({
  label,
  error,
  hint,
  value,
  onChange,
  options,
  clearable,
  ...rest
}: RSelectProps<V>) {
  const id = useId()
  const current = options.find((option) => option.value === value) ?? null
  const hasDescription = hasDescriptionOption(options)

  return (
    <label className="block" htmlFor={id}>
      {label ? (
        <span className="mb-1.5 block text-xs font-black text-[#4f4540]">
          {label}
        </span>
      ) : null}

      <ReactSelect<SelectOption<V>, false, GroupBase<SelectOption<V>>>
        inputId={id}
        value={current}
        onChange={(option) => onChange((option?.value ?? null) as V | null)}
        options={options}
        isClearable={clearable}
        isSearchable={hasDescription ? false : rest.isSearchable}
        isOptionDisabled={(option) => Boolean(option.isDisabled)}
        menuPortalTarget={
          typeof document !== 'undefined' ? document.body : undefined
        }
        menuPosition="fixed"
        styles={createStyles<V>(hasDescription)}
        formatOptionLabel={hasDescription ? renderOptionLabel : undefined}
        {...rest}
      />

      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}
