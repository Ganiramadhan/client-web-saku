import { useEffect, useRef, useState } from 'react'
import { HiOutlineChevronDown } from 'react-icons/hi2'
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇺🇸' }
]
export function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const { locale, setLocale } = useLocale()
  const active = LANGUAGES.find((lang) => lang.code === locale) ?? LANGUAGES[0]
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change language"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2',
          'text-xs font-bold text-slate-600 transition-all duration-300',
          'hover:-translate-y-0.5 hover:text-blue-700 active:translate-y-0',
          open && 'text-blue-700'
        )}
        style={{
          background: open
            ? 'linear-gradient(135deg, rgba(239,246,255,0.96), rgba(255,255,255,0.88))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.74), rgba(248,250,252,0.56))',
          border: open
            ? '1px solid rgba(96,165,250,0.75)'
            : '1px solid rgba(226,232,240,0.9)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          boxShadow: open
            ? '0 14px 36px rgba(37,99,235,0.16), inset 0 1px 0 rgba(255,255,255,0.95)'
            : '0 8px 22px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
        }}
      >
        <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-400/10" />

        <span className="relative grid h-6 w-6 place-items-center rounded-full bg-white/85 text-sm shadow-sm ring-1 ring-slate-200/70">
          {active.flag}
        </span>

        <span className="relative tracking-[0.14em]">
          {active.code.toUpperCase()}
        </span>

        <HiOutlineChevronDown
          className={cn(
            'relative h-3.5 w-3.5 text-slate-400 transition-all duration-300 group-hover:text-blue-600',
            open && 'rotate-180 text-blue-600'
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-[1.4rem] p-2',
            'origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200'
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
            backdropFilter: 'blur(34px) saturate(180%)',
            WebkitBackdropFilter: 'blur(34px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.96)',
            boxShadow:
              '0 28px 80px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative px-3 pb-2 pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Select Language
            </p>
          </div>

          <div className="relative space-y-1">
            {LANGUAGES.map((lang) => {
              const isActive = active.code === lang.code

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code as typeof locale)
                    setOpen(false)
                  }}
                  className={cn(
                    'group/item flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm',
                    'transition-all duration-300',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/70'
                      : 'text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-2xl text-base transition-all duration-300',
                      isActive
                        ? 'bg-white/20 ring-1 ring-white/20'
                        : 'bg-slate-50 ring-1 ring-slate-200/70 group-hover/item:bg-blue-50'
                    )}
                  >
                    {lang.flag}
                  </span>

                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-bold">
                      {lang.label}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.16em]',
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      )}
                    >
                      {lang.code}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full transition-all duration-300',
                      isActive
                        ? 'scale-100 bg-white/20 opacity-100'
                        : 'scale-75 opacity-0 group-hover/item:scale-100 group-hover/item:opacity-100'
                    )}
                  >
                    {isActive ? (
                      <RiCheckLine className="h-4 w-4 text-white" />
                    ) : (
                      <RiArrowRightLine className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
