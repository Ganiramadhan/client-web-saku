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
  telegram_chat_id?: string
  telegram_username?: string
  cashflow_start_day?: number
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
const NON_REMEMBER_IDLE_TIMEOUT_MS = 30 * 60 * 1000

const authStorage: StateStorage = {
  getItem: (name) => {
    const persisted = localStorage.getItem(name)
    const legacy = sessionStorage.getItem(name)
    if (!persisted && legacy) {
      localStorage.setItem(name, legacy)
      sessionStorage.removeItem(name)
    }
    const value = persisted ?? legacy
    if (value && isExpiredNonRememberSession(value)) {
      localStorage.removeItem(name)
      sessionStorage.removeItem(name)
      return null
    }
    return value
  },
  setItem: (name, value) => {
    localStorage.setItem(name, value)
    sessionStorage.removeItem(name)
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

function isExpiredNonRememberSession(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as { state?: { remember?: boolean; lastActivityAt?: number | null } }
    if (parsed.state?.remember !== false) return false
    const lastActivityAt = Number(parsed.state.lastActivityAt || 0)
    return lastActivityAt <= 0 || Date.now() - lastActivityAt >= NON_REMEMBER_IDLE_TIMEOUT_MS
  } catch {
    return true
  }
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
