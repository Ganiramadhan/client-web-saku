import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { HiOutlineArrowRight, HiOutlineCheckCircle } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { login } from '@/features/auth/api'
import {
  AuthShell,
  Divider,
  FieldEmail,
  FieldPassword,
  formatCountdown,
  sanitizeEmail,
} from '@/features/auth/components/AuthFormParts'
import { GoogleButton } from '@/features/auth/components/GoogleButton'
import { TurnstileWidget, isTurnstileEnabled } from '@/features/auth/components/TurnstileWidget'
import { useLocale, useT } from '@/i18n'
import { getErrorStatus, getRetryAfterSeconds, toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/authStore'

const LOGIN_RETRY_KEY = 'saku-login-retry-until'

export function LoginPage() {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [retryUntil, setRetryUntil] = useState<number | null>(() => {
    const saved = Number(window.localStorage.getItem(LOGIN_RETRY_KEY) || 0)
    return saved > Date.now() ? saved : null
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!retryUntil) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [retryUntil])

  useEffect(() => {
    if (!retryUntil) {
      window.localStorage.removeItem(LOGIN_RETRY_KEY)
      return
    }
    if (retryUntil <= now) {
      setRetryUntil(null)
      window.localStorage.removeItem(LOGIN_RETRY_KEY)
    }
  }, [now, retryUntil])

  const from = (location.state as { from?: string } | null)?.from ?? '/app'
  const redirect = (data: { token: string; user: { role: string } }) => {
    setRetryUntil(null)
    window.localStorage.removeItem(LOGIN_RETRY_KEY)
    setSession(data.token, data.user as never, remember)
    toast.success(locale === 'id' ? 'Selamat datang kembali.' : 'Welcome back.')
    navigate(from === '/login' ? '/app' : from, { replace: true })
  }

  const m = useMutation({
    mutationFn: login,
    onSuccess: redirect,
    onError: (error) => {
      if (getErrorStatus(error) === 429) {
        const retryAfter = getRetryAfterSeconds(error) ?? 60
        const until = Date.now() + retryAfter * 1000
        setRetryUntil(until)
        window.localStorage.setItem(LOGIN_RETRY_KEY, String(until))
        toast.error(
          locale === 'id' ? 'Terlalu banyak percobaan login. Mohon tunggu.' : 'Too many login attempts. Please wait.',
          locale === 'id' ? 'Login diblokir sementara' : 'Login temporarily blocked',
        )
        return
      }
      toast.error(toErrorMessage(error) || t.auth.loginFailedMessage, t.auth.loginFailedTitle)
    },
  })

  const retryRemaining = retryUntil ? Math.max(0, Math.ceil((retryUntil - now) / 1000)) : 0

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (retryRemaining > 0) return
    const cleanEmail = sanitizeEmail(email)
    setEmail(cleanEmail)
    if (isTurnstileEnabled() && !turnstileToken) {
      toast.error(locale === 'id' ? 'Selesaikan verifikasi keamanan dulu.' : 'Please complete the security verification.')
      return
    }
    m.mutate({ email: cleanEmail, password, turnstile_token: turnstileToken })
  }

  return (
    <AuthShell mode="login" title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FieldEmail value={email} onChange={setEmail} label={t.auth.email} />
        <FieldPassword
          value={password}
          onChange={setPassword}
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
          label={t.auth.password}
        />

        <div className="flex items-center justify-between gap-3 text-xs">
          <label className="group inline-flex cursor-pointer items-center gap-2 text-slate-600">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white shadow-sm transition checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <HiOutlineCheckCircle className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" />
            </span>
            {t.auth.rememberMe}
          </label>
          <Link to="/forgot-password" className="font-semibold text-blue-700 hover:underline">
            {t.auth.forgotPassword}
          </Link>
        </div>

        <TurnstileWidget onVerify={setTurnstileToken} />

        <Button
          type="submit"
          className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
          loading={m.isPending}
          disabled={retryRemaining > 0 || (isTurnstileEnabled() && !turnstileToken)}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {retryRemaining > 0 ? `Coba lagi dalam ${formatCountdown(retryRemaining)}` : t.auth.submitLogin}
        </Button>
      </form>

      <Divider label={t.auth.dividerOrContinue} />
      <GoogleButton mode="login" onSuccess={redirect} />

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.noAccount}{' '}
        <Link to="/register" className="font-semibold text-blue-700 hover:underline">
          {t.auth.submitRegister}
        </Link>
      </p>
    </AuthShell>
  )
}
