import { api, unwrap, unwrapList, type APIMeta } from '@/lib/api'
import type { AdminUser } from '@/types/api'

export interface AdminUserPayload {
  name: string
  email: string
  password?: string
  role?: string
  phone?: string
  status?: string
}

export const adminUserApi = {
  list: async (params: { page?: number; limit?: number; q?: string } = {}): Promise<{
    data: AdminUser[]
    meta: APIMeta | null
  }> => unwrapList<AdminUser>(await api.get('/admin/users', { params })),
  get: async (id: string): Promise<AdminUser> =>
    unwrap<AdminUser>(await api.get(`/admin/users/${id}`)),
  create: async (payload: AdminUserPayload): Promise<AdminUser> =>
    unwrap<AdminUser>(await api.post('/admin/users', payload)),
  update: async (id: string, payload: Partial<AdminUserPayload>): Promise<AdminUser> =>
    unwrap<AdminUser>(await api.put(`/admin/users/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`)
  },
}
