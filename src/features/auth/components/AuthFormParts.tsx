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
            index < score ? (score >= 4 ? 'bg-emerald-500' : 'bg-brand-500') : 'bg-slate-200',
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
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#17120f]/25 bg-brand-300 px-3 py-2 text-xs font-black text-[#17120f] shadow-sm shadow-[#17120f]/10 transition hover:-translate-y-0.5 hover:bg-brand-200 active:scale-[0.98]"
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
    <div className="app-surface auth-page relative flex min-h-screen flex-col overflow-hidden bg-[#f6eee8] font-sans antialiased">
      <div className="auth-fixed-bg pointer-events-none absolute inset-x-0 top-0 z-0 min-h-screen overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-[45%_55%_35%_65%] border border-[#17120f]/15 bg-brand-100/55" />
        <div className="absolute right-12 top-28 h-44 w-44 rounded-[62%_38%_55%_45%] border border-[#17120f]/15 bg-[#fddf82]/55" />
        <div className="absolute bottom-16 left-1/3 h-28 w-28 rotate-12 rounded-[2rem] border border-[#17120f]/10 bg-white/45" />
      </div>

      <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3 sm:inset-x-6 sm:top-6">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-[#17120f]/25 bg-[#fffaf6]/90 px-3 py-1.5 text-xs font-black text-[#17120f] shadow-sm shadow-[#17120f]/5 transition hover:-translate-y-0.5 hover:border-[#17120f]/40 hover:bg-[#fddf82]/70">
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <main className="relative z-10 flex flex-1 items-center px-4 pb-8 pt-16 sm:px-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,600px)_440px] lg:items-stretch xl:gap-14">
          <section className="hidden lg:flex">
            <div className="relative flex min-h-[560px] flex-col justify-center pr-4">
              <div className="pointer-events-none absolute -left-10 top-12 h-64 w-64 rounded-[45%_55%_35%_65%] border border-[#17120f]/12 bg-brand-100/45" />
              <div className="pointer-events-none absolute bottom-6 right-0 h-40 w-40 rounded-[2.5rem] border border-[#17120f]/12 bg-[#fddf82]/45" />
              <h5 className="relative mt-5 max-w-xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-[#17120f]">
                {leftTitle}
              </h5>
        
              <AuthSideIllustration mode={mode} />

              <div className="relative mt-6 grid max-w-lg gap-3">
                {[
                  [t.landing.featureAITitle, t.landing.featureAIDesc],
                  [t.landing.featureInsightTitle, t.landing.featureInsightDesc],
                  [t.landing.featureMultiWalletTitle, t.landing.featureMultiWalletDesc],
                ].map(([label, description]) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-2 h-3 w-3 shrink-0 rounded-full border border-[#17120f]/35 bg-brand-500" />
                    <div>
                      <p className="text-sm font-black text-[#17120f]">{label}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mx-auto flex w-full max-w-md items-center lg:mx-0">
            <div className="w-full rounded-[1.75rem] border border-[#17120f]/20 bg-[#fffaf6]/92 p-5 shadow-[0_24px_70px_rgba(23,18,15,0.12)] backdrop-blur sm:p-7">
              <div className="mb-5 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#17120f]/20 bg-brand-300 text-[#17120f] shadow-sm shadow-[#17120f]/10">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#17120f] sm:text-3xl">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-[#4f4540]">{subtitle}</p>
              </div>
              {children}
              <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-[#17120f]/10 pt-4 text-[11px] font-black text-[#4f4540]">
                <Link to="/privacy" className="hover:text-brand-700 hover:underline">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-brand-700 hover:underline">Terms</Link>
                <Link to="/contact" className="hover:text-brand-700 hover:underline">Contact</Link>
                <Link to="/about" className="hover:text-brand-700 hover:underline">About SAKU</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SAKU Finance · Website resmi SAKU · hello@ganipedia.com
      </footer>
    </div>
  )
}

function AuthSideIllustration({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const bubbleText = isForgot ? 'OTP' : isRegister ? 'GO' : 'AI'
  const primaryLabel = isForgot ? 'Reset aman' : isRegister ? 'Mulai rapi' : 'Masuk lagi'
  const cardAccent = isForgot ? '#fddf82' : isRegister ? '#ecfdf5' : '#ffe4dc'
  const sideAccent = isForgot ? '#ffe4dc' : isRegister ? '#fddf82' : '#ff9d8d'

  return (
    <svg
      className="relative mt-7 h-auto w-full max-w-xl"
      viewBox="0 0 560 320"
      fill="none"
      role="img"
      aria-label="SAKU finance illustration"
    >
      <path d="M73 278C112 235 164 213 229 214c75 1 116 27 179 15 45-9 72-34 92-66" stroke="#ffe4dc" strokeWidth="30" strokeLinecap="round" />
      <path d="M73 278C112 235 164 213 229 214c75 1 116 27 179 15 45-9 72-34 92-66" stroke="#17120f" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />

      <path d="M66 252C78 229 93 218 112 221c-1 24-15 38-46 31Z" fill="#ff9d8d" stroke="#17120f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M88 295C87 260 96 232 115 204" stroke="#17120f" strokeWidth="4" strokeLinecap="round" />
      <path d="M104 276C126 259 144 260 154 278c-22 18-39 17-50-2Z" fill="#fddf82" stroke="#17120f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="142" y="86" width="196" height="124" rx="30" fill="#fffaf6" stroke="#17120f" strokeOpacity=".72" strokeWidth="3" />
      <rect x="166" y="112" width="84" height="12" rx="6" fill={isForgot ? '#17120f' : '#ff6f61'} />
      <rect x="166" y="139" width="128" height="9" rx="4.5" fill="#ffe4dc" />
      <rect x="166" y="161" width="98" height="9" rx="4.5" fill="#ffe4dc" />
      <rect x="166" y="184" width="50" height="15" rx="7.5" fill={cardAccent} stroke="#17120f" strokeOpacity=".45" />
      <rect x="230" y="184" width="72" height="15" rx="7.5" fill={isRegister ? '#ff6f61' : '#ecfdf5'} />
      <path d="M249 191h34" stroke={isRegister ? '#17120f' : '#059669'} strokeWidth="4" strokeLinecap="round" />
      <text x="166" y="101" fontSize="11" fontWeight="900" fill="#17120f">{primaryLabel}</text>

      <path d="M365 100h92c15 0 25 10 25 25v48c0 15-10 25-25 25h-92c-15 0-25-10-25-25v-48c0-15 10-25 25-25Z" fill={sideAccent} stroke="#17120f" strokeOpacity=".72" strokeWidth="3" />
      {isForgot ? (
        <>
          <circle cx="384" cy="148" r="11" fill="#fffaf6" stroke="#17120f" strokeWidth="3" />
          <circle cx="421" cy="148" r="11" fill="#fffaf6" stroke="#17120f" strokeWidth="3" />
          <circle cx="458" cy="148" r="11" fill="#fffaf6" stroke="#17120f" strokeWidth="3" />
          <path d="M392 174h58" stroke="#17120f" strokeOpacity=".58" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : isRegister ? (
        <>
          <path d="M383 144h72M383 166h42" stroke="#17120f" strokeOpacity=".58" strokeWidth="5" strokeLinecap="round" />
          <path d="M392 121l8 8 19-25" stroke="#17120f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M451 125l14 14-14 14" stroke="#ff6f61" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M365 134h92M365 161h56" stroke="#17120f" strokeOpacity=".58" strokeWidth="5" strokeLinecap="round" />
          <path d="M454 124c14 7 21 19 20 35" stroke="#ff6f61" strokeWidth="5" strokeLinecap="round" />
        </>
      )}

      <rect x="363" y="205" width="92" height="58" rx="18" fill="#fffaf6" stroke="#17120f" strokeOpacity=".72" strokeWidth="3" />
      <path d="M385 225h44M385 244h26" stroke="#17120f" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
      <path d="M438 218l15 15-15 15" stroke="#ff6f61" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M306 58c0-18 16-32 42-32h54c27 0 43 14 43 32s-16 32-43 32h-13l-16 17-5-17h-20c-26 0-42-14-42-32Z" fill="#fffaf6" stroke="#17120f" strokeOpacity=".72" strokeWidth="3" />
      <text x="375" y="67" textAnchor="middle" fontSize={isForgot ? '18' : '22'} fontWeight="900" fill="#ff6f61">{bubbleText}</text>
      <path d="M482 65l5 10 11 5-11 5-5 11-5-11-10-5 10-5Z" fill="#fddf82" stroke="#17120f" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M110 66l4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="#ff9d8d" stroke="#17120f" strokeWidth="2.5" strokeLinejoin="round" />
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
            'saku-field-focus h-12 w-full rounded-xl border bg-white/85 pl-10 pr-3 text-sm font-medium shadow-sm transition placeholder:text-slate-400',
            'hover:bg-white focus:bg-white focus:outline-none',
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
            className="saku-field-focus h-12 rounded-xl border bg-white/85 text-center text-lg font-extrabold tabular-nums text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:bg-white focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
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
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
        </button>
      }
    />
  )
}
