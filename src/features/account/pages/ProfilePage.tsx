import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineStar,
  HiPlus,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from 'react-icons/hi2'
import {
  Card,
  PageHeader,
  Input,
  Button,
  Spinner,
  Badge,
  Modal,
  CurrencyInput,
  DateInput,
  RSelect,
  type SelectOption,
} from '@/components/ui'
import {
  getMe,
  updateProfile,
  uploadPhoto,
  deletePhoto,
} from '@/features/auth/api'
import { subscriptionApi } from '@/features/subscription/api'
import {
  upcomingBillingApi,
  type UpcomingBilling,
  type UpcomingBillingPayload,
  type BillingCycle,
  type BillingStatus,
} from '@/features/billing/api'
import { useAuthStore } from '@/stores/authStore'
import { toErrorMessage } from '@/lib/api'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import { formatCurrency, formatDate } from '@/lib/utils'

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

const SNAP_SCRIPT_ID = 'midtrans-snap-script'

function loadSnap(clientKey: string, isProduction: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SNAP_SCRIPT_ID) as HTMLScriptElement | null
    if (existing && window.snap) {
      resolve()
      return
    }
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Snap.js')))
      return
    }
    const script = document.createElement('script')
    script.id = SNAP_SCRIPT_ID
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Snap.js'))
    document.body.appendChild(script)
  })
}

