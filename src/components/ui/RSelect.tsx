import { type ReactNode, useId } from 'react'
import ReactSelect, {
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

const styles: StylesConfig<SelectOption<unknown>, false> = {
  control: (base, s) => ({
    ...base,
    minHeight: 38,
    borderRadius: 8,
    borderColor: s.isFocused ? 'rgb(99 102 241)' : 'rgb(203 213 225)',
    boxShadow: s.isFocused ? '0 0 0 2px rgb(99 102 241 / 0.25)' : 'none',
    backgroundColor: 'white',
    fontSize: 14,
    transition: 'all 0.15s',
    ':hover': { borderColor: s.isFocused ? 'rgb(99 102 241)' : 'rgb(148 163 184)' },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 12px 32px -8px rgb(15 23 42 / 0.18)',
    border: '1px solid rgb(226 232 240)',
    zIndex: 50,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
  option: (base, s) => ({
    ...base,
    fontSize: 14,
    backgroundColor: s.isSelected
      ? 'rgb(99 102 241)'
      : s.isFocused
      ? 'rgb(238 242 255)'
      : 'transparent',
    color: s.isSelected ? 'white' : 'rgb(15 23 42)',
    cursor: 'pointer',
    paddingTop: 8,
    paddingBottom: 8,
  }),
  singleValue: (base) => ({ ...base, color: 'rgb(15 23 42)' }),
  placeholder: (base) => ({ ...base, color: 'rgb(148 163 184)' }),
  input: (base) => ({ ...base, color: 'rgb(15 23 42)' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: 'rgb(100 116 139)', padding: 4 }),
  clearIndicator: (base) => ({ ...base, color: 'rgb(100 116 139)', padding: 4 }),
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
  const current = options.find((o) => o.value === value) ?? null
  return (
    <label className="block" htmlFor={id}>
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <ReactSelect<SelectOption<V>, false>
        inputId={id}
        value={current}
        onChange={(opt) => onChange((opt?.value ?? null) as V | null)}
        options={options}
        isClearable={clearable}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
        styles={styles as StylesConfig<SelectOption<V>, false>}
        formatOptionLabel={(opt) =>
          opt.description ? (
            <div>
              <div className="text-sm">{opt.label}</div>
              <div className="text-xs text-slate-500">{opt.description}</div>
            </div>
          ) : (
            opt.label
          )
        }
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
