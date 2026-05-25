import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { logApiError, logApiResponse, markApiRequest } from './apiLogger'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 30_000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  markApiRequest(config)
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res: AxiosResponse) => {
    logApiResponse(res)
    return res
  },
  (err: AxiosError<{ message?: string }>) => {
    logApiError(err)
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
  const locale = currentLocale()
  if (axios.isAxiosError(err)) {
    return translateApiMessage(err.response?.data?.message || err.message || 'Network error', locale)
  }
  if (err instanceof Error) return translateApiMessage(err.message, locale)
  return locale === 'id' ? 'Terjadi kesalahan' : 'Unknown error'
}

function currentLocale(): 'id' | 'en' {
  if (typeof window === 'undefined') return 'en'
  try {
    const raw = window.localStorage.getItem('saku-locale')
    const parsed = raw ? JSON.parse(raw) : null
    const locale = parsed?.state?.locale
    return locale === 'id' ? 'id' : 'en'
  } catch {
    return 'en'
  }
}

function translateApiMessage(message: string, locale: 'id' | 'en'): string {
  if (locale === 'en') return message
  const normalized = message.trim()
  const map: Record<string, string> = {
    'Free plan can create up to 2 wallets. Upgrade to Pro for unlimited wallets':
      'Paket Free bisa membuat maksimal 2 wallet. Upgrade ke Pro untuk kapasitas wallet lebih besar.',
    'Free plan can create up to 2 wallets. Upgrade to Pro for more wallets':
      'Paket Free bisa membuat maksimal 2 wallet. Upgrade ke Pro untuk kapasitas wallet lebih besar.',
    'Pro plan can create up to 10 wallets. Upgrade to Premium for more wallets':
      'Paket Pro bisa membuat maksimal 10 wallet. Upgrade ke Premium untuk kapasitas wallet lebih besar.',
    'Premium plan can create up to 50 wallets':
      'Paket Premium bisa membuat maksimal 50 wallet.',
    'Free plan can use Chat with AI up to 5 times per day. Upgrade to Pro for unlimited AI chat':
      'Paket Free bisa memakai Chat with AI maksimal 5 kali per hari. Upgrade ke Pro untuk kuota AI lebih besar.',
    'Free plan can scan receipts up to 3 times per day. Upgrade to Pro for unlimited receipt scanning':
      'Paket Free bisa scan struk maksimal 3 kali per hari. Upgrade ke Pro untuk kuota scan lebih besar.',
    'Free plan can create up to 3 upcoming billings. Upgrade to Pro for more billing reminders':
      'Paket Free bisa membuat maksimal 3 upcoming billing. Upgrade ke Pro untuk reminder billing lebih banyak.',
    'Pro plan can create up to 20 upcoming billings. Upgrade to Premium for more billing reminders':
      'Paket Pro bisa membuat maksimal 20 upcoming billing. Upgrade ke Premium untuk reminder billing lebih banyak.',
    'Premium plan can create up to 100 upcoming billings':
      'Paket Premium bisa membuat maksimal 100 upcoming billing.',
    'Pro plan monthly AI limit reached. Upgrade to Premium for more AI prompts':
      'Kuota AI bulanan paket Pro sudah habis. Upgrade ke Premium untuk prompt AI lebih banyak.',
    'Pro plan monthly receipt scan limit reached. Upgrade to Premium for more receipt scans':
      'Kuota scan struk bulanan paket Pro sudah habis. Upgrade ke Premium untuk scan lebih banyak.',
    'Premium plan monthly AI limit reached':
      'Kuota AI bulanan paket Premium sudah habis.',
    'Premium plan monthly receipt scan limit reached':
      'Kuota scan struk bulanan paket Premium sudah habis.',
    'Source wallet has an active target. Confirm target removal before transferring balance':
      'Wallet sumber memiliki target aktif. Konfirmasi penghapusan target sebelum memindahkan saldo.',
    'Source wallet balance is not enough': 'Saldo wallet sumber tidak cukup.',
    'Source and destination wallets must be different': 'Wallet sumber dan tujuan harus berbeda.',
    'Wallet currencies must match': 'Mata uang wallet harus sama.',
    'account is not verified': 'Akun belum diverifikasi. Masukkan kode OTP dari email untuk menyelesaikan pendaftaran.',
    'invalid credentials': 'Email atau password tidak sesuai.',
    'invalid or expired OTP code': 'Kode OTP tidak valid atau sudah kedaluwarsa.',
    'registration requires a Gmail address': 'Registrasi wajib menggunakan alamat Gmail agar OTP bisa diterima dengan aman.',
  }
  return map[normalized] ?? message
}

export function getErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

export function getRetryAfterSeconds(err: unknown): number | undefined {
  if (!axios.isAxiosError(err)) return undefined
  const raw = err.response?.headers?.['retry-after']
  const value = Array.isArray(raw) ? raw[0] : raw
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}
