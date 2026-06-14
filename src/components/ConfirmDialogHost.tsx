import { useEffect, useState } from 'react'
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import {
  registerConfirmListener,
  type ConfirmOptions,
} from '@/lib/confirm'
import { cn } from '@/lib/utils'

export function ConfirmDialogHost() {
  const [state, setState] = useState<{
    opts: ConfirmOptions
    resolve: (ok: boolean) => void
  } | null>(null)

  useEffect(() => {
    registerConfirmListener((opts, resolve) => setState({ opts, resolve }))
    return () => registerConfirmListener(null)
  }, [])

  if (!state) return null
  const { opts, resolve } = state

  const finish = (ok: boolean) => {
    resolve(ok)
    setState(null)
  }

  const tone = opts.tone ?? 'danger'

  const isDanger = tone === 'danger'
  const isAlert = opts.mode === 'alert'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-[#17120f]/35 backdrop-blur-sm"
        onClick={() => finish(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-[#17120f]/12 bg-[#fffaf6] shadow-2xl shadow-[#17120f]/18 ring-1 ring-[#17120f]/5">
        <button
          type="button"
          onClick={() => finish(false)}
          className="absolute right-3 top-3 rounded-xl p-1.5 text-[#4f4540]/55 transition hover:bg-white hover:text-[#17120f]"
          aria-label="Close"
        >
          <HiOutlineXMark className="h-4 w-4" />
        </button>
        <div className={cn('h-1.5', isDanger ? 'bg-[#ff9d8d]' : 'bg-brand-300')} />
        <div className="flex gap-4 p-6">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1',
              isDanger
                ? 'bg-[#ffe4dc] text-[#b4533f] ring-brand-100'
                : 'bg-[#fddf82]/70 text-[#17120f] ring-[#17120f]/10',
            )}
          >
            {isDanger ? (
              <HiOutlineExclamationTriangle className="h-5 w-5" />
            ) : (
              <HiOutlineCheckCircle className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="pr-6 text-base font-black text-[#17120f]">{opts.title}</h3>
            {opts.description ? (
              <p className="mt-2 text-sm leading-6 text-[#4f4540]">{opts.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#17120f]/10 bg-white/42 px-6 py-4 sm:flex-row sm:justify-end">
          {!isAlert ? (
            <Button variant="outline" className="!bg-white text-[#4f4540]" onClick={() => finish(false)}>
              {opts.cancelLabel ?? 'Batal'}
            </Button>
          ) : null}
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={() => finish(true)}
          >
            {opts.confirmLabel ?? (isAlert ? 'OK' : 'Konfirmasi')}
          </Button>
        </div>
      </div>
    </div>
  )
}
