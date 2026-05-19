import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<{ message?: string }>) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname
      if (path.startsWith('/app') || path.startsWith('/admin')) {
        useAuthStore.getState().clear()
        window.location.assign('/login')
      }
    }
    return Promise.reject(err)
  },
)

export interface APIResponse<T> {
  status: 'success' | 'error'
  code: number
  message: string
  data?: T
  meta?: APIMeta
}

export interface APIMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export function unwrap<T>(res: AxiosResponse<APIResponse<T>>): T {
  if (res.data.status !== 'success' || res.data.data === undefined) {
    throw new Error(res.data.message || 'Request failed')
  }
  return res.data.data
}

export function unwrapList<T>(
  res: AxiosResponse<APIResponse<T[]>>,
): { data: T[]; meta: APIMeta | null } {
  if (res.data.status !== 'success') {
    throw new Error(res.data.message || 'Request failed')
  }
  return { data: res.data.data ?? [], meta: res.data.meta ?? null }
}

export function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'Network error'
  }
  if (err instanceof Error) return err.message
  return 'Unknown error'
}
