import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { HiOutlineArrowRight, HiOutlineEnvelope, HiOutlineUser, HiOutlineXMark } from 'react-icons/hi2'
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
import { analyticsEvents, identifyAnalyticsUser, trackEvent } from '@/lib/analytics'

export function RegisterPage() {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
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
    const user = data.user as { id?: string; role?: string }
    identifyAnalyticsUser(user.id, user.role)
    trackEvent(analyticsEvents.emailVerificationSuccess)
    toast.success(locale === 'id' ? 'Akun siap digunakan.' : 'Your account is ready.')
    navigate('/app', { replace: true })
  }

  const m = useMutation({
    mutationFn: () =>
      register({
        name: sanitizeDisplayName(name),
        email: sanitizeEmail(email),
        password,
        privacy_accepted: privacyAccepted,
        turnstile_token: turnstileToken,
      }),
    onSuccess: (data) => {
      trackEvent(analyticsEvents.registerSuccess)
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
    if (!privacyAccepted) {
      toast.error(
        locale === 'id'
          ? 'Kamu perlu menyetujui S&K dan Privacy Policy sebelum daftar.'
          : 'You need to agree to the Terms and Privacy Policy before registering.',
        locale === 'id' ? 'Persetujuan diperlukan' : 'Agreement required',
      )
      return
    }
    if (isTurnstileEnabled() && !turnstileToken) {
      toast.error(locale === 'id' ? 'Selesaikan verifikasi keamanan dulu.' : 'Please complete the security verification.')
      return
    }
    trackEvent(analyticsEvents.registerStarted)
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
          <div className="rounded-2xl border border-brand-100 bg-brand-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-800">
              <HiOutlineEnvelope className="h-5 w-5 text-brand-700" />
              {locale === 'id' ? 'Verifikasi email kamu' : 'Verify your email'}
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-800/75">
              {locale === 'id'
                ? `Masukkan kode OTP yang dikirim ke ${pendingEmail}. Kode berlaku 5 menit.`
                : `Enter the OTP sent to ${pendingEmail}. The code is valid for 5 minutes.`}
            </p>
          </div>
          <OtpInput value={otp} onChange={setOtp} label="OTP" disabled={verify.isPending} />
          <Button
            type="submit"
            className="h-12 w-full rounded-xl border border-[#17120f]/25 !bg-brand-300 text-sm font-black !text-[#17120f] shadow-sm shadow-[#17120f]/10 hover:-translate-y-px hover:!bg-brand-200 focus:ring-brand-500/30"
            loading={verify.isPending}
            disabled={otp.length !== 6}
            rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
          >
            {locale === 'id' ? 'Verifikasi & Masuk' : 'Verify & Sign In'}
          </Button>
          <div className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-brand-800">
                  {t.auth.otpExpiresPrefix} {formatCountdown(otpRemaining)}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-brand-700/80">{t.auth.otpUseLatest}</p>
              </div>
              <button
                type="button"
                disabled={resend.isPending || resendRemaining > 0}
                onClick={() => resend.mutate()}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {resendRemaining > 0
                  ? t.auth.resendOtpLabel.replace('{time}', formatCountdown(resendRemaining))
                  : t.auth.sendOtp}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3.5">
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
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white/75 p-3 text-xs leading-5 text-slate-600">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              required
            />
            <span>
              {locale === 'id'
                ? 'Saya menyetujui '
                : 'I agree to '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setTermsOpen(true)
                }}
                className="font-bold text-brand-700 underline underline-offset-2"
              >
                {locale === 'id' ? 'Syarat & Ketentuan dan Privacy Policy' : 'Terms & Conditions and Privacy Policy'}
              </button>
              {locale === 'id' ? ' SAKU.' : ' of SAKU.'}
            </span>
          </label>
          <Button
            type="submit"
            className="h-12 w-full rounded-xl border border-[#17120f]/25 !bg-brand-300 text-sm font-black !text-[#17120f] shadow-sm shadow-[#17120f]/10 hover:-translate-y-px hover:!bg-brand-200 focus:ring-brand-500/30"
            loading={m.isPending}
            disabled={!privacyAccepted || (isTurnstileEnabled() && !turnstileToken)}
            rightIcon={<HiOutlineArrowRight className="h-4 w-4" />}
          >
            {t.auth.submitRegister}
          </Button>

          <p className="text-center text-[11px] text-slate-400">{t.auth.registerConsent}</p>
        </form>
      )}

      <TermsModal
        open={termsOpen}
        locale={locale}
        onClose={() => setTermsOpen(false)}
        onAgree={() => {
          setPrivacyAccepted(true)
          setTermsOpen(false)
        }}
      />

      {!pendingEmail ? (
        <>
          <Divider label={t.auth.dividerOrRegister} />
          <GoogleButton mode="register" onSuccess={redirect} />
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.hasAccount}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          {t.auth.submitLogin}
        </Link>
      </p>
    </AuthShell>
  )
}

function isGmailAddress(email: string) {
  return email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')
}

