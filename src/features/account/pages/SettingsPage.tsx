import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HiOutlineBell,
  HiOutlineChevronRight,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineKey,
  HiOutlineLanguage,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineWallet,
} from 'react-icons/hi2'
import { Button, Card, Input, Modal, PageHeader, RSelect } from '@/components/ui'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { changeEmail, deleteAccount, logout } from '@/features/auth/api'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { toErrorMessage } from '@/lib/api'
import { AppInfoCard } from '../components/AppInfoCard'
import { ChangePasswordPanel } from '../components/ChangePasswordPanel'
import { DeleteAccountPanel } from '../components/DeleteAccountPanel'
import { LogoutPanel } from '../components/LogoutPanel'

export function SettingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const clearSession = useAuthStore((s) => s.clear)
  const { locale, setLocale } = useLocale()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [nextEmail, setNextEmail] = useState(user?.email ?? '')
  const [emailPassword, setEmailPassword] = useState('')
  const content = locale === 'id'
    ? {
        title: 'Pengaturan',
        subtitle: 'Atur akun, preferensi, AI, notifikasi, dan keamanan dari satu tempat.',
        account: 'Account',
        accountDesc: 'Identitas akun dan akses dasar.',
        preferences: 'Preferences',
        preferencesDesc: 'Cara SAKU menampilkan data dan bahasa.',
        ai: 'AI Settings',
        aiDesc: 'Preferensi default untuk fitur AI dan OCR.',
        notifications: 'Notification',
        notificationsDesc: 'Pengingat penting dari email, billing, dan Telegram.',
        security: 'Security',
        securityDesc: 'Password, sesi login, dan penghapusan akun.',
      }
    : {
        title: 'Settings',
        subtitle: 'Manage account, preferences, AI, notifications, and security in one place.',
        account: 'Account',
        accountDesc: 'Account identity and access basics.',
        preferences: 'Preferences',
        preferencesDesc: 'How SAKU displays data and language.',
        ai: 'AI Settings',
        aiDesc: 'Default preferences for AI and OCR features.',
        notifications: 'Notification',
        notificationsDesc: 'Important reminders from email, billing, and Telegram.',
        security: 'Security',
        securityDesc: 'Password, login sessions, and account deletion.',
      }
  const languageOptions = [
    {
      value: 'id',
      label: '🇮🇩 Indonesia',
    },
    {
      value: 'en',
      label: '🇺🇸 English',
    },
  ] as const

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      qc.clear()
      clearSession()
      navigate('/login', { replace: true })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      qc.clear()
      clearSession()
      toast.success(locale === 'id' ? 'Akun berhasil dihapus.' : 'Account deleted successfully.')
      navigate('/', { replace: true })
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  const changeEmailMutation = useMutation({
    mutationFn: () => changeEmail({ email: nextEmail.trim(), password: emailPassword }),
    onSuccess: (updated) => {
      setUser(updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      setEmailPassword('')
      setEmailOpen(false)
      toast.success(locale === 'id' ? 'Email berhasil diperbarui.' : 'Email updated successfully.')
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  })

  useEffect(() => {
    if (!emailOpen) {
      setNextEmail(user?.email ?? '')
      setEmailPassword('')
    }
  }, [emailOpen, user?.email])

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: locale === 'id' ? 'Hapus akun permanen?' : 'Delete account permanently?',
      description:
        locale === 'id'
          ? 'Semua data akun akan dihapus dan kamu akan keluar dari SAKU.'
          : 'All account data will be deleted and you will be signed out of SAKU.',
      tone: 'danger',
      confirmLabel: locale === 'id' ? 'Hapus Akun' : 'Delete Account',
    })
    if (ok) deleteMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={content.title}
        subtitle={content.subtitle}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <SettingsGroup
            title={content.account}
            description={content.accountDesc}
            Icon={HiOutlineUser}
            items={[
              {
                label: 'Profile',
                body: 'Nama, email, dan foto profil.',
                Icon: HiOutlineUser,
                onClick: () => navigate('/app/profile'),
              },
              {
                label: 'Email',
                body: 'Alamat utama untuk login dan notifikasi.',
                Icon: HiOutlineEnvelope,
                onClick: () => setEmailOpen(true),
              },
              {
                label: 'Password',
                body: 'Kelola password manual akun.',
                Icon: HiOutlineKey,
                onClick: () => setPasswordOpen(true),
              },
            ]}
          />
          <SettingsGroup
            title={content.ai}
            description={content.aiDesc}
            Icon={HiOutlineSparkles}
            items={[
              {
                label: 'AI default wallet',
                body: 'Dompet utama untuk transaksi natural language.',
                Icon: HiOutlineWallet,
                toggle: true,
                defaultEnabled: true,
              },
              {
                label: 'AI category suggestion',
                body: 'Rekomendasi kategori sebelum transaksi disimpan.',
                Icon: HiOutlineSparkles,
                toggle: true,
                defaultEnabled: true,
              },
              {
                label: 'OCR preferences',
                body: 'Review hasil scan sebelum masuk transaksi.',
                Icon: HiOutlineCog6Tooth,
                toggle: true,
                defaultEnabled: true,
              },
            ]}
          />
        </div>
        <div className="space-y-5">
          <SettingsGroup
            title={content.preferences}
            description={content.preferencesDesc}
            Icon={HiOutlineCog6Tooth}
            items={[
              {
                label: 'Currency',
                body: 'Rupiah Indonesia sebagai format utama.',
                Icon: HiOutlineGlobeAlt,
              },
              {
                label: 'Language',
                body: 'Bahasa Indonesia / English.',
                Icon: HiOutlineLanguage,
                control: (
                  <div className="w-full sm:w-44">
                    <RSelect
                      value={locale}
                      onChange={(value) => value && setLocale(value as 'id' | 'en')}
                      options={[...languageOptions]}
                      clearable={false}
                      isSearchable={false}
                      aria-label={locale === 'id' ? 'Pilih bahasa' : 'Choose language'}
                    />
                  </div>
                ),
              },
              {
                label: 'Theme',
                body: 'Mode terang dan gelap.',
                Icon: HiOutlineCog6Tooth,
              },
            ]}
          />
          <AppInfoCard />
          <SettingsGroup
            title={content.notifications}
            description={content.notificationsDesc}
            Icon={HiOutlineBell}
            items={[
              {
                label: 'Email notification',
                body: 'OTP, pembayaran, dan update subscription.',
                Icon: HiOutlineEnvelope,
                toggle: true,
                defaultEnabled: true,
              },
              {
                label: 'Upcoming bills',
                body: 'Pengingat tagihan yang akan jatuh tempo.',
                Icon: HiOutlineBell,
                toggle: true,
                defaultEnabled: true,
              },
              {
                label: 'Telegram notification',
                body: 'Catat dan cek transaksi dari Telegram.',
                Icon: HiOutlineSparkles,
                toggle: true,
                defaultEnabled: false,
              },
            ]}
          />
          <section className="rounded-[1.5rem] border border-[#17120f]/14 bg-[#fffaf6]/72 p-4 shadow-sm shadow-[#17120f]/5">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#17120f]/10 bg-[#ffe4dc] text-brand-700">
                <HiOutlineShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#17120f]">{content.security}</h2>
                <p className="mt-1 text-xs leading-5 text-[#4f4540]">{content.securityDesc}</p>
              </div>
            </div>
            <div className="space-y-3">
              <LogoutPanel
                onLogout={() => {
                  logoutMutation.mutate()
                }}
              />
              <DeleteAccountPanel onDelete={handleDeleteAccount} loading={deleteMutation.isPending} />
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title={locale === 'id' ? 'Ubah Password' : 'Change Password'}
        description={
          locale === 'id'
            ? 'Perbarui password akun manual kamu dengan aman.'
            : 'Securely update your manual account password.'
        }
      >
        <ChangePasswordPanel showHeader={false} embedded />
      </Modal>

      <Modal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title={locale === 'id' ? 'Ganti Email' : 'Change Email'}
        description={
          locale === 'id'
            ? 'Masukkan email baru dan password akun untuk menjaga keamanan.'
            : 'Enter a new email and your account password to keep this secure.'
        }
        mobilePlacement="center"
      >
        <div className="space-y-4">
          <Input
            label={locale === 'id' ? 'Email baru' : 'New email'}
            type="email"
            value={nextEmail}
            onChange={(event) => setNextEmail(event.target.value)}
            placeholder="nama@email.com"
          />
          <Input
            label={locale === 'id' ? 'Password akun' : 'Account password'}
            type="password"
            value={emailPassword}
            onChange={(event) => setEmailPassword(event.target.value)}
            placeholder={locale === 'id' ? 'Masukkan password saat ini' : 'Enter current password'}
          />
          <div className="rounded-2xl border border-[#17120f]/10 bg-[#fff3ee] p-3 text-xs leading-5 text-[#4f4540]">
            {locale === 'id'
              ? 'Setelah email berubah, gunakan email baru untuk login dan menerima notifikasi SAKU.'
              : 'After changing it, use the new email to sign in and receive SAKU notifications.'}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEmailOpen(false)}>
              {locale === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button
              type="button"
              loading={changeEmailMutation.isPending}
              disabled={!nextEmail.trim() || !emailPassword}
              onClick={() => changeEmailMutation.mutate()}
            >
              {locale === 'id' ? 'Simpan Email' : 'Save Email'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

type SettingsItem = {
  label: string
  body: string
  Icon: typeof HiOutlineUser
  onClick?: () => void
  toggle?: boolean
  defaultEnabled?: boolean
  control?: ReactNode
}

function SettingsGroup({
  title,
  description,
  Icon,
  items,
}: {
  title: string
  description: string
  Icon: typeof HiOutlineUser
  items: SettingsItem[]
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#17120f]/10 bg-[#fddf82]/65 text-[#17120f]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-[#17120f]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[#4f4540]">{description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          item.toggle ? <ToggleSetting key={item.label} item={item} /> : <ActionSetting key={item.label} item={item} />
        ))}
      </div>
    </Card>
  )
}

