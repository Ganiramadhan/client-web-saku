import { useEffect, useState } from 'react'
import { HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2'
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={() => finish(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        <button
          type="button"
          onClick={() => finish(false)}
          className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <HiOutlineXMark className="h-4 w-4" />
        </button>
        <div className="flex gap-4 p-6">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
              tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-brand-100 text-brand-600',
            )}
          >
            <HiOutlineExclamationTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">{opts.title}</h3>
            {opts.description ? (
              <p className="mt-1 text-sm text-slate-600">{opts.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
          <Button variant="outline" onClick={() => finish(false)}>
            {opts.cancelLabel ?? 'Batal'}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => finish(true)}
          >
            {opts.confirmLabel ?? 'Konfirmasi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
