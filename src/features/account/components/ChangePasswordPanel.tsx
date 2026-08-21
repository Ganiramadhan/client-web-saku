import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineKey,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { Button, Card, Input, PageHeader } from '@/components/ui'
import { changePassword } from '@/features/auth/api'
import { PasswordRequirementsChecklist } from '@/features/auth/components/AuthFormParts'
import { useLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  generateStrongPassword,
  getPasswordValidationError,
  scoreStrength,
} from '../utils/password'

export function ChangePasswordPanel({
  showHeader = true,
  embedded = false,
}: {
  showHeader?: boolean
  embedded?: boolean
}) {
  const navigate = useNavigate()
  const { locale } = useLocale()
  const clearSession = useAuthStore((s) => s.clear)
  const user = useAuthStore((s) => s.user)
  const isGoogleOnly = user?.auth_provider === 'google'
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  const strength = scoreStrength(next)
  const copy = locale === 'id'
    ? {
        pageTitle: 'Pengaturan Keamanan',
        pageSubtitle: 'Kelola password dan preferensi keamanan akun.',
        title: 'Ubah Password',
        description: isGoogleOnly ? 'Akun Google belum memiliki password SAKU. Buat password baru untuk login manual.' : 'Pilih password yang kuat dan unik untuk akun ini.',
        current: 'Password Sekarang',
        next: 'Password Baru',
        nextPlaceholder: 'Min. 8 karakter',
        confirm: 'Konfirmasi Password Baru',
        confirmPlaceholder: 'Ulangi password baru',
        mismatch: 'Tidak cocok dengan password baru.',
        reset: 'Reset',
        save: 'Simpan Password Baru',
        show: 'Tampilkan',
        hide: 'Sembunyikan',
        strength: 'Kekuatan',
        strengthLabels: ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'],
        success: 'Password berhasil diubah.',
        currentRequired: isGoogleOnly ? '' : 'Password sekarang wajib diisi.',
        invalidTitle: 'Password belum sesuai',
        samePassword: 'Password baru harus berbeda dari yang sekarang.',
        validation: {
          minLength: 'Password baru minimal 8 karakter.',
          uppercase: 'Password baru harus mengandung huruf besar.',
          lowercase: 'Password baru harus mengandung huruf kecil.',
          number: 'Password baru harus mengandung angka.',
          confirmRequired: 'Konfirmasi password baru wajib diisi.',
          mismatch: 'Konfirmasi password tidak cocok.',
        },
      }
    : {
        pageTitle: 'Security Settings',
        pageSubtitle: 'Manage your account password and security preferences.',
        title: 'Change Password',
        description: isGoogleOnly ? 'Your Google account does not have a SAKU password yet. Create one for manual login.' : 'Choose a strong and unique password for this account.',
        current: 'Current Password',
        next: 'New Password',
        nextPlaceholder: 'Min. 8 characters',
        confirm: 'Confirm New Password',
        confirmPlaceholder: 'Repeat the new password',
        mismatch: 'Does not match the new password.',
        reset: 'Reset',
        save: 'Save New Password',
        show: 'Show',
        hide: 'Hide',
        strength: 'Strength',
        strengthLabels: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'],
        success: 'Password updated successfully.',
        currentRequired: isGoogleOnly ? '' : 'Current password is required.',
        invalidTitle: 'Password does not meet requirements',
        samePassword: 'The new password must be different from the current one.',
        validation: {
          minLength: 'New password must be at least 8 characters.',
          uppercase: 'New password must include an uppercase letter.',
          lowercase: 'New password must include a lowercase letter.',
          number: 'New password must include a number.',
          confirmRequired: 'Please confirm your new password.',
          mismatch: 'Password confirmation does not match.',
        },
      }

  const change = useMutation({
    mutationFn: () =>
      changePassword({ current_password: isGoogleOnly ? '' : current, new_password: next }),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setConfirm('')
      toast.success(copy.success)
      clearSession()
      navigate('/login', { replace: true })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isGoogleOnly && !current) {
      toast.error(copy.currentRequired)
      return
    }
    const passwordError = getPasswordValidationError(next, confirm, copy.validation)
    if (passwordError) {
      toast.error(passwordError, copy.invalidTitle)
      return
    }
    if (!isGoogleOnly && next === current) {
      toast.error(copy.samePassword)
      return
    }
    change.mutate()
  }

  const generatePassword = () => {
    const password = generateStrongPassword()
    setNext(password)
    setConfirm(password)
    setShowNext(true)
  }

  return (
    <div className={showHeader ? 'mx-auto max-w-5xl' : 'w-full'}>
      {showHeader ? (
        <PageHeader
          title={copy.pageTitle}
          subtitle={copy.pageSubtitle}
        />
      ) : null}

      <PasswordPanelFrame embedded={embedded}>
        <div className="flex items-center gap-3 border-b border-white/60 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/10 bg-brand-600/10 text-brand-700">
            <HiOutlineKey className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{copy.title}</h3>
            <p className="text-xs text-slate-500">
              {copy.description}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {!isGoogleOnly ? (
            <div className="relative">
              <Input
                label={copy.current}
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <EyeBtn
                show={showCurrent}
                labels={{ show: copy.show, hide: copy.hide }}
                onToggle={() => setShowCurrent((v) => !v)}
              />
            </div>
          ) : null}

          <div>
            <div className="relative">
              <Input
                label={copy.next}
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder={copy.nextPlaceholder}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <EyeBtn
                show={showNext}
                labels={{ show: copy.show, hide: copy.hide }}
                onToggle={() => setShowNext((v) => !v)}
              />
            </div>
            <PasswordRequirementsChecklist password={next} confirmPassword={confirm} />
            <div className="mt-2 flex items-center justify-between gap-3">
              {next ? (
                <StrengthMeter
                  score={strength}
                  label={copy.strength}
                  labels={copy.strengthLabels}
                />
              ) : <div />}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-brand-100 !bg-brand-50 text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-brand-100"
                leftIcon={<HiOutlineSparkles className="h-4 w-4" />}
                onClick={generatePassword}
              >
                Generate
              </Button>
            </div>
          </div>

          <Input
            label={copy.confirm}
            type={showNext ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={copy.confirmPlaceholder}
            autoComplete="new-password"
            required
            error={
              confirm && confirm !== next
                ? copy.mismatch
                : undefined
            }
          />

          <div className="flex flex-col-reverse gap-2 border-t border-white/60 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 !bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-slate-50 hover:text-slate-950"
              onClick={() => {
                setCurrent('')
                setNext('')
                setConfirm('')
              }}
              disabled={change.isPending}
            >
              {copy.reset}
            </Button>
            <Button type="submit" loading={change.isPending}>
              {copy.save}
            </Button>
          </div>
        </form>
      </PasswordPanelFrame>
    </div>
  )
}

function PasswordPanelFrame({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  if (embedded) {
    return <div>{children}</div>
  }
  return <Card>{children}</Card>
}

function EyeBtn({
  show,
  labels,
  onToggle,
}: {
  show: boolean
  labels: { show: string; hide: string }
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-8.5 text-slate-400 hover:text-slate-700"
      aria-label={show ? labels.hide : labels.show}
      tabIndex={-1}
    >
      {show ? (
        <HiOutlineEyeSlash className="h-4 w-4" />
      ) : (
        <HiOutlineEye className="h-4 w-4" />
      )}
    </button>
  )
}

function StrengthMeter({
  score,
  label,
  labels,
}: {
  score: number
  label: string
  labels: string[]
}) {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-lime-500',
    'bg-emerald-500',
  ]
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition',
              i <= score ? colors[score] : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-500">
        {label}: <span className="text-slate-700">{labels[score]}</span>
      </p>
    </div>
  )
}
