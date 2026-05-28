import { useEffect, useRef, type ComponentType, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { useT } from '@/i18n'
import type { Dict } from '@/i18n/dictionaries'
import { preloadTurnstileScript } from '@/features/auth/components/TurnstileWidget'
import { cn } from '@/lib/utils'

export function getPasswordValidationError(t: Dict, password: string, confirmPassword: string): string | null {
  if (password.length < 8) return t.auth.passwordNewTooShort
  if (!/[A-Z]/.test(password)) return t.auth.passwordNewRequireUpper
  if (!/[a-z]/.test(password)) return t.auth.passwordNewRequireLower
  if (!/\d/.test(password)) return t.auth.passwordNewRequireDigit
  if (!confirmPassword) return t.auth.passwordConfirmRequired
  if (password !== confirmPassword) return t.auth.passwordConfirmMismatch
  return null
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%'
  const all = upper + lower + digits + symbols
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  return [pick(upper), pick(lower), pick(digits), pick(symbols), ...Array.from({ length: 8 }, () => pick(all))]
    .sort(() => Math.random() - 0.5)
    .join('')
}

export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function sanitizeDisplayName(value: string): string {
  return value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function scorePasswordStrength(pw: string): number {
  let score = 0
  if (pw.length >= 8) score += 1
  if (/[A-Z]/.test(pw)) score += 1
  if (/[a-z]/.test(pw)) score += 1
  if (/\d/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  return score
}

export function PasswordStrengthMeter({ score }: { score: number }) {
  return (
    <div className="mt-2 grid grid-cols-5 gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 rounded-full transition',
            index < score ? (score >= 4 ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-200',
          )}
        />
      ))}
    </div>
  )
}

