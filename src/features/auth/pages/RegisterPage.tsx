import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { HiOutlineArrowRight, HiOutlineEnvelope, HiOutlineUser } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { register, resendRegistrationOTP, verifyRegistration } from '@/features/auth/api'
import {
  AuthShell,
  Divider,
  Field,
  FieldEmail,
  FieldPassword,
  OtpInput,
  formatCountdown,
  sanitizeDisplayName,
  sanitizeEmail,
} from '@/features/auth/components/AuthFormParts'
import { GoogleButton } from '@/features/auth/components/GoogleButton'
import { TurnstileWidget, isTurnstileEnabled } from '@/features/auth/components/TurnstileWidget'
import { useLocale, useT } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/authStore'

export function RegisterPage() {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!pendingEmail) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [pendingEmail])

  const redirect = (data: { token: string; user: { role: string } }) => {
    setSession(data.token, data.user as never)
    toast.success(locale === 'id' ? 'Akun siap digunakan.' : 'Your account is ready.')
    navigate('/app', { replace: true })
  }

  const m = useMutation({
    mutationFn: () =>
      register({
        name: sanitizeDisplayName(name),
        email: sanitizeEmail(email),
        password,
        turnstile_token: turnstileToken,
      }),
    onSuccess: (data) => {
      setPendingEmail(data.email)
      setOtp('')
      setOtpExpiresAt(Date.now() + (data.expires_in || 300) * 1000)
      setResendAt(Date.now() + 60 * 1000)
      toast.success(locale === 'id' ? 'Kode verifikasi sudah dikirim ke email.' : 'Verification code sent to your email.')
    },
    onError: () => {
      setTurnstileToken('')
      setTurnstileResetSignal((value) => value + 1)
    },
  })

  const verify = useMutation({
    mutationFn: () => verifyRegistration({ email: pendingEmail || sanitizeEmail(email), otp }),
    onSuccess: redirect,
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const resend = useMutation({
    mutationFn: () => resendRegistrationOTP(pendingEmail || sanitizeEmail(email)),
    onSuccess: () => {
      setOtp('')
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setResendAt(Date.now() + 60 * 1000)
      toast.success(locale === 'id' ? 'Kode verifikasi baru sudah dikirim.' : 'A new verification code has been sent.')
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  useEffect(() => {
    if (!m.error) return
    const raw = toErrorMessage(m.error) || ''
    const lowered = raw.toLowerCase()
    const alreadyIndicators = [
      'already',
      'already exists',
      'already registered',
      'exists',
      'sudah terdaftar',
      'terdaftar',
      'sudah kedaftar',
      'resource already exists',
    ]
    const isAlready = alreadyIndicators.some((item) => lowered.includes(item))
    toast.error(
      isAlready ? t.auth.emailAlreadyUsedMessage : raw || t.auth.registerFailedMessage,
      isAlready ? t.auth.emailAlreadyUsedTitle : t.auth.registerFailedTitle,
    )
  }, [m.error, t])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setName(sanitizeDisplayName(name))
    const cleanEmail = sanitizeEmail(email)
    setEmail(cleanEmail)
    if (!isGmailAddress(cleanEmail)) {
      toast.error(
        locale === 'id'
          ? 'Gunakan alamat Gmail aktif agar kode OTP bisa diterima.'
          : 'Use an active Gmail address so you can receive the OTP code.',
        locale === 'id' ? 'Email harus Gmail' : 'Gmail required',
      )
      return
    }
    if (isTurnstileEnabled() && !turnstileToken) {
      toast.error(locale === 'id' ? 'Selesaikan verifikasi keamanan dulu.' : 'Please complete the security verification.')
      return
    }
    m.mutate()
  }

  const otpRemaining = otpExpiresAt ? Math.max(0, Math.ceil((otpExpiresAt - now) / 1000)) : 0
  const resendRemaining = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0

  return (
    <AuthShell mode="register" title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      {pendingEmail ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            verify.mutate()
          }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-blue-950">
              <HiOutlineEnvelope className="h-5 w-5 text-blue-700" />
              {locale === 'id' ? 'Verifikasi email kamu' : 'Verify your email'}
            </div>
            <p className="mt-2 text-xs leading-5 text-blue-900/70">
              {locale === 'id'
                ? `Masukkan kode OTP yang dikirim ke ${pendingEmail}. Kode berlaku 5 menit.`
                : `Enter the OTP sent to ${pendingEmail}. The code is valid for 5 minutes.`}
            </p>
          </div>
          <OtpInput value={otp} onChange={setOtp} label="OTP" disabled={verify.isPending} />
          <Button
            type="submit"
            className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
            loading={verify.isPending}
            disabled={otp.length !== 6}
            rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
          >
            {locale === 'id' ? 'Verifikasi & Masuk' : 'Verify & Sign In'}
          </Button>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-blue-800">
                  {t.auth.otpExpiresPrefix} {formatCountdown(otpRemaining)}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-blue-700/80">{t.auth.otpUseLatest}</p>
              </div>
              <button
                type="button"
                disabled={resend.isPending || resendRemaining > 0}
                onClick={() => resend.mutate()}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {resendRemaining > 0
                  ? t.auth.resendOtpLabel.replace('{time}', formatCountdown(resendRemaining))
                  : t.auth.sendOtp}
              </button>
            </div>
          </div>
        </form>
      ) : (
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
          minLength={8}
        />
        <TurnstileWidget onVerify={setTurnstileToken} resetSignal={turnstileResetSignal} />
        <Button
          type="submit"
          className="h-12 w-full rounded-xl !bg-blue-600 text-sm font-bold shadow-lg shadow-blue-200/60 hover:-translate-y-px hover:!bg-blue-500 hover:shadow-blue-300/50 focus:ring-blue-500/40"
          loading={m.isPending}
          disabled={isTurnstileEnabled() && !turnstileToken}
          rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
        >
          {t.auth.submitRegister}
        </Button>

        <p className="text-center text-[11px] text-slate-400">{t.auth.registerConsent}</p>
        </form>
      )}

      {!pendingEmail ? (
        <>
          <Divider label={t.auth.dividerOrRegister} />
          <GoogleButton mode="register" onSuccess={redirect} />
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.hasAccount}{' '}
        <Link to="/login" className="font-semibold text-blue-700 hover:underline">
          {t.auth.submitLogin}
        </Link>
      </p>
    </AuthShell>
  )
}

function isGmailAddress(email: string) {
  return email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')
}
