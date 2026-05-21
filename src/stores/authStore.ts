import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

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
  remember: boolean
  setSession: (token: string, user: AuthUser, remember?: boolean) => void
  setUser: (user: AuthUser) => void
  clear: () => void
}

const AUTH_STORAGE_KEY = 'saku-admin-auth'

const authStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    let remember = true
    try {
      remember = Boolean(JSON.parse(value)?.state?.remember)
    } catch {
      remember = true
    }
    const target = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    target.setItem(name, value)
    other.removeItem(name)
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
      setSession: (token, user, remember = true) => set({ token, user, remember }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null, remember: true }),
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
