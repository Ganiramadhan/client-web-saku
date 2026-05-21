import { api, unwrap } from '@/lib/api'
import type { AuthUser } from '@/stores/authStore'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; password: string }

interface AuthResponse { token: string; user: AuthUser }

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await api.post('/auth/login', payload))
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await api.post('/auth/register', payload))
}

export async function loginWithGoogle(idToken: string, mode: 'login' | 'register' = 'login'): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await api.post('/auth/google', { id_token: idToken, mode }))
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
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
  const fd = new FormData()
  fd.append('image', file)
  return unwrap<UploadPhotoResponse>(
    await api.post('/users/upload-photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  )
}

export async function deletePhoto(): Promise<AuthUser> {
  return unwrap<AuthUser>(await api.delete('/users/me/photo'))
}
