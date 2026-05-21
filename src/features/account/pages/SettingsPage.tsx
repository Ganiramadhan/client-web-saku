import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineKey,
  HiOutlineSparkles,
  HiOutlineCog6Tooth,
  HiOutlineMoon,
  HiOutlineInformationCircle,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2'
import {  Card, PageHeader, Input, Button } from '@/components/ui'
import { changePassword } from '@/features/auth/api'
import { useAuthStore } from '@/stores/authStore'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn} from '@/lib/utils'

export function SettingsPage() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clear)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola password, langganan, preferensi aplikasi, dan sesi login."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChangePasswordPanel showHeader={false} />
        <div className="space-y-4">
          <AppInfoCard />
          <LogoutPanel
            onLogout={() => {
              clearSession()
              navigate('/login', { replace: true })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function ChangePasswordPanel({ showHeader = true }: { showHeader?: boolean }) {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clear)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  const strength = scoreStrength(next)

  const change = useMutation({
    mutationFn: () =>
      changePassword({ current_password: current, new_password: next }),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setConfirm('')
      toast.success('Password berhasil diubah.')
      clearSession()
      navigate('/login', { replace: true })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) {
      toast.error('Password sekarang wajib diisi.')
      return
    }
    const passwordError = getPasswordValidationError(next, confirm)
    if (passwordError) {
      toast.error(passwordError, 'Password belum sesuai')
      return
    }
    if (next === current) {
      toast.error('Password baru harus berbeda dari yang sekarang.')
      return
    }
    if (next !== confirm) {
      toast.error('Konfirmasi password tidak cocok.')
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
          title="Pengaturan Keamanan"
          subtitle="Kelola password dan preferensi keamanan akun."
        />
      ) : null}

      <div className="grid gap-6">
        <Card>
          <div className="flex items-center gap-3 border-b border-white/60 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 border border-brand-500/10">
              <HiOutlineKey className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ubah Password
              </h3>
              <p className="text-xs text-slate-500">
                Pilih password yang kuat dan unik untuk akun ini.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="relative">
              <Input
                label="Password Sekarang"
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <EyeBtn show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password Baru"
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <EyeBtn show={showNext} onToggle={() => setShowNext((v) => !v)} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                {next ? <StrengthMeter score={strength} /> : <div />}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-blue-100 !bg-blue-50 text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-blue-100"
                  leftIcon={<HiOutlineSparkles className="h-4 w-4" />}
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>
            </div>

            <Input
              label="Konfirmasi Password Baru"
              type={showNext ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              required
              error={
                confirm && confirm !== next
                  ? 'Tidak cocok dengan password baru.'
                  : undefined
              }
            />

            <div className="flex flex-col-reverse gap-2 pt-4 border-t border-white/60 sm:flex-row sm:justify-end">
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
                Reset
              </Button>
              <Button type="submit" loading={change.isPending}>
                Simpan Password Baru
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </div>
  )
}

function generateStrongPassword(): string {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789']
  const all = groups.join('')
  const chars = groups.map((group) => group[Math.floor(Math.random() * group.length)])
  while (chars.length < 14) chars.push(all[Math.floor(Math.random() * all.length)])
  return chars.sort(() => Math.random() - 0.5).join('')
}

function getPasswordValidationError(password: string, confirmPassword: string): string | null {
  if (password.length < 8) return 'Password baru minimal 8 karakter.'
  if (!/[A-Z]/.test(password)) return 'Password baru harus mengandung huruf besar.'
  if (!/[a-z]/.test(password)) return 'Password baru harus mengandung huruf kecil.'
  if (!/\d/.test(password)) return 'Password baru harus mengandung angka.'
  if (!confirmPassword) return 'Konfirmasi password baru wajib diisi.'
  if (password !== confirmPassword) return 'Konfirmasi password tidak cocok.'
  return null
}

function AppInfoCard() {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDarkMode = () => {
    setDarkMode((value) => {
      const next = !value
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('saku_theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineCog6Tooth className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">Informasi Aplikasi</h3>
      </div>
      <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-white/70 bg-white/50">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white/80"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <HiOutlineMoon className="h-4 w-4 text-slate-500" />
            Dark / Light mode
          </span>
          <span className={cn('h-5 w-9 rounded-full p-0.5 transition', darkMode ? 'bg-brand-600' : 'bg-slate-300')}>
            <span className={cn('block h-4 w-4 rounded-full bg-white shadow transition', darkMode && 'translate-x-4')} />
          </span>
        </button>
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <HiOutlineInformationCircle className="h-4 w-4 text-slate-500" />
            Tentang SAKU
          </span>
          <span className="text-xs font-bold text-slate-400">v1.0</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="text-xs font-semibold text-slate-700">Versi aplikasi</span>
          <span className="text-xs font-bold text-slate-400">2026.05</span>
        </div>
      </div>
    </Card>
  )
}

function LogoutPanel({ onLogout }: { onLogout: () => void }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineArrowRightOnRectangle className="h-5 w-5 text-rose-600" />
        <h3 className="text-sm font-bold text-slate-900">Sesi Login</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Keluar dari perangkat ini jika akun digunakan di komputer bersama.
      </p>
      <Button
        type="button"
        variant="danger"
        className="mt-4 w-full"
        leftIcon={<HiOutlineArrowRightOnRectangle className="h-4 w-4" />}
        onClick={onLogout}
      >
        Logout
      </Button>
    </Card>
  )
}

function EyeBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-8.5 text-slate-400 hover:text-slate-700"
      aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
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

function StrengthMeter({ score }: { score: number }) {
  const labels = ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat']
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
        Kekuatan: <span className="text-slate-700">{labels[score]}</span>
      </p>
    </div>
  )
}

function scoreStrength(pw: string): number {
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (pw.length >= 16) s++
  return Math.min(4, Math.max(0, s - 1))
}
