import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  auth_provider?: string
  phone?: string
  status?: string
  photo_url?: string
  referral_code?: string
  referral_reward?: number
  last_login_at?: string | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  remember: boolean
  lastActivityAt: number | null
  setSession: (token: string, user: AuthUser, remember?: boolean) => void
  setUser: (user: AuthUser) => void
  touch: () => void
  clear: () => void
}

const AUTH_STORAGE_KEY = 'saku-admin-auth'

const authStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    localStorage.setItem(name, value)
    sessionStorage.removeItem(name)
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      remember: true,
      lastActivityAt: null,
      setSession: (token, user, remember = true) => set({ token, user, remember, lastActivityAt: Date.now() }),
      setUser: (user) => set({ user }),
      touch: () => set((state) => (state.token ? { lastActivityAt: Date.now() } : state)),
      clear: () => set({ token: null, user: null, remember: true, lastActivityAt: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
    },
  ),
)

export function isAdminUser(u: AuthUser | null): boolean {
  return Boolean(u && u.role && (u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'super_admin'))
}

export function isSuperAdminUser(u: AuthUser | null): boolean {
  return Boolean(u && u.role && u.role.toLowerCase() === 'super_admin')
}
