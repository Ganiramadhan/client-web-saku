import { api, unwrap } from '@/lib/api'
import { imageFileToWebP } from '@/lib/files'
import type { AuthUser } from '@/stores/authStore'

export interface LoginPayload { email: string; password: string; turnstile_token?: string }
export interface RegisterPayload {
  name: string
  email: string
  password: string
  privacy_accepted: boolean
  turnstile_token?: string
}

interface AuthResponse { token: string; user: AuthUser }
interface RegisterResponse { email: string; expires_in: number }

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await api.post('/auth/login', payload))
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return unwrap<RegisterResponse>(await api.post('/auth/register', payload))
}

export async function verifyRegistration(payload: { email: string; otp: string }): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await api.post('/auth/register/verify', payload))
}

export async function resendRegistrationOTP(email: string): Promise<void> {
  await api.post('/auth/register/resend-otp', { email })
}

export async function loginWithGoogle(idToken: string, mode: 'login' | 'register' = 'login'): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await api.post('/auth/google', { id_token: idToken, mode }))
}

export async function forgotPassword(email: string, turnstile_token?: string, resend = false): Promise<void> {
  await api.post('/auth/forgot-password', { email, turnstile_token, resend })
}

export async function resetPassword(payload: {
  email: string
  otp: string
  new_password: string
}): Promise<void> {
  await api.post('/auth/reset-password', payload)
}

export async function getMe(): Promise<AuthUser> {
  return unwrap<AuthUser>(await api.get('/users/me'))
}

export interface UpdateProfilePayload {
  name?: string
  email?: string
  photo?: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return unwrap<AuthUser>(await api.put('/users/me', payload))
}

export async function changePassword(payload: {
  current_password: string
  new_password: string
}): Promise<void> {
  await api.post('/auth/change-password', payload)
}

export interface UploadPhotoResponse {
  image: string
  preview_url: string
  preview_expires_in: number
}

export async function uploadPhoto(file: File): Promise<UploadPhotoResponse> {
  const optimized = await imageFileToWebP(file, { maxSide: 1200, quality: 0.84, filename: 'profile-photo' })
  const fd = new FormData()
  fd.append('image', optimized)
  return unwrap<UploadPhotoResponse>(
    await api.post('/users/upload-photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  )
}

export async function deletePhoto(): Promise<AuthUser> {
  return unwrap<AuthUser>(await api.delete('/users/me/photo'))
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/users/me')
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
