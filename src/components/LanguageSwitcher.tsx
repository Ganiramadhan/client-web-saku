import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'


function FlagID({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="8" fill="#E70011" />
      <rect y="8" width="24" height="8" fill="#fff" />
    </svg>
  )
}

function FlagUS({ className }: { className?: string }) {
  const stripe = 16 / 13
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="16" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={i * stripe} width="24" height={stripe} fill="#fff" />
      ))}
      <rect width="10" height={stripe * 7} fill="#3C3B6E" />
    </svg>
  )
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const opts = [
    { v: 'id', label: 'ID', Flag: FlagID },
    { v: 'en', label: 'EN', Flag: FlagUS },
  ] as const
  const activeIdx = opts.findIndex((o) => o.v === locale)

  return (
    <div
      role="tablist"
      aria-label="Language"
      className={cn(
        'relative inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 p-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      {/* sliding active indicator */}
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow ring-1 ring-slate-200 transition-transform duration-200 ease-out',
          activeIdx === 1 && 'translate-x-full',
        )}
      />
      {opts.map(({ v, label, Flag }) => (
        <button
          key={v}
          type="button"
          role="tab"
          onClick={() => setLocale(v)}
          aria-selected={locale === v}
          aria-pressed={locale === v}
          title={v === 'id' ? 'Bahasa Indonesia' : 'English'}
          className={cn(
            'relative z-10 inline-flex min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
            locale === v ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Flag className="h-3 w-4 overflow-hidden rounded-[2px] ring-1 ring-black/10" />
          {label}
        </button>
      ))}
    </div>
  )
}
