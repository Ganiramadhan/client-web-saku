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
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import {
  RiArrowUpLine,
  RiChatSmile3Line,
  RiShieldCheckLine,
  RiSparklingLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui'
import { useT, useLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import { forgotPassword, login, register, loginWithGoogle, resetPassword } from '@/features/auth/api'
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
  const [remember, setRemember] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/app'
  const redirect = (data: { token: string; user: { role: string } }) => {
    setSession(data.token, data.user as never, remember)
    navigate(from === '/login' ? '/app' : from, { replace: true })
  }

  const m = useMutation({
    mutationFn: login,
    onSuccess: redirect,
    onError: () => toast.error(t.auth.loginFailedMessage, t.auth.loginFailedTitle),
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    m.mutate({ email, password })
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

        <Button
          type="submit"
          className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
          loading={m.isPending}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {t.auth.submitLogin}
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

  useEffect(() => {
    if (!m.error) return
    const raw = toErrorMessage(m.error) || ''
    const l = raw.toLowerCase()
    const alreadyIndicators = ['already', 'already exists', 'already registered', 'exists', 'sudah terdaftar', 'terdaftar', 'sudah kedaftar', 'resource already exists']
    const isAlready = alreadyIndicators.some((s) => l.includes(s))
    if (isAlready) {
      toast.error(t.auth.emailAlreadyUsedMessage, t.auth.emailAlreadyUsedTitle)
    } else {
      toast.error(raw || t.auth.registerFailedMessage, t.auth.registerFailedTitle)
    }
  }, [m.error])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    m.mutate()
  }

  return (
    <AuthShell mode="register" title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          icon={HiOutlineUser}
          label={t.auth.name}
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.auth.placeholders.name}
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

        <Button
          type="submit"
          className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
          loading={m.isPending}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {t.auth.submitRegister}
        </Button>

        <p className="text-center text-[11px] text-slate-400">{t.auth.registerConsent}</p>
      </form>

      <Divider label={t.auth.dividerOrRegister} />
      <GoogleButton mode="register" onSuccess={redirect} />

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.hasAccount}{' '}
        <Link to="/login" className="font-semibold text-blue-700 hover:underline">
          {t.auth.submitLogin}
        </Link>
      </p>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const t = useT()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!otpSent || otpVerified) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [otpSent, otpVerified])
  const m = useMutation({
    mutationFn: () => forgotPassword(email.trim()),
    onSuccess: () => {
      setOtpSent(true)
      setOtp('')
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000)
      setResendAt(Date.now() + 60 * 1000)
      toast.success(t.auth.otpSentMessage, t.auth.otpSentTitle)
    },
    onError: (error) => {
      toast.error(toErrorMessage(error) || t.auth.emailNotRegisteredMessage, t.auth.emailNotRegisteredTitle)
    },
  })
  const verifyM = useMutation({
    mutationFn: () => resetPassword({ email: email.trim(), otp: otp.trim(), new_password: '' }),
    onSuccess: () => {
      setOtpVerified(true)
      toast.success(t.auth.otpValidMessage, t.auth.otpValidTitle)
    },
    onError: (error) => {
      const msg = toErrorMessage(error) || `${t.auth.otpInvalidMessage}`
      toast.error(msg || t.auth.otpInvalidMessage, t.auth.otpInvalidTitle)
    },
  })
  const resetM = useMutation({
    mutationFn: () => resetPassword({ email: email.trim(), otp: otp.trim(), new_password: newPassword }),
    onSuccess: () => {
      toast.success(t.auth.passwordUpdatedMessage, t.auth.passwordUpdatedTitle)
      navigate('/login', { replace: true })
    },
    onError: (error) => {
      const msg = toErrorMessage(error)
      toast.error(msg || t.auth.passwordUpdateFailedMessage, t.auth.passwordUpdateFailedTitle)
    },
  })
  const strength = scorePasswordStrength(newPassword)
  const passwordError = getPasswordValidationError(t, newPassword, confirmPassword)
  const otpRemaining = otpExpiresAt ? Math.max(0, Math.ceil((otpExpiresAt - now) / 1000)) : 0
  const resendRemaining = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0
  const isSubmitting = m.isPending || verifyM.isPending || resetM.isPending
  const submitDisabled = isSubmitting || (otpSent && !otpVerified && otp.trim().length !== 6)
  const generatePassword = () => {
    const password = generateStrongPassword()
    setNewPassword(password)
    setConfirmPassword(password)
    setShowPw(true)
    setShowConfirmPw(true)
  }
  return (
    <AuthShell mode="forgot" title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!otpSent) {
            if (!email.trim()) {
                toast.error(t.auth.emailRequiredMessage, t.auth.emailRequiredTitle)
              return
            }
            m.mutate()
            return
          }
          if (!otpVerified) {
            if (otp.trim().length !== 6) {
              toast.error(t.auth.otpIncompleteMessage, t.auth.otpIncompleteTitle)
              return
            }
            verifyM.mutate()
            return
          }
          if (passwordError) {
            toast.error(passwordError || t.auth.passwordMismatchMessage, t.auth.passwordMismatchTitle)
            return
          }
          resetM.mutate()
        }}
      >
        {!otpVerified ? (
          <FieldEmail value={email} onChange={setEmail} label={t.auth.email} disabled={otpSent} />
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{t.auth.otpVerifiedLabel}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800">{email}</p>
          </div>
        )}
        {otpSent && !otpVerified ? (
          <>
            <Field
              icon={HiOutlineShieldCheck}
              label={t.auth.otpCodeLabel}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={t.auth.otpPlaceholder}
              inputMode="numeric"
              maxLength={6}
            />
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-800">{t.auth.otpExpiresPrefix} {formatCountdown(otpRemaining)}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-blue-700/80">{t.auth.otpUseLatest}</p>
                </div>
                <button
                  type="button"
                  disabled={m.isPending || resendRemaining > 0}
                  onClick={() => {
                    if (!email.trim()) {
                        toast.error(t.auth.emailRequiredMessage, t.auth.emailRequiredTitle)
                      return
                    }
                    m.mutate()
                  }}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {resendRemaining > 0 ? t.auth.resendOtpLabel.replace('{time}', formatCountdown(resendRemaining)) : t.auth.sendOtp}
                </button>
              </div>
            </div>
          </>
        ) : null}
        {otpVerified ? (
          <>
            <FieldPassword
              value={newPassword}
              onChange={setNewPassword}
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              label={t.auth.passwordNewLabel || 'Password Baru'}
              minLength={8}
            />
            <FieldPassword
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPw}
              onToggle={() => setShowConfirmPw((v) => !v)}
              label={t.auth.passwordConfirmLabel || 'Konfirmasi Password Baru'}
              minLength={8}
              placeholder={t.auth.placeholders.password}
            />
          <PasswordPolicyPanel
            score={strength}
            onGenerate={generatePassword}
          />
          </>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
          loading={isSubmitting}
          disabled={submitDisabled}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {!otpSent ? t.auth.sendOtp : otpVerified ? t.auth.resetPassword : t.auth.verifyOtp}
        </Button>
      </form>

        <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.alreadyCanAccessSentence || 'Sudah bisa mengakses akun?'}{' '}
        <Link to="/login" className="font-semibold text-blue-700 hover:underline">
          {t.auth.submitLogin}
        </Link>
      </p>
    </AuthShell>
  )
}