function TermsModal({
  open,
  locale,
  onClose,
  onAgree,
}: {
  open: boolean
  locale: string
  onClose: () => void
  onAgree: () => void
}) {
  if (!open || typeof document === 'undefined') return null

  const isId = locale === 'id'
  const sections = isId
    ? [
        ['Penggunaan Layanan', 'SAKU membantu mencatat transaksi, membaca struk, mengelola wallet, target, split bill, billing, dan insight AI. Gunakan layanan secara wajar dan pastikan data yang kamu masukkan benar.'],
        ['Data dan Privasi', 'Kami menggunakan data akun, transaksi, gambar struk, dan aktivitas aplikasi untuk menyediakan fitur inti, keamanan, analitik produk, dan pengalaman yang lebih relevan.'],
        ['Keamanan Akun', 'Jaga password, OTP, dan akses perangkat kamu. SAKU tidak pernah meminta OTP melalui chat, telepon, atau email di luar alur resmi aplikasi.'],
        ['AI dan Akurasi', 'Hasil AI membantu mempercepat pencatatan, tetapi tetap perlu kamu review sebelum disimpan sebagai data final.'],
        ['Persetujuan', 'Dengan melanjutkan, kamu menyatakan sudah membaca dan menyetujui Syarat & Ketentuan serta Privacy Policy SAKU.'],
      ]
    : [
        ['Service Usage', 'SAKU helps record transactions, scan receipts, manage wallets, goals, split bills, billing, and AI insights. Use the service responsibly and make sure submitted data is accurate.'],
        ['Data and Privacy', 'We use account data, transactions, receipt images, and app activity to provide core features, security, product analytics, and a more relevant experience.'],
        ['Account Security', 'Keep your password, OTP, and device access safe. SAKU never asks for OTP through chat, phone, or email outside the official app flow.'],
        ['AI and Accuracy', 'AI results help speed up recording, but you should review them before saving as final data.'],
        ['Agreement', 'By continuing, you confirm that you have read and agreed to SAKU Terms & Conditions and Privacy Policy.'],
      ]

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#17120f]/40 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-[#17120f]/12 bg-[#fffaf6] shadow-2xl shadow-[#17120f]/20">
        <div className="flex items-start justify-between gap-4 border-b border-[#17120f]/10 bg-[#fff3ee] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/85 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-brand-700 shadow-sm">
              <img src="/logo.png" alt="SAKU" className="h-6 w-6 rounded-lg object-contain" />
              SAKU Finance
            </div>
            <h2 className="mt-4 text-xl font-black tracking-tight text-[#17120f] sm:text-2xl">
              {isId ? 'Syarat & Privasi SAKU' : 'SAKU Terms & Privacy'}
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-5 text-[#4f4540] sm:text-sm">
              {isId
                ? 'Baca ringkasan ini sebelum membuat akun. Kamu bisa scroll untuk melihat seluruh poin penting.'
                : 'Review this summary before creating your account. Scroll to see every important point.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#17120f]/10 bg-white text-[#4f4540]/70 shadow-sm hover:border-brand-200 hover:text-brand-700"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="rounded-2xl border border-brand-100 bg-[#ffe4dc]/65 p-4">
            <p className="text-sm font-black text-[#17120f]">
              {isId ? 'Ringkasan persetujuan' : 'Agreement summary'}
            </p>
            <p className="mt-2 text-xs leading-6 text-[#4f4540]">
              {isId
                ? 'Dengan mendaftar, kamu menyetujui pemrosesan data yang diperlukan agar fitur finansial, keamanan akun, dan verifikasi email berjalan dengan baik.'
                : 'By registering, you agree to the data processing required for financial features, account security, and email verification to work properly.'}
            </p>
          </div>
          {sections.map(([title, body], index) => (
            <section key={title} className="rounded-2xl border border-[#17120f]/10 bg-white/78 p-4 shadow-sm shadow-[#17120f]/5">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fddf82]/70 text-xs font-black text-[#17120f]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#17120f]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-6 text-[#4f4540]">{body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
        <div className="border-t border-[#17120f]/10 bg-white/42 p-4 sm:p-5">
          <p className="mb-3 text-[11px] leading-5 text-[#4f4540]/75">
            {isId
              ? 'Klik setuju jika kamu memahami poin di atas dan ingin melanjutkan pendaftaran.'
              : 'Click agree if you understand the points above and want to continue registration.'}
          </p>
          <div className="grid gap-2 sm:grid-cols-[0.85fr_1.15fr]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#17120f]/10 bg-white px-4 py-3 text-sm font-bold text-[#4f4540] hover:border-brand-200 hover:text-[#17120f]"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="rounded-xl border border-[#17120f]/25 bg-brand-300 px-4 py-3 text-sm font-black text-[#17120f] shadow-sm shadow-[#17120f]/10 transition hover:-translate-y-0.5 hover:bg-brand-200"
          >
            {isId ? 'Saya Setuju' : 'I Agree'}
          </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
