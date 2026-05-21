import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { HiOutlineArrowRight, HiOutlineShieldCheck } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { forgotPassword, resetPassword } from '@/features/auth/api'
import {
  AuthShell,
  Field,
  FieldEmail,
  FieldPassword,
  PasswordPolicyPanel,
  formatCountdown,
  generateStrongPassword,
  getPasswordValidationError,
  scorePasswordStrength,
} from '@/features/auth/components/AuthFormParts'
import { useT } from '@/i18n'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'

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
      toast.error(toErrorMessage(error) || t.auth.otpInvalidMessage, t.auth.otpInvalidTitle)
    },
  })

  const resetM = useMutation({
    mutationFn: () => resetPassword({ email: email.trim(), otp: otp.trim(), new_password: newPassword }),
    onSuccess: () => {
      toast.success(t.auth.passwordUpdatedMessage, t.auth.passwordUpdatedTitle)
      navigate('/login', { replace: true })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error) || t.auth.passwordUpdateFailedMessage, t.auth.passwordUpdateFailedTitle)
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

  const onSubmit = (event: FormEvent) => {
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
  }

  return (
    <AuthShell mode="forgot" title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <form className="space-y-5" onSubmit={onSubmit}>
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
                  <p className="text-xs font-bold text-blue-800">
                    {t.auth.otpExpiresPrefix} {formatCountdown(otpRemaining)}
                  </p>
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
              placeholder={t.auth.passwordMin.replace('{n}', '8')}
            />
            <PasswordPolicyPanel score={strength} onGenerate={generatePassword} />
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