function getPasswordValidationError(t: Dict, password: string, confirmPassword: string): string | null {
  if (password.length < 8) return (t.auth.passwordNewTooShort || 'Password baru minimal {n} karakter.').replace('{n}', '8')
  if (!/[A-Z]/.test(password)) return t.auth.passwordNewRequireUpper || 'Password baru harus mengandung huruf besar.'
  if (!/[a-z]/.test(password)) return t.auth.passwordNewRequireLower || 'Password baru harus mengandung huruf kecil.'
  if (!/\d/.test(password)) return t.auth.passwordNewRequireDigit || 'Password baru harus mengandung angka.'
  if (!confirmPassword) return t.auth.passwordConfirmRequired || 'Konfirmasi password baru wajib diisi.'
  if (password !== confirmPassword) return t.auth.passwordConfirmMismatch || 'Konfirmasi password tidak cocok.'
  return null
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function generateStrongPassword(): string {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789']
  const all = groups.join('')
  const chars = groups.map((group) => group[Math.floor(Math.random() * group.length)])
  while (chars.length < 14) chars.push(all[Math.floor(Math.random() * all.length)])
  return chars.sort(() => Math.random() - 0.5).join('')
}

function scorePasswordStrength(pw: string): number {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (pw.length >= 16) score++
  return Math.min(4, Math.max(0, score - 1))
}

function PasswordStrengthMeter({ score }: { score: number }) {
  const labels = ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat']
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']
  return (
    <div className="min-w-0 flex-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full transition', i <= score ? colors[score] : 'bg-slate-200')} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-500">
        Kekuatan: <span className="text-slate-700">{labels[score]}</span>
      </p>
    </div>
  )
}

function PasswordPolicyPanel({
  score,
  onGenerate,
}: {
  score: number
  onGenerate: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Keamanan Password</p>
          <PasswordStrengthMeter score={score} />
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-200 active:scale-[0.98]"
        >
          <HiOutlineSparkles className="h-4 w-4" />
          Generate
        </button>
      </div>
    </div>
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
    // ensure Google Identity script uses current locale (hl param)
    try {
      const existing = Array.from(document.getElementsByTagName('script')).find((s) => s.src?.includes('accounts.google.com/gsi/client'))
      const desiredSrc = `https://accounts.google.com/gsi/client?hl=${locale}`
      if (!existing || existing.src !== desiredSrc) {
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
        const script = document.createElement('script')
        script.src = desiredSrc
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
    } catch (e) {
      /* ignore DOM errors */
    }
    let cancelled = false
    let rendered = false
    const tryInit = () => {
      const w = window as unknown as GISWindow
      if (!w.google?.accounts?.id) {
        if (!cancelled) setTimeout(tryInit, 250)
        return
      }
      if (cancelled || rendered || !ref.current) return
      rendered = true
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            setPending(true)
            const data = await loginWithGoogle(resp.credential, mode)
            onSuccessRef.current(data)
          } catch (err) {
            const msg = toErrorMessage(err)
            const isNotRegistered = mode === 'login' && msg.includes('belum terdaftar')
            if (isNotRegistered) {
              toast.error(t.auth.googleLoginFailedMessage, t.auth.googleLoginFailedTitle)
            } else {
              toast.error(msg || (mode === 'login' ? t.auth.googleLoginFailedMessage : t.auth.googleRegisterFailedMessage),
                mode === 'login' ? t.auth.googleLoginFailedTitle : t.auth.googleRegisterFailedTitle,
              )
            }
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
  }, [locale])

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


function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: 'login' | 'register' | 'forgot'
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const t = useT()
  const copy =
    mode === 'login'
      ? {
          label: t.landing.heroEyebrow,
          title: t.landing.heroTitle,
          accent: '',
          description: t.landing.heroDesc,
          stats: [
            { Icon: RiChatSmile3Line, value: 'AI', label: t.landing.featureAIDesc, color: 'text-blue-600', bg: 'rgba(239,246,255,0.80)' },
            { Icon: RiShieldCheckLine, value: t.landing.featureSecureTitle, label: t.landing.featureSecureDesc, color: 'text-emerald-600', bg: 'rgba(236,253,245,0.80)' },
          ],
        }
      : mode === 'register'
        ? {
          label: t.landing.ctaJoinTitle,
          title: t.auth.registerTitle,
          accent: '',
          description: t.landing.ctaJoinDesc,
          stats: [
            { Icon: RiArrowUpLine, value: t.landing.featureMultiWalletTitle, label: t.landing.featureMultiWalletDesc, color: 'text-emerald-600', bg: 'rgba(236,253,245,0.80)' },
            { Icon: RiSparklingLine, value: 'AI', label: t.landing.featureAIDesc, color: 'text-blue-600', bg: 'rgba(239,246,255,0.80)' },
          ],
        }
        : {
            label: t.auth.forgotTitle,
            title: t.auth.forgotTitle,
            accent: '',
            description: t.auth.forgotSubtitle,
            stats: [
              { Icon: RiShieldCheckLine, value: 'Secure', label: t.landing.featureSecureDesc, color: 'text-emerald-600', bg: 'rgba(236,253,245,0.80)' },
              { Icon: RiSparklingLine, value: 'Quick', label: t.landing.howItWorksSubtitle, color: 'text-blue-600', bg: 'rgba(239,246,255,0.80)' },
            ],
          }

  return (
    <div
      className="app-surface relative flex min-h-screen flex-col overflow-hidden font-sans antialiased"
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-20 h-[680px] w-[680px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.35) 0%, transparent 65%)' }} />
        <div className="absolute top-1/4 -right-40 h-[560px] w-[560px] rounded-full animate-[pulse_10s_ease-in-out_infinite_2s]" style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full animate-[pulse_9s_ease-in-out_infinite_1s]" style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.22) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <main className="relative z-10 flex flex-1 items-center px-4 py-8 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-blue-700" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(191,219,254,0.70)', boxShadow: '0 2px 12px rgba(59,130,246,0.10)' }}>
              <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
              {copy.label}
            </div>
            <h2 className="max-w-xl text-5xl font-extrabold leading-[1.06] tracking-tight text-slate-900">
              {copy.title}
              <span className="block text-blue-600">{copy.accent}</span>
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-7 text-slate-500">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {copy.stats.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,232,240,0.70)' }}>
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', item.color)} style={{ background: item.bg }}>
                    <item.Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className={cn('text-xs font-extrabold', item.color)}>{item.value}</p>
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 32px 80px rgba(15,23,42,0.10), 0 8px 24px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,1)',
              }}
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600" style={{ border: '1px solid rgba(191,219,254,0.70)' }}>
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SAKU Finance · v1.0
      </footer>
    </div>
  )
}


function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      <span className="h-px flex-1 bg-slate-200/80" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200/80" />
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
            'h-12 w-full rounded-xl border border-slate-200 bg-white/85 pl-10 pr-3 text-sm font-medium shadow-sm transition placeholder:text-slate-400',
            'hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20',
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
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  disabled?: boolean
}) {
  const t = useT()
  return (
    <Field
      icon={HiOutlineEnvelope}
      label={label}
      type="email"
      required
      autoComplete="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t.auth.placeholders.email}
      disabled={disabled}
      className={disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-50' : undefined}
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
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  label: string
  minLength?: number
  placeholder?: string
}) {
  const t = useT()
  const computedPlaceholder =
    placeholder ?? (minLength ? t.auth.passwordMin.replace('{n}', String(minLength)) : t.auth.placeholders.password)
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
      placeholder={computedPlaceholder}
      rightSlot={
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
        </button>
      }
    />
  )
}