function ActionSetting({ item }: { item: SettingsItem }) {
  const ItemIcon = item.Icon
  const mainContent = (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ecfdf5] text-emerald-700">
        <ItemIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#17120f]">{item.label}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#4f4540]/75">{item.body}</p>
      </div>
    </div>
  )
  const content = (
    <>
      {mainContent}
      {item.control ? <div className="w-full shrink-0 sm:w-auto">{item.control}</div> : null}
      {item.onClick ? <HiOutlineChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#4f4540]/50" /> : null}
    </>
  )
  const rowClass = cn(
    'flex w-full gap-3 rounded-2xl border border-[#17120f]/8 bg-white/58 px-3 py-3 text-left',
    item.control ? 'flex-col sm:flex-row sm:items-center' : 'items-start',
  )
  if (!item.onClick) {
    return (
      <div className={rowClass}>
        {content}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={item.onClick}
      className={cn(rowClass, 'transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-[#fff3ee] hover:shadow-sm hover:shadow-brand-100/50')}
    >
      {content}
    </button>
  )
}

function ToggleSetting({ item }: { item: SettingsItem }) {
  const [enabled, setEnabled] = useState(item.defaultEnabled ?? true)
  const ItemIcon = item.Icon
  return (
    <button
      type="button"
      onClick={() => setEnabled((value) => !value)}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#17120f]/8 bg-white/58 px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-[#fff3ee] hover:shadow-sm hover:shadow-brand-100/50"
      aria-pressed={enabled}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ecfdf5] text-emerald-700">
        <ItemIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#17120f]">{item.label}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#4f4540]/75">{item.body}</p>
      </div>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200',
          enabled ? 'bg-brand-300' : 'bg-[#17120f]/12',
        )}
      >
        <span
          className={cn(
            'block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            enabled && 'translate-x-5',
          )}
        />
      </span>
    </button>
  )
}