export function PasswordPolicyPanel({
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

export function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: 'login' | 'register' | 'forgot'
  title: string
  subtitle: string
  children: ReactNode
}) {
  const t = useT()
  useEffect(() => {
    preloadTurnstileScript().catch(() => undefined)
  }, [])
  const leftTitle =
    mode === 'register'
      ? t.landing.ctaJoinTitle
      : mode === 'forgot'
        ? t.auth.forgotTitle
        : t.landing.heroTitle

  return (
    <div className="app-surface auth-page relative flex min-h-screen flex-col overflow-hidden font-sans antialiased">
      <div className="auth-fixed-bg pointer-events-none absolute inset-x-0 top-0 z-0 min-h-screen overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-40 h-[680px] w-[680px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.35) 0%, transparent 65%)' }} />
        <div className="absolute -right-40 top-1/4 h-[560px] w-[560px] rounded-full animate-[pulse_10s_ease-in-out_infinite_2s]" style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full animate-[pulse_9s_ease-in-out_infinite_1s]" style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.22) 0%, transparent 65%)' }} />
      </div>

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 px-1 py-1 text-xs font-bold text-slate-600 hover:text-blue-700 sm:left-6 sm:top-6"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <main className="relative z-10 flex flex-1 items-center px-4 pb-8 pt-16 sm:px-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,600px)_440px] lg:items-stretch xl:gap-14">
          <section className="hidden lg:flex">
            <div className="relative flex min-h-[560px] flex-col justify-center pr-4">
              <div className="pointer-events-none absolute -left-10 top-12 h-64 w-64 rounded-full bg-blue-100/45 blur-3xl" />
              <div className="pointer-events-none absolute bottom-6 right-0 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl" />
              <h5 className="relative mt-5 max-w-xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950">
                {leftTitle}
              </h5>
        
              <AuthSideIllustration />

              <div className="relative mt-6 grid max-w-lg gap-3">
                {[
                  [t.landing.featureAITitle, t.landing.featureAIDesc],
                  [t.landing.featureInsightTitle, t.landing.featureInsightDesc],
                  [t.landing.featureMultiWalletTitle, t.landing.featureMultiWalletDesc],
                ].map(([label, description]) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-950">{label}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mx-auto flex w-full max-w-md items-center lg:mx-0">
            <div className="w-full rounded-2xl p-5 sm:p-7" style={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 32px 80px rgba(15,23,42,0.10), 0 8px 24px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,1)' }}>
              <div className="mb-5 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600" style={{ border: '1px solid rgba(191,219,254,0.70)' }}>
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
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

function AuthSideIllustration() {
  return (
    <svg
      className="relative mt-7 h-auto w-full max-w-xl"
      viewBox="0 0 560 320"
      fill="none"
      role="img"
      aria-label="SAKU finance illustration"
    >
      <defs>
        <linearGradient id="authChart" x1="64" y1="258" x2="480" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="authPanel" x1="112" y1="56" x2="442" y2="276" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EFF6FF" />
        </linearGradient>
      </defs>
      <path d="M86 248C126 178 180 144 248 147c46 2 70 22 113 18 48-5 84-40 114-88" stroke="#DBEAFE" strokeWidth="34" strokeLinecap="round" />
      <path d="M86 248C126 178 180 144 248 147c46 2 70 22 113 18 48-5 84-40 114-88" stroke="url(#authChart)" strokeWidth="11" strokeLinecap="round" />
      <circle cx="86" cy="248" r="13" fill="#2563EB" />
      <circle cx="248" cy="147" r="13" fill="#7C3AED" />
      <circle cx="475" cy="77" r="13" fill="#10B981" />

      <rect x="128" y="74" width="236" height="154" rx="30" fill="url(#authPanel)" stroke="#BFDBFE" />
      <rect x="154" y="104" width="92" height="13" rx="6.5" fill="#93C5FD" />
      <rect x="154" y="130" width="148" height="9" rx="4.5" fill="#DBEAFE" />
      <rect x="154" y="152" width="116" height="9" rx="4.5" fill="#DBEAFE" />
      <rect x="154" y="184" width="62" height="18" rx="9" fill="#2563EB" />
      <rect x="232" y="184" width="86" height="18" rx="9" fill="#ECFDF5" />
      <path d="M253 193h44" stroke="#059669" strokeWidth="5" strokeLinecap="round" />

      <rect x="348" y="132" width="98" height="122" rx="26" fill="#FFFFFF" stroke="#BFDBFE" />
      <path d="M378 172h38M378 194h28" stroke="#93C5FD" strokeWidth="9" strokeLinecap="round" />
      <path d="M374 224l12 12 32-40" stroke="#10B981" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M130 258h316" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      <span className="h-px flex-1 bg-slate-200/80" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200/80" />
    </div>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ComponentType<{ className?: string }>
  label: string
  rightSlot?: ReactNode
}

export function Field({ icon: Icon, label, rightSlot, className, ...rest }: FieldProps) {
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
        {rightSlot ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
    </label>
  )
}

export function OtpInput({
  value,
  onChange,
  label = 'OTP',
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '')

  const setDigit = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      const next = digits.slice()
      next[index] = ''
      onChange(next.join('').slice(0, 6))
      return
    }
    const next = digits.slice()
    cleaned.split('').slice(0, 6 - index).forEach((digit, offset) => {
      next[index + offset] = digit
    })
    const nextValue = next.join('').slice(0, 6)
    onChange(nextValue)
    const focusIndex = Math.min(index + cleaned.length, 5)
    refs.current[focusIndex]?.focus()
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => { refs.current[index] = node }}
            value={digit}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            aria-label={`${label} ${index + 1}`}
            maxLength={1}
            onChange={(event) => setDigit(index, event.target.value)}
            onPaste={(event) => {
              event.preventDefault()
              setDigit(index, event.clipboardData.getData('text'))
            }}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="h-12 rounded-xl border border-slate-200 bg-white/85 text-center text-lg font-extrabold tabular-nums text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
          />
        ))}
      </div>
    </div>
  )
}

export function FieldEmail({
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

export function FieldPassword({
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
