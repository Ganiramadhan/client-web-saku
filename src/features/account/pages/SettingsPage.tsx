import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { useLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'
import { AppInfoCard } from '../components/AppInfoCard'
import { ChangePasswordPanel } from '../components/ChangePasswordPanel'
import { LogoutPanel } from '../components/LogoutPanel'

export function SettingsPage() {
  const navigate = useNavigate()
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
              clearSession()
              navigate('/login', { replace: true })
            }}
          />
        </div>
      </div>
    </div>
  )
}
