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
    const status = err.response?.status
    if (status === 502 || status === 503 || status === 504) {
      return locale === 'id'
        ? 'Layanan sedang sibuk. Coba lagi sebentar lagi.'
        : 'The service is busy. Please try again in a moment.'
    }
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
    'Pro plan includes unlimited wallets':
      'Paket Pro mencakup wallet tanpa batas.',
    'Premium plan includes unlimited wallets':
      'Paket Premium mencakup wallet tanpa batas.',
    'Free plan includes 20 AI chat prompts per month. Upgrade to Pro for 300 prompts/month':
      'Paket Free mencakup 20 prompt AI per bulan. Upgrade ke Pro untuk 300 prompt per bulan.',
    'Free plan includes 10 OCR scans per month. Upgrade to Pro for 100 scans/month':
      'Paket Free mencakup 10 scan OCR per bulan. Upgrade ke Pro untuk 100 scan per bulan.',
    'Free plan can create up to 3 upcoming billings. Upgrade to Pro for more billing reminders':
      'Paket Free bisa membuat maksimal 3 upcoming billing. Upgrade ke Pro untuk reminder billing lebih banyak.',
    'Pro plan includes unlimited upcoming billings':
      'Paket Pro mencakup upcoming billing tanpa batas.',
    'Premium plan includes unlimited upcoming billings':
      'Paket Premium mencakup upcoming billing tanpa batas.',
    'Pro plan monthly AI limit reached. Upgrade to Premium for more AI prompts':
      'Kuota AI bulanan paket Pro sudah habis. Upgrade ke Premium untuk prompt AI lebih banyak.',
    'Pro plan monthly OCR limit reached. Upgrade to Premium for more receipt scans':
      'Kuota scan struk bulanan paket Pro sudah habis. Upgrade ke Premium untuk scan lebih banyak.',
    'Premium plan monthly AI limit reached':
      'Kuota AI bulanan paket Premium sudah habis.',
    'Premium plan monthly OCR limit reached':
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
