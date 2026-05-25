import { useEffect, type ComponentType, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineHome,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import {
  RiArrowUpLine,
  RiChatSmile3Line,
  RiShieldCheckLine,
  RiSparklingLine,
} from 'react-icons/ri'
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
    <div className="app-surface relative flex min-h-screen flex-col overflow-hidden font-sans antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-40 h-[680px] w-[680px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.35) 0%, transparent 65%)' }} />
        <div className="absolute -right-40 top-1/4 h-[560px] w-[560px] rounded-full animate-[pulse_10s_ease-in-out_infinite_2s]" style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full animate-[pulse_9s_ease-in-out_infinite_1s]" style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.22) 0%, transparent 65%)' }} />
      </div>

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/80 hover:text-blue-700 hover:shadow-blue-100 sm:left-6 sm:top-6"
      >
        <HiOutlineHome className="h-4 w-4" />
        Home
      </Link>

      <main className="relative z-10 flex flex-1 items-center px-4 py-8 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="hidden lg:block">
            <div className="relative max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-blue-700" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(191,219,254,0.70)', boxShadow: '0 2px 12px rgba(59,130,246,0.10)' }}>
                <RiSparklingLine className="h-3.5 w-3.5 text-blue-500" />
                {copy.label}
              </div>
              <h2 className="text-5xl font-extrabold leading-[1.06] tracking-tight text-slate-900">
                {copy.title}
                <span className="block text-blue-600">{copy.accent}</span>
              </h2>
              <p className="mt-6 max-w-md text-[17px] leading-7 text-slate-500">{copy.description}</p>
            </div>
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
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 32px 80px rgba(15,23,42,0.10), 0 8px 24px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,1)' }}>
              <div className="mb-6 text-center">
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
