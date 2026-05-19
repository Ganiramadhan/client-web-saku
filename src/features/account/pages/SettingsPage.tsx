import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import { Card, PageHeader, Input, Button } from '@/components/ui'
import { changePassword } from '@/features/auth/api'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function SettingsPage() {
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
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || !next || !confirm) {
      toast.error('Semua field wajib diisi.')
      return
    }
    if (next.length < 6) {
      toast.error('Password baru minimal 6 karakter.')
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

  const checks = [
    { ok: next.length >= 8, label: 'Minimal 8 karakter' },
    { ok: /[A-Z]/.test(next), label: 'Mengandung huruf besar' },
    { ok: /[a-z]/.test(next), label: 'Mengandung huruf kecil' },
    { ok: /\d/.test(next), label: 'Mengandung angka' },
    { ok: /[^A-Za-z0-9]/.test(next), label: 'Mengandung simbol' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Pengaturan Keamanan"
        subtitle="Kelola password dan preferensi keamanan akun."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <HiOutlineKey className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
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
                  minLength={6}
                />
                <EyeBtn show={showNext} onToggle={() => setShowNext((v) => !v)} />
              </div>
              {next ? <StrengthMeter score={strength} /> : null}
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

            {next ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Persyaratan
                </p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {checks.map((c) => (
                    <li
                      key={c.label}
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        c.ok ? 'text-emerald-700' : 'text-slate-500',
                      )}
                    >
                      {c.ok ? (
                        <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <HiOutlineExclamationTriangle className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
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

        {/* Tips */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2">
              <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Tips Keamanan
              </h3>
            </div>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
              {[
                'Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.',
                'Jangan gunakan ulang password dari aplikasi lain.',
                'Aktifkan password manager untuk menyimpan password yang panjang.',
                'Ganti password secara berkala, minimal 6 bulan sekali.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <HiOutlineLockClosed className="h-5 w-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Privasi & Enkripsi
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Password disimpan dalam bentuk hash (bcrypt) dan tidak pernah dikirim
              dalam bentuk teks biasa. Semua koneksi diamankan dengan TLS 1.3.
            </p>
          </Card>
        </div>
      </div>
    </div>
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
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(4, Math.max(0, s - 1))
}
