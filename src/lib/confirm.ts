export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}

type Listener = (opts: ConfirmOptions, resolve: (ok: boolean) => void) => void

let listener: Listener | null = null

export function registerConfirmListener(fn: Listener | null) {
  listener = fn
}

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(window.confirm(opts.description ?? opts.title))
      return
    }
    listener(opts, resolve)
  })
}
