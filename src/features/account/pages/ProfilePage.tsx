import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { Card, PageHeader, Input, Button, Spinner, Badge } from '@/components/ui'
import {
  getMe,
  updateProfile,
  uploadPhoto,
  deletePhoto,
} from '@/features/auth/api'
import { subscriptionApi } from '@/features/subscription/api'
import { useAuthStore } from '@/stores/authStore'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Link } from 'react-router-dom'
import { HiOutlineStar } from 'react-icons/hi2'

export function ProfilePage() {
  const setUser = useAuthStore((s) => s.setUser)
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: getMe })
  const sub = useQuery({ queryKey: ['subscription', 'active'], queryFn: subscriptionApi.active })
  const plans = useQuery({ queryKey: ['subscriptions', 'plans'], queryFn: subscriptionApi.listPlans })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pendingPhotoKey, setPendingPhotoKey] = useState<string | null>(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (me.data) {
      setName(me.data.name ?? '')
      setEmail(me.data.email ?? '')
    }
  }, [me.data])

  const upload = useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: (res) => {
      setPendingPhotoKey(res.image)
      setPendingPhotoPreview(res.preview_url)
      toast.success('Foto berhasil diunggah, klik Simpan untuk menerapkan.')
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const removePhoto = useMutation({
    mutationFn: deletePhoto,
    onSuccess: (u) => {
      setUser(u)
      qc.invalidateQueries({ queryKey: ['me'] })
      setPendingPhotoKey(null)
      setPendingPhotoPreview(null)
      toast.success('Foto profil dihapus.')
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        photo: pendingPhotoKey ?? undefined,
      }),
    onSuccess: (u) => {
      setUser(u)
      qc.invalidateQueries({ queryKey: ['me'] })
      setPendingPhotoKey(null)
      setPendingPhotoPreview(null)
      toast.success('Profil berhasil diperbarui.')
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error('Format harus JPG, PNG, atau WEBP.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimum 5 MB.')
      return
    }
    upload.mutate(f)
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    handleFile(f)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const photo = pendingPhotoPreview ?? me.data?.photo_url ?? null
  const initials =
    (me.data?.name ?? '?')
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  const dirty =
    pendingPhotoKey !== null ||
    name.trim() !== (me.data?.name ?? '') ||
    email.trim() !== (me.data?.email ?? '')

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola identitas, foto, dan informasi akun."
      />

      {me.isLoading ? (
        <div className="flex justify-center p-10">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <HiOutlineIdentification className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Informasi Akun
                </h3>
                <p className="text-xs text-slate-500">
                  Foto, nama tampilan, dan email yang dipakai untuk login.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0 self-center sm:self-auto">
                {photo ? (
                  <img
                    src={photo}
                    alt={me.data?.name ?? ''}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
                    {initials}
                  </div>
                )}
                {pendingPhotoKey ? (
                  <span
                    className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
                    title="Foto baru menunggu disimpan"
                  >
                    <HiOutlineCheckCircle className="h-4 w-4" />
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h2 className="truncate text-base font-semibold text-slate-900">
                  {me.data?.name ?? '—'}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {me.data?.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  {me.data?.role ? (
                    <Badge tone="blue">
                      <HiOutlineShieldCheck className="mr-1 h-3 w-3" />
                      {me.data.role}
                    </Badge>
                  ) : null}
                  {me.data?.status ? (
                    <Badge tone={me.data.status === 'active' ? 'green' : 'amber'}>
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {me.data.status === 'active' ? 'Aktif' : me.data.status}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-center gap-2 sm:justify-start">
                <input
                  ref={fileRef}
                  type="file"
                  aria-label="Upload foto profil"
                  title="Upload foto profil"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPickFile}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<HiOutlineCamera className="h-4 w-4" />}
                  onClick={() => fileRef.current?.click()}
                  loading={upload.isPending}
                >
                  Ganti
                </Button>
                {me.data?.photo_url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<HiOutlineTrash className="h-4 w-4" />}
                    onClick={() => removePhoto.mutate()}
                    loading={removePhoto.isPending}
                  >
                    Hapus
                  </Button>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={
                'mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-xs transition ' +
                (isDragging
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-slate-50/60 text-slate-500 hover:border-brand-300 hover:text-brand-700')
              }
            >
              <HiOutlineCamera className="h-4 w-4" />
              <span>
                Drag &amp; drop foto di sini, atau klik untuk pilih file ·{' '}
                <span className="text-slate-400">JPG/PNG/WEBP · maks 5 MB</span>
              </span>
            </button>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <HiOutlineUser className="h-3.5 w-3.5" /> Nama Lengkap
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <HiOutlineEnvelope className="h-3.5 w-3.5" /> Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setName(me.data?.name ?? '')
                  setEmail(me.data?.email ?? '')
                  setPendingPhotoKey(null)
                  setPendingPhotoPreview(null)
                }}
                disabled={save.isPending || !dirty}
              >
                Reset
              </Button>
              <Button
                onClick={() => save.mutate()}
                loading={save.isPending}
                disabled={!dirty}
              >
                Simpan Perubahan
              </Button>
            </div>
          </Card>

          {/* Side: Subscription + Tips */}
          <div className="space-y-4">
            <SubscriptionCard
              sub={sub.data ?? null}
              loading={sub.isLoading}
              activePlan={
                sub.data
                  ? (plans.data ?? []).find((p) => p.code === sub.data?.plan_code) ?? null
                  : null
              }
            />
            <Card>
              <div className="flex items-center gap-2">
                <HiOutlineSparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Tips Profil
                </h3>
              </div>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
                {[
                  'Gunakan nama lengkap agar mudah dikenali di laporan.',
                  'Foto profil membantu identitas saat berbagi wallet (shared).',
                  'Pastikan email aktif untuk reset password & notifikasi penting.',
                  'JPG/PNG/WEBP dengan ukuran maksimum 5 MB direkomendasikan.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Privasi Data
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Data profil hanya digunakan untuk personalisasi dalam aplikasi SAKU
                dan tidak dibagikan ke pihak ketiga. Untuk mengganti password, buka
                menu <span className="font-semibold text-slate-700">Pengaturan</span>.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function SubscriptionCard({
  sub,
  loading,
  activePlan,
}: {
  sub: import('@/features/subscription/api').Subscription | null
  loading: boolean
  activePlan?: import('@/features/subscription/api').Plan | null
}) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-900">Langganan</h3>
        </div>
        <p className="mt-3 text-xs text-slate-500">Memuat…</p>
      </Card>
    )
  }
  if (!sub) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Belum Berlangganan</h3>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Upgrade ke paket Pro untuk membuka semua fitur AI dan laporan lanjutan.
        </p>
        <Link
          to="/app/subscription"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Lihat Paket
        </Link>
      </Card>
    )
  }
  const isTrial = sub.is_trial || sub.status === 'trialing'
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
  const periodEnd = sub.ends_at ? new Date(sub.ends_at) : null
  const tone: 'green' | 'amber' | 'red' =
    sub.status === 'active' ? 'green' : isTrial ? 'amber' : 'red'
  return (
    <Card className="bg-gradient-to-br from-brand-50 via-white to-amber-50/30 ring-1 ring-brand-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900">Langganan Aktif</h3>
        </div>
        <Badge tone={tone}>
          {isTrial ? 'Trial' : sub.status === 'active' ? 'Aktif' : sub.status}
        </Badge>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-base font-bold text-slate-900">{sub.plan_name}</p>
        <p className="text-xs text-slate-500">
          {sub.currency} {sub.amount.toLocaleString('id-ID')}
        </p>
      </div>
      <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
        {isTrial && trialEnd ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">Trial berakhir</dt>
            <dd className="font-semibold text-amber-700">
              {trialEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
        {periodEnd ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">Periode hingga</dt>
            <dd className="font-semibold text-slate-700">
              {periodEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
        {sub.next_billing_at ? (
          <div className="flex justify-between">
            <dt className="text-slate-500">Tagihan berikutnya</dt>
            <dd className="font-semibold text-slate-700">
              {new Date(sub.next_billing_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
        ) : null}
      </dl>
      {activePlan && activePlan.features.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Layanan aktif
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {activePlan.features.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <HiOutlineCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link
        to="/app/subscription"
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
      >
        Kelola Langganan
      </Link>
    </Card>
  )
}
