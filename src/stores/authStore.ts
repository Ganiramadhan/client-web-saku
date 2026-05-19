import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  status?: string
  photo_url?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setSession: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'saku-admin-auth' },
  ),
)

export function isAdminUser(u: AuthUser | null): boolean {
  return Boolean(u && u.role && (u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'super_admin'))
}

export function isSuperAdminUser(u: AuthUser | null): boolean {
  return Boolean(u && u.role && u.role.toLowerCase() === 'super_admin')
}