export function ProfilePage({ defaultSection = 'profile' }: { defaultSection?: 'profile' | 'billing' }) {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: getMe })
  const sub = useQuery({ queryKey: ['subscription', 'active'], queryFn: subscriptionApi.active })
  const subscriptions = useQuery({ queryKey: ['subscriptions', 'me'], queryFn: subscriptionApi.mySubscriptions })
  const plans = useQuery({ queryKey: ['subscriptions', 'plans'], queryFn: subscriptionApi.listPlans })
  const billings = useQuery({ queryKey: ['upcoming-billings'], queryFn: upcomingBillingApi.list })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pendingPhotoKey, setPendingPhotoKey] = useState<string | null>(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)
  const [editingBilling, setEditingBilling] = useState<UpcomingBilling | null>(null)
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const snapLoadedRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (me.data) {
      const timer = window.setTimeout(() => {
        setName(me.data?.name ?? '')
        setEmail(me.data?.email ?? '')
      }, 0)
      return () => window.clearTimeout(timer)
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

  const paidPlans = useMemo(
    () => (plans.data ?? []).filter((plan) => plan.price > 0 && plan.is_active),
    [plans.data],
  )
  const pendingSubscription = useMemo(
    () => (subscriptions.data ?? []).find((item) => item.status === 'pending') ?? null,
    [subscriptions.data],
  )

  const handleSubscribe = async (planCode: string, referralCode?: string) => {
    try {
      setBusyPlan(planCode)
      const checkout = await subscriptionApi.checkout(planCode, false, sanitizeReferralCode(referralCode ?? ''))
      if (!snapLoadedRef.current) {
        await loadSnap(checkout.client_key, checkout.is_production)
        snapLoadedRef.current = true
      }
      if (!window.snap) {
        window.location.href = checkout.redirect_url
        return
      }
      window.snap.pay(checkout.snap_token, {
        onSuccess: async (result) => {
          const orderId =
            result && typeof result === 'object' && 'order_id' in result
              ? String((result as { order_id?: unknown }).order_id ?? '')
              : ''
          if (orderId) await subscriptionApi.confirm(orderId)
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
          qc.invalidateQueries({ queryKey: ['subscription', 'active'] })
          navigate(`/app/subscription/thanks${orderId ? `?order_id=${encodeURIComponent(orderId)}` : ''}`)
        },
        onPending: () => {
          toast.info('Pembayaran belum selesai')
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
        },
        onError: () => toast.error('Pembayaran gagal'),
        onClose: () => {
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
        },
      })
    } catch (e) {
      toast.error(toErrorMessage(e))
    } finally {
      setBusyPlan(null)
    }
  }

  const cancelSubscription = useMutation({
    mutationFn: (id: string) => subscriptionApi.cancel(id),
    onSuccess: () => {
      toast.success('Langganan berhasil dibatalkan.')
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
      qc.invalidateQueries({ queryKey: ['subscription', 'active'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  if (defaultSection === 'billing') {
    const openCreateBilling = () => {
      setEditingBilling(null)
      setBillingOpen(true)
    }

    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Upcoming Billing"
          subtitle="Pantau tagihan rutin seperti VPS, domain, software, dan layanan berulang sebelum jatuh tempo."
          action={
            <Button onClick={openCreateBilling}>
              <HiPlus className="mr-1 h-4 w-4" />
              Tambah Billing
            </Button>
          }
        />
        <UpcomingBillingManager
          items={billings.data ?? []}
          loading={billings.isLoading}
          onCreate={openCreateBilling}
          onEdit={(item) => {
            setEditingBilling(item)
            setBillingOpen(true)
          }}
        />
        <BillingModal
          key={editingBilling?.id ?? 'new'}
          open={billingOpen}
          editing={editingBilling}
          onClose={() => setBillingOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pengaturan Akun"
        subtitle="Kelola profil, kode referal, dan langganan SAKU."
      />

      {me.isLoading ? (
        <div className="flex justify-center p-10">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4 border-b border-white/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <HiOutlineIdentification className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Informasi Akun
                  </h3>
                  <p className="text-xs text-slate-500">
                    Foto, nama tampilan, dan email yang dipakai untuk login.
                  </p>
                </div>
              </div>
              <Badge tone={me.data?.status === 'active' ? 'green' : 'amber'}>
                {me.data?.status === 'active' ? 'Aktif' : me.data?.status ?? 'Akun'}
              </Badge>
            </div>

            <div className="mt-5 rounded-2xl border border-white/75 bg-white/55 p-4 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0 self-center sm:self-auto">
                {photo ? (
                  <img
                    src={photo}
                    alt={me.data?.name ?? ''}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-white/80 shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white shadow-md">
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
                <h2 className="truncate text-base font-bold text-slate-900">
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
                  variant="outline"
                  size="sm"
                  leftIcon={<HiOutlineCamera className="h-4 w-4" />}
                  onClick={() => fileRef.current?.click()}
                  loading={upload.isPending}
                  className="transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Ganti
                </Button>
                {me.data?.photo_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<HiOutlineTrash className="h-4 w-4" />}
                    onClick={() => removePhoto.mutate()}
                    loading={removePhoto.isPending}
                    className="border-rose-100 text-rose-700 transition hover:-translate-y-0.5 hover:!bg-rose-50 hover:shadow-md"
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
                  'mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-xs font-semibold transition-all duration-300 ' +
                  (isDragging
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                    : 'border-slate-200 bg-white/45 text-slate-500 hover:border-brand-400 hover:text-brand-700 hover:bg-white/75')
                }
              >
                <HiOutlineCamera className="h-4 w-4" />
                <span>
                  Drag &amp; drop foto, atau klik untuk pilih file ·{' '}
                  <span className="text-slate-400">JPG/PNG/WEBP · maks 5 MB</span>
                </span>
              </button>
            </div>

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

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/60 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 !bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-slate-50 hover:text-slate-950"
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

          </div>

          <div className="space-y-4">
          <ReferralCard
            code={me.data?.referral_code}
            reward={me.data?.referral_reward ?? 0}
          />
          <SubscriptionCard
            sub={sub.data ?? null}
            pendingSub={pendingSubscription}
            loading={sub.isLoading}
            plans={paidPlans}
            plansLoading={plans.isLoading}
            busyPlan={busyPlan}
            onSubscribe={handleSubscribe}
            onCancel={async (id) => {
              const ok = await confirm({
                title: 'Batalkan langganan?',
                description: 'Langganan aktif akan dibatalkan dan fitur berbayar akan mengikuti status paket setelah proses selesai.',
                tone: 'danger',
                confirmLabel: 'Batalkan Langganan',
              })
              if (ok) cancelSubscription.mutate(id)
            }}
            cancelLoading={cancelSubscription.isPending}
            activePlan={
              sub.data
                ? (plans.data ?? []).find((p) => p.code === sub.data?.plan_code) ?? null
                : null
            }
          />

          </div>
        </div>
      )}

      <BillingModal
        key={editingBilling?.id ?? 'new'}
        open={billingOpen}
        editing={editingBilling}
        onClose={() => setBillingOpen(false)}
      />
    </div>
  )
}

function ReferralCard({ code, reward }: { code?: string; reward: number }) {
  const rows = [
    { label: 'Kode referal', value: code || 'Login ulang untuk membuat kode' },
    { label: 'Reward', value: formatCurrency(reward, 'IDR') },
  ]

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineStar className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-900">Kode Referal</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Bagikan kode ini. Reward masuk saat pengguna lain membayar langganan dengan kode kamu.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-white/80 bg-white/60 shadow-sm">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label}>
                <th className="w-36 bg-slate-50/70 px-3 py-2 font-semibold text-slate-500">
                  {row.label}
                </th>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  <span className={row.label === 'Kode referal' ? 'font-mono tracking-wide' : undefined}>
                    {row.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function SubscriptionCard({
  sub,
  pendingSub,
  loading,
  activePlan,
  plans,
  plansLoading,
  busyPlan,
  onSubscribe,
  onCancel,
  cancelLoading,
}: {
  sub: import('@/features/subscription/api').Subscription | null
  pendingSub: import('@/features/subscription/api').Subscription | null
  loading: boolean
  activePlan?: import('@/features/subscription/api').Plan | null
  plans: import('@/features/subscription/api').Plan[]
  plansLoading: boolean
  busyPlan: string | null
  onSubscribe: (planCode: string, referralCode?: string) => void
  onCancel: (id: string) => void
  cancelLoading: boolean
}) {
  const [referralCode, setReferralCode] = useState('')
  const cleanReferralCode = sanitizeReferralCode(referralCode)

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">Informasi Langganan</h3>
        </div>
        <p className="mt-3 text-xs text-slate-500">Memuat…</p>
      </Card>
    )
  }
  if (!sub) {
    return (
      <Card>
        {pendingSub ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-amber-900">Pembayaran Belum Selesai</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Selesaikan pembayaran untuk mengaktifkan paket {pendingSub.plan_name}.
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-900">
                  {formatCurrency(Number(pendingSub.amount), pendingSub.currency)}
                </p>
              </div>
              <Badge tone="amber">Pending</Badge>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              loading={busyPlan === pendingSub.plan_code}
              onClick={() => onSubscribe(pendingSub.plan_code, cleanReferralCode)}
            >
              Lanjutkan Pembayaran
            </Button>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlineStar className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Informasi Langganan</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Akun masih berada di paket Free. Pilih paket untuk membuka fitur AI, laporan lanjutan, dan workflow finansial yang lebih lengkap.
            </p>
          </div>
          <Badge tone="gray">Free</Badge>
        </div>
        <div className="mt-4">
          <Input
            label="Kode Referal"
            placeholder="Opsional saat pembayaran"
            value={referralCode}
            onChange={(e) => setReferralCode(sanitizeReferralCode(e.target.value))}
            maxLength={32}
          />
        </div>
        <div className="mt-4 space-y-2">
          {plansLoading ? (
            <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
              Memuat paket...
            </p>
          ) : plans.length === 0 ? (
            <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
              Paket berbayar belum tersedia.
            </p>
          ) : (
            plans.map((plan) => {
              const disabled = plan.code.includes('premium')
              return (
              <div
                key={plan.id}
                className="rounded-2xl border border-white/80 bg-white/65 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatCurrency(Number(plan.price), plan.currency)}/{plan.period === 'monthly' ? 'bulan' : 'tahun'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={disabled}
                    loading={busyPlan === plan.code}
                    onClick={() => onSubscribe(plan.code, cleanReferralCode)}
                  >
                    {disabled ? 'Segera' : 'Pilih'}
                  </Button>
                </div>
              </div>
              )
            })
          )}
        </div>
      </Card>
    )
  }
  const isTrial = sub.is_trial || sub.status === 'trialing'
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
  const periodEnd = sub.ends_at ? new Date(sub.ends_at) : null
  const tone: 'green' | 'amber' | 'red' =
    sub.status === 'active' ? 'green' : isTrial ? 'amber' : 'red'
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HiOutlineStar className="h-5 w-5 text-amber-500 animate-spin-slow" />
          <h3 className="text-sm font-bold text-slate-900">Informasi Langganan</h3>
        </div>
        <Badge tone={tone}>
          {isTrial ? 'Trial' : sub.status === 'active' ? 'Aktif' : sub.status}
        </Badge>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-base font-extrabold text-slate-950">{sub.plan_name}</p>
        <p className="text-xs font-semibold text-slate-600">
          {formatCurrency(Number(sub.amount), sub.currency)}
        </p>
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/60 pt-3 text-xs">
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
        <div className="mt-4 border-t border-white/60 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-700">
        Upcoming billing: {sub.next_billing_at
          ? new Date(sub.next_billing_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : periodEnd
            ? periodEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Belum tersedia'}
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="danger"
          size="sm"
          className="shadow-rose-200/50 transition hover:-translate-y-0.5 hover:shadow-md"
          loading={cancelLoading}
          onClick={() => onCancel(sub.id)}
        >
          Batalkan Langganan
        </Button>
      </div>
    </Card>
  )
}

function UpcomingBillingManager({
  items,
  loading,
  onCreate,
  onEdit,
}: {
  items: UpcomingBilling[]
  loading: boolean
  onCreate: () => void
  onEdit: (item: UpcomingBilling) => void
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BillingStatus>('all')
  const [cycleFilter, setCycleFilter] = useState<'all' | BillingCycle>('all')
  const remove = useMutation({
    mutationFn: upcomingBillingApi.remove,
    onSuccess: () => {
      toast.success('Tagihan rutin dihapus.')
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })
  const markPaid = useMutation({
    mutationFn: (item: UpcomingBilling) =>
      upcomingBillingApi.update(item.id, {
        due_date: nextBillingDate(item).toISOString(),
        status: 'active',
      }),
    onSuccess: () => {
      toast.success('Tagihan ditandai sudah dibayar. Jatuh tempo berikutnya diperbarui.')
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const onDelete = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: 'Hapus tagihan rutin?',
      description: `${item.name} akan dihapus dari daftar upcoming billing.`,
      tone: 'danger',
      confirmLabel: 'Hapus',
    })
    if (ok) remove.mutate(item.id)
  }

  const onMarkPaid = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: 'Tandai tagihan sudah dibayar?',
      description: `${item.name} akan dipindahkan ke jatuh tempo berikutnya sesuai siklus ${billingCycleLabel(item.cycle).toLowerCase()}.`,
      tone: 'primary',
      confirmLabel: 'Sudah Dibayar',
    })
    if (ok) markPaid.mutate(item)
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (cycleFilter !== 'all' && item.cycle !== cycleFilter) return false
      if (!query) return true
      const haystack = [item.name, item.provider, item.notes, item.currency]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [items, search, statusFilter, cycleFilter])

  return (
    <Card className="overflow-hidden bg-white/60">
      <div className="flex flex-col gap-3 border-b border-white/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
            <HiOutlineCalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Billing</h3>
            <p className="mt-0.5 text-xs text-slate-500">Catat tagihan rutin agar tidak terlewat saat jatuh tempo.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-white/80 bg-white/55 p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, provider, atau catatan..."
            className="pr-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="Bersihkan pencarian"
              title="Bersihkan pencarian"
            >
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <RSelect
          value={statusFilter}
          options={[
            { value: 'all', label: 'Semua Status' },
            { value: 'active', label: 'Aktif' },
            { value: 'paused', label: 'Paused' },
          ]}
          onChange={(value) => setStatusFilter((value as 'all' | BillingStatus) ?? 'all')}
        />
        <RSelect
          value={cycleFilter}
          options={[
            { value: 'all', label: 'Semua Siklus' },
            { value: 'weekly', label: 'Mingguan' },
            { value: 'monthly', label: 'Bulanan' },
            { value: 'yearly', label: 'Tahunan' },
          ]}
          onChange={(value) => setCycleFilter((value as 'all' | BillingCycle) ?? 'all')}
        />
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-xs text-slate-500">
            Memuat tagihan...
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">
              Belum ada tagihan rutin. Tambahkan VPS, domain, software, atau layanan berulang agar cashflow mendatang lebih mudah dipantau.
            </p>
            <Button className="mt-4" onClick={onCreate}>
              <HiPlus className="mr-1 h-4 w-4" />
              Tambah Billing
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-5 text-sm text-slate-500">
            Tidak ada tagihan rutin yang cocok dengan filter.
          </div>
        ) : (
          <>
          <p className="px-1 text-xs font-semibold text-slate-400">
            Menampilkan {filteredItems.length} dari {items.length} tagihan
          </p>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/80 bg-white/75 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {item.provider || 'Tanpa provider'} · {billingCycleLabel(item.cycle)}
                  </p>
                </div>
                <Badge tone={item.status === 'active' ? 'green' : 'amber'}>
                  {item.status === 'active' ? 'Aktif' : 'Paused'}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nominal</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">
                      {formatCurrency(Number(item.amount), item.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-2 ring-1 ring-blue-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Jatuh Tempo</p>
                    <p className="mt-1 text-sm font-extrabold text-blue-800">{formatDate(item.due_date)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    className="!bg-emerald-600 shadow-emerald-200/60 hover:!bg-emerald-700 focus:ring-emerald-500/40"
                    leftIcon={<HiOutlineCheckCircle className="h-4 w-4" />}
                    onClick={() => onMarkPaid(item)}
                    loading={markPaid.isPending}
                    disabled={item.status !== 'active'}
                  >
                    Sudah Dibayar
                  </Button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-700"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-lg p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700"
                    title="Hapus"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </>
        )}
      </div>
    </Card>
  )
}

function billingCycleLabel(cycle: BillingCycle): string {
  if (cycle === 'weekly') return 'Mingguan'
  if (cycle === 'yearly') return 'Tahunan'
  return 'Bulanan'
}

function nextBillingDate(item: UpcomingBilling): Date {
  const date = new Date(item.due_date)
  if (item.cycle === 'weekly') date.setDate(date.getDate() + 7)
  else if (item.cycle === 'yearly') date.setFullYear(date.getFullYear() + 1)
  else date.setMonth(date.getMonth() + 1)
  return date
}

function sanitizeReferralCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function BillingModal({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing: UpcomingBilling | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<UpcomingBillingPayload>(() => ({
    name: editing?.name ?? '',
    provider: editing?.provider ?? '',
    amount: editing ? Number(editing.amount) : 0,
    currency: editing?.currency ?? 'IDR',
    cycle: editing?.cycle ?? 'monthly',
    due_date: editing?.due_date ? editing.due_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: editing?.status ?? 'active',
    notes: editing?.notes ?? '',
  }))

  const saveBilling = useMutation({
    mutationFn: () => {
      const payload: UpcomingBillingPayload = {
        ...form,
        due_date: new Date(`${form.due_date}T00:00:00`).toISOString(),
      }
      return editing
        ? upcomingBillingApi.update(editing.id, payload)
        : upcomingBillingApi.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Tagihan rutin diperbarui.' : 'Tagihan rutin ditambahkan.')
      qc.invalidateQueries({ queryKey: ['upcoming-billings'] })
      onClose()
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Upcoming Billing' : 'Tambah Upcoming Billing'}
      description="Catat tagihan rutin agar pengeluaran mendatang lebih mudah dipantau."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button loading={saveBilling.isPending} onClick={() => saveBilling.mutate()}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nama Tagihan"
            placeholder="Netflix, VPS, Domain"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Provider"
            placeholder="AWS, Netflix, Niagahoster"
            value={form.provider ?? ''}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          />
        </div>
        <CurrencyInput
          label="Nominal (IDR)"
          value={Number(form.amount) || 0}
          onChange={(value) => setForm({ ...form, amount: value })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <RSelect
            label="Siklus"
            value={form.cycle}
            options={[
              { value: 'weekly', label: 'Mingguan' },
              { value: 'monthly', label: 'Bulanan' },
              { value: 'yearly', label: 'Tahunan' },
            ] as SelectOption[]}
            onChange={(value) => setForm({ ...form, cycle: (value ?? 'monthly') as BillingCycle })}
          />
          <DateInput
            label="Tanggal Jatuh Tempo"
            value={form.due_date || null}
            onChange={(date) => setForm({ ...form, due_date: date ? date.toISOString().slice(0, 10) : '' })}
            placeholderText="Pilih tanggal jatuh tempo"
          />
          <RSelect
            label="Status"
            value={form.status ?? 'active'}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'paused', label: 'Paused' },
            ] as SelectOption[]}
            onChange={(value) => setForm({ ...form, status: (value ?? 'active') as BillingStatus })}
          />
        </div>
        <Input
          label="Catatan"
          placeholder="Opsional"
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </Modal>
  )
}
