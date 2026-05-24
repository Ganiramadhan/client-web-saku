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
} from 'react-icons/hi2'
import {
  Card,
  PageHeader,
  Input,
  Button,
  Spinner,
  Badge,
} from '@/components/ui'
import { useLocale } from '@/i18n'
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
import { confirm } from '@/lib/confirm'
import { loadSnap } from '@/lib/snap'
import { sanitizeReferralCode } from '../utils/billing'
import {
  ReferralCard,
  SubscriptionCard,
} from '../components/ProfilePanels'

export function ProfilePage() {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Pengaturan Akun',
        subtitle: 'Kelola profil, kode referal, dan langganan SAKU.',
        photoUploaded: 'Foto berhasil diunggah, klik Simpan untuk menerapkan.',
        photoDeleted: 'Foto profil dihapus.',
        profileUpdated: 'Profil berhasil diperbarui.',
        invalidFormat: 'Format harus JPG, PNG, atau WEBP.',
        maxSize: 'Ukuran maksimum 5 MB.',
        paymentPending: 'Pembayaran belum selesai',
        paymentFailed: 'Pembayaran gagal',
        subCanceled: 'Langganan berhasil dibatalkan.',
        accountInfo: 'Informasi Akun',
        accountInfoDesc: 'Foto, nama tampilan, dan email yang dipakai untuk login.',
        active: 'Aktif',
        account: 'Akun',
        uploadTitle: 'Upload foto profil',
        change: 'Ganti',
        delete: 'Hapus',
        dragPhoto: 'Drag & drop foto, atau klik untuk pilih file',
        fullName: 'Nama Lengkap',
        fullNamePlaceholder: 'Nama lengkap',
        reset: 'Reset',
        save: 'Simpan Perubahan',
        cancelTitle: 'Batalkan langganan?',
        cancelDesc: 'Langganan aktif akan dibatalkan dan fitur berbayar akan mengikuti status paket setelah proses selesai.',
        cancelConfirm: 'Batalkan Langganan',
      }
    : {
        title: 'Account Settings',
        subtitle: 'Manage your profile, referral code, and SAKU subscription.',
        photoUploaded: 'Photo uploaded. Click Save to apply it.',
        photoDeleted: 'Profile photo deleted.',
        profileUpdated: 'Profile updated.',
        invalidFormat: 'Format must be JPG, PNG, or WEBP.',
        maxSize: 'Maximum size is 5 MB.',
        paymentPending: 'Payment is still pending',
        paymentFailed: 'Payment failed',
        subCanceled: 'Subscription canceled.',
        accountInfo: 'Account Information',
        accountInfoDesc: 'Photo, display name, and email used for login.',
        active: 'Active',
        account: 'Account',
        uploadTitle: 'Upload profile photo',
        change: 'Change',
        delete: 'Delete',
        dragPhoto: 'Drag and drop photo, or click to choose a file',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Full name',
        reset: 'Reset',
        save: 'Save Changes',
        cancelTitle: 'Cancel subscription?',
        cancelDesc: 'The active subscription will be canceled and paid features will follow the plan status after the process is complete.',
        cancelConfirm: 'Cancel Subscription',
      }
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: getMe })
  const sub = useQuery({ queryKey: ['subscription', 'active'], queryFn: subscriptionApi.active })
  const subscriptions = useQuery({ queryKey: ['subscriptions', 'me'], queryFn: subscriptionApi.mySubscriptions })
  const plans = useQuery({ queryKey: ['subscriptions', 'plans'], queryFn: subscriptionApi.listPlans })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pendingPhotoKey, setPendingPhotoKey] = useState<string | null>(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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
      toast.success(copy.photoUploaded)
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
      toast.success(copy.photoDeleted)
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
      toast.success(copy.profileUpdated)
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error(copy.invalidFormat)
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(copy.maxSize)
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
          toast.info(copy.paymentPending)
          qc.invalidateQueries({ queryKey: ['subscriptions'] })
          qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
        },
        onError: () => toast.error(copy.paymentFailed),
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
      toast.success(copy.subCanceled)
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
      qc.invalidateQueries({ queryKey: ['subscription', 'active'] })
    },
    onError: (e) => toast.error(toErrorMessage(e)),
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
      />

      {me.isLoading ? (
        <div className="flex justify-center p-10">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">
          <Card className="bg-white/72">
            <div className="flex items-start justify-between gap-4 border-b border-white/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <HiOutlineIdentification className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {copy.accountInfo}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {copy.accountInfoDesc}
                  </p>
                </div>
              </div>
              <Badge tone={me.data?.status === 'active' ? 'green' : 'amber'}>
                {me.data?.status === 'active' ? copy.active : me.data?.status ?? copy.account}
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
                    title={copy.photoUploaded}
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
                      {me.data.status === 'active' ? copy.active : me.data.status}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-center gap-2 sm:justify-start">
                <input
                  ref={fileRef}
                  type="file"
                  aria-label={copy.uploadTitle}
                  title={copy.uploadTitle}
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
                  {copy.change}
                </Button>
                {me.data?.photo_url ? (
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<HiOutlineTrash className="h-4 w-4" />}
                    onClick={() => removePhoto.mutate()}
                    loading={removePhoto.isPending}
                    className="shadow-rose-200/50 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                  {copy.delete}
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
                  {copy.dragPhoto} ·{' '}
                  <span className="text-slate-400">JPG/PNG/WEBP · maks 5 MB</span>
                </span>
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <HiOutlineUser className="h-3.5 w-3.5" /> {copy.fullName}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.fullNamePlaceholder}
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

            <div className="mt-6 grid gap-2 border-t border-white/60 pt-5 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => {
                  setName(me.data?.name ?? '')
                  setEmail(me.data?.email ?? '')
                  setPendingPhotoKey(null)
                  setPendingPhotoPreview(null)
                }}
                disabled={save.isPending || !dirty}
              >
                {copy.reset}
              </Button>
              <Button
                className="transition hover:-translate-y-0.5 hover:shadow-md"
                type="button"
                variant="primary"
                onClick={() => save.mutate()}
                loading={save.isPending}
                disabled={!dirty}
              >
                {copy.save}
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
                title: copy.cancelTitle,
                description: copy.cancelDesc,
                tone: 'danger',
                confirmLabel: copy.cancelConfirm,
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

    </div>
  )
}

export default ProfilePage
