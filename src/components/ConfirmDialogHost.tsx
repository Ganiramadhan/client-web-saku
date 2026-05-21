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
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={() => finish(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/90 bg-white shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5">
        <button
          type="button"
          onClick={() => finish(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <HiOutlineXMark className="h-4 w-4" />
        </button>
        <div className={cn('h-1.5', isDanger ? 'bg-rose-600' : 'bg-brand-600')} />
        <div className="flex gap-4 p-6">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1',
              isDanger
                ? 'bg-rose-50 text-rose-600 ring-rose-100'
                : 'bg-brand-50 text-brand-700 ring-brand-100',
            )}
          >
            {isDanger ? (
              <HiOutlineExclamationTriangle className="h-5 w-5" />
            ) : (
              <HiOutlineCheckCircle className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="pr-6 text-base font-extrabold text-slate-950">{opts.title}</h3>
            {opts.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{opts.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:flex-row sm:justify-end">
          {!isAlert ? (
            <Button variant="outline" className="border-slate-200 !bg-white text-slate-700" onClick={() => finish(false)}>
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
