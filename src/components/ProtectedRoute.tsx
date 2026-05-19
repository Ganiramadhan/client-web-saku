import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore, isAdminUser, isSuperAdminUser } from '@/stores/authStore'

interface Props {
  children: ReactNode
  requireAdmin?: boolean
  requireSuperAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin, requireSuperAdmin }: Props) {
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (requireSuperAdmin && !isSuperAdminUser(user)) {
    return <Navigate to="/app" replace />
  }
  if (requireAdmin && !isAdminUser(user)) {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}
