import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { AppInfoCard } from '../components/AppInfoCard'
import { ChangePasswordPanel } from '../components/ChangePasswordPanel'
import { LogoutPanel } from '../components/LogoutPanel'

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
