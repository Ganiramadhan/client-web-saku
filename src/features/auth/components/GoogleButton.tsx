import { useEffect, useRef, useState } from 'react'
import { loginWithGoogle } from '@/features/auth/api'
import { useLocale, useT } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''

interface GISCredential {
  credential: string
}

interface GISWindow {
  google?: {
    accounts: {
      id: {
        initialize: (cfg: { client_id: string; callback: (r: GISCredential) => void }) => void
        renderButton: (
          el: HTMLElement,
          opts: {
            theme?: string
            size?: string
            width?: number
            shape?: string
            text?: string
            logo_alignment?: string
          },
        ) => void
        cancel: () => void
      }
    }
  }
}

export function GoogleButton({
  mode,
  onSuccess,
  className,
}: {
  mode: 'login' | 'register'
  onSuccess: (data: { token: string; user: { role: string } }) => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onSuccessRef = useRef(onSuccess)
  const [pending, setPending] = useState(false)
  const t = useT()
  const { locale } = useLocale()

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return
    const container = ref.current

    const existing = Array.from(document.getElementsByTagName('script')).find((script) =>
      script.src?.includes('accounts.google.com/gsi/client'),
    )
    if (!existing) {
      const script = document.createElement('script')
      script.src = `https://accounts.google.com/gsi/client?hl=${locale}`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    let cancelled = false
    let rendered = false
    const tryInit = () => {
      const w = window as unknown as GISWindow
      if (!w.google?.accounts?.id) {
        if (!cancelled) window.setTimeout(tryInit, 250)
        return
      }
      if (cancelled || rendered) return
      rendered = true
      container.replaceChildren()
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            setPending(true)
            onSuccessRef.current(await loginWithGoogle(resp.credential, mode))
          } catch (err) {
            const msg = toErrorMessage(err)
            const title = mode === 'login' ? t.auth.googleLoginFailedTitle : t.auth.googleRegisterFailedTitle
            const fallback = mode === 'login' ? t.auth.googleLoginFailedMessage : t.auth.googleRegisterFailedMessage
            toast.error(mode === 'login' && msg.includes('belum terdaftar') ? fallback : msg || fallback, title)
          } finally {
            setPending(false)
          }
        },
      })
      w.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: Math.min(container.offsetWidth || 360, 400),
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
      })
    }
    tryInit()
    return () => {
      cancelled = true
      ;(window as unknown as GISWindow).google?.accounts?.id?.cancel()
    }
  }, [locale, mode, t.auth.googleLoginFailedMessage, t.auth.googleLoginFailedTitle, t.auth.googleRegisterFailedMessage, t.auth.googleRegisterFailedTitle])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID untuk mengaktifkan login Google"
        className={cn(
          'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/80 bg-white/80 text-sm font-semibold text-slate-400 shadow-sm backdrop-blur-xl',
          className,
        )}
      >
        <GoogleIcon />
      </button>
    )
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div ref={ref} className="flex w-full justify-center" />
      {pending ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-white/80 text-xs font-medium text-slate-600">
          {t.auth.connectingGoogle}
        </div>
      ) : null}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}
