import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui'
import { useLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import { deleteAccount, logout } from '@/features/auth/api'
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
  const clearSession = useAuthStore((s) => s.clear)
  const { locale } = useLocale()
  const content = locale === 'id'
    ? {
        title: 'Pengaturan',
        subtitle: 'Kelola password, langganan, preferensi aplikasi, dan sesi login.',
      }
    : {
        title: 'Settings',
        subtitle: 'Manage password, subscription, app preferences, and login sessions.',
      }

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

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <ChangePasswordPanel showHeader={false} />
        <div className="space-y-4">
          <AppInfoCard />
          <LogoutPanel
            onLogout={() => {
              logoutMutation.mutate()
            }}
          />
          <DeleteAccountPanel onDelete={handleDeleteAccount} loading={deleteMutation.isPending} />
        </div>
      </div>
    </div>
  )
}
