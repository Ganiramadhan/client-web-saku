import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
} from 'react-icons/hi2'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui'
import { useT } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import { login, register, loginWithGoogle } from '@/features/auth/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''


export function LoginPage() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/app'
  const redirect = (data: { token: string; user: { role: string } }) => {
    setSession(data.token, data.user as never)
    navigate(from === '/login' ? '/app' : from, { replace: true })
  }

  const m = useMutation({
    mutationFn: login,
    onSuccess: redirect,
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    m.mutate({ email, password })
  }

  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <GoogleButton onSuccess={redirect} />
      <Divider label="atau lanjutkan dengan email" />

      <form onSubmit={onSubmit} className="space-y-4">
        <FieldEmail value={email} onChange={setEmail} label={t.auth.email} />
        <FieldPassword
          value={password}
          onChange={setPassword}
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
          label={t.auth.password}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Ingat saya
          </label>
          <a href="#" className="font-semibold text-brand-700 hover:underline">
            {t.auth.forgotPassword}
          </a>
        </div>

        {m.error ? <ErrorBanner message={toErrorMessage(m.error)} /> : null}

        <Button
          type="submit"
          className="h-11 w-full text-sm"
          loading={m.isPending}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {t.auth.submitLogin}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.noAccount}{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:underline">
          {t.auth.submitRegister}
        </Link>
      </p>
    </AuthShell>
  )
}


export function RegisterPage() {
  const t = useT()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const redirect = (data: { token: string; user: { role: string } }) => {
    setSession(data.token, data.user as never)
    navigate('/app', { replace: true })
  }

  const m = useMutation({
    mutationFn: () => register({ name, email, password }),
    onSuccess: redirect,
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    m.mutate()
  }

  return (
    <AuthShell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <GoogleButton onSuccess={redirect} />
      <Divider label="atau daftar dengan email" />

      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          icon={HiOutlineUser}
          label={t.auth.name}
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />
        <FieldEmail value={email} onChange={setEmail} label={t.auth.email} />
        <FieldPassword
          value={password}
          onChange={setPassword}
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
          label={t.auth.password}
          minLength={6}
        />

        {m.error ? <ErrorBanner message={toErrorMessage(m.error)} /> : null}

        <Button
          type="submit"
          className="h-11 w-full text-sm"
          loading={m.isPending}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {t.auth.submitRegister}
        </Button>

        <p className="text-center text-[11px] text-slate-400">
          Dengan mendaftar Anda menyetujui Syarat & Kebijakan Privasi kami.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.hasAccount}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          {t.auth.submitLogin}
        </Link>
      </p>
    </AuthShell>
  )
}

/* ───────────────────────── Google button ───────────────────────── */

interface GISCredential { credential: string }
interface GISWindow {
  google?: {
    accounts: {
      id: {
        initialize: (cfg: { client_id: string; callback: (r: GISCredential) => void }) => void
        renderButton: (
          el: HTMLElement,
          opts: { theme?: string; size?: string; width?: number; shape?: string; text?: string; logo_alignment?: string },
        ) => void
        prompt: () => void
      }
    }
  }
}

function GoogleButton({
  onSuccess,
  className,
}: {
  onSuccess: (data: { token: string; user: { role: string } }) => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return
    let cancelled = false
    const tryInit = () => {
      const w = window as unknown as GISWindow
      if (!w.google?.accounts?.id) {
        if (!cancelled) setTimeout(tryInit, 250)
        return
      }
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            setPending(true)
            const data = await loginWithGoogle(resp.credential)
            onSuccess(data)
          } catch (err) {
            toast.error(toErrorMessage(err))
          } finally {
            setPending(false)
          }
        },
      })
      const width = Math.min(ref.current!.offsetWidth || 360, 400)
      w.google.accounts.id.renderButton(ref.current!, {
        theme: 'outline',
        size: 'large',
        width,
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
      })
    }
    tryInit()
    return () => {
      cancelled = true
    }
  }, [onSuccess])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID untuk mengaktifkan login Google"
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-400',
          className,
        )}
      >
        <GoogleIcon />
        Lanjutkan dengan Google
      </button>
    )
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div ref={ref} className="flex w-full justify-center" />
      {pending ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-white/80 text-xs font-medium text-slate-600">
          Menghubungkan Google…
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


function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
        <Link
          to="/"
          className="text-xs font-semibold text-slate-500 hover:text-brand-700"
        >
          ← Kembali ke Beranda
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SAKU Finance · v1.0
      </footer>
    </div>
  )
}


function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
      {message}
    </div>
  )
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ComponentType<{ className?: string }>
  label: string
  rightSlot?: React.ReactNode
}

function Field({ icon: Icon, label, rightSlot, className, ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          {...rest}
          className={cn(
            'h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm shadow-sm transition placeholder:text-slate-400',
            'hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
            rightSlot && 'pr-10',
            className,
          )}
        />
        {rightSlot ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>
        ) : null}
      </div>
    </label>
  )
}

function FieldEmail({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <Field
      icon={HiOutlineEnvelope}
      label={label}
      type="email"
      required
      autoComplete="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="kamu@email.com"
    />
  )
}

function FieldPassword({
  value,
  onChange,
  show,
  onToggle,
  label,
  minLength,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  label: string
  minLength?: number
}) {
  return (
    <Field
      icon={HiOutlineLockClosed}
      label={label}
      type={show ? 'text' : 'password'}
      required
      minLength={minLength ?? 6}
      autoComplete={minLength ? 'new-password' : 'current-password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="••••••••"
      rightSlot={
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
        </button>
      }
    />
  )
}
