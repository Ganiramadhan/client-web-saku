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
  HiOutlinePlus,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineCog6Tooth,
  HiOutlineMoon,
  HiOutlineInformationCircle,
  HiOutlineArrowRightOnRectangle,
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
import { cn, formatCurrency, formatDate } from '@/lib/utils'

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
  const clearSession = useAuthStore((s) => s.clear)
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

  const handleSubscribe = async (planCode: string) => {
    try {
      setBusyPlan(planCode)
      const checkout = await subscriptionApi.checkout(planCode)
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
          toast.info('Menunggu pembayaran')
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
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Upcoming Billing"
          subtitle="Pantau tagihan rutin seperti VPS, domain, software, dan layanan berulang sebelum jatuh tempo."
        />
        <UpcomingBillingManager
          items={billings.data ?? []}
          loading={billings.isLoading}
          onCreate={() => {
            setEditingBilling(null)
            setBillingOpen(true)
          }}
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
        subtitle="Kelola profil, keamanan, langganan, dan preferensi aplikasi SAKU."
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

          <AppSettingsCard />
          <LogoutCard
            onLogout={() => {
              clearSession()
              navigate('/login', { replace: true })
            }}
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
  onSubscribe: (planCode: string) => void
  onCancel: (id: string) => void
  cancelLoading: boolean
}) {
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
                <p className="text-sm font-extrabold text-amber-900">Pembayaran Menunggu</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Paket {pendingSub.plan_name} belum aktif karena pembayaran belum selesai.
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
              onClick={() => onSubscribe(pendingSub.plan_code)}
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
                    onClick={() => onSubscribe(plan.code)}
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
          variant="outline"
          size="sm"
          className="border-slate-200 !bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-rose-50 hover:text-rose-700 hover:shadow-md"
          loading={cancelLoading}
          onClick={() => onCancel(sub.id)}
        >
          Cancel langganan
        </Button>
      </div>
    </Card>
  )
}

function AppSettingsCard() {
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
          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white/70"
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

function LogoutCard({ onLogout }: { onLogout: () => void }) {
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
        variant="outline"
        className="mt-4 w-full border-rose-100 !bg-white text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:!bg-rose-50 hover:shadow-md"
        leftIcon={<HiOutlineArrowRightOnRectangle className="h-4 w-4" />}
        onClick={onLogout}
      >
        Logout
      </Button>
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

  const onDelete = async (item: UpcomingBilling) => {
    const ok = await confirm({
      title: 'Hapus tagihan rutin?',
      description: `${item.name} akan dihapus dari daftar upcoming billing.`,
      tone: 'danger',
      confirmLabel: 'Hapus',
    })
    if (ok) remove.mutate(item.id)
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
    <Card>
      <div className="flex flex-col gap-3 border-b border-white/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <HiOutlineCalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Billing</h3>
            <p className="mt-0.5 text-xs text-slate-500">Catat tagihan rutin agar tidak terlewat saat jatuh tempo.</p>
          </div>
        </div>
        <Button size="sm" className="shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" leftIcon={<HiOutlinePlus className="h-4 w-4" />} onClick={onCreate}>
          Tambah
        </Button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, provider, atau catatan..."
        />
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
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-5 text-sm text-slate-500">
            Belum ada tagihan rutin. Tambahkan VPS, domain, software, atau layanan berulang agar cashflow mendatang lebih mudah dipantau.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-5 text-sm text-slate-500">
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
              className="rounded-2xl border border-white/75 bg-white/60 p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {item.provider || 'Tanpa provider'} · {formatDate(item.due_date)}
                  </p>
                </div>
                <Badge tone={item.status === 'active' ? 'green' : 'amber'}>
                  {item.status === 'active' ? 'Aktif' : 'Paused'}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-slate-950">
                  {formatCurrency(Number(item.amount), item.currency)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-700"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700"
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
