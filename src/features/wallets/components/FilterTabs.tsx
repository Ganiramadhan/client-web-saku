import { HiOutlineSquares2X2 } from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import type { WalletType } from '@/types/api'
import { TYPE_THEME, WALLET_TYPE_OPTIONS } from '../utils/constants'

type FilterTab = 'all' | WalletType

export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: FilterTab; label: string; count: number }[]
  active: FilterTab
  onChange: (value: FilterTab) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isAll = tab.key === 'all'
        const theme = !isAll ? TYPE_THEME[tab.key as WalletType] : null
        const dot = theme?.dot ?? ''

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              active === tab.key
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200/50'
                : 'border-white/80 bg-white/62 text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white hover:text-slate-950',
            )}
          >
            {isAll ? (
              <HiOutlineSquares2X2 className="h-3.5 w-3.5" />
            ) : (
              <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
            )}

            {tab.label}

            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                active === tab.key ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600',
              )}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { WALLET_TYPE_OPTIONS }
