import { api, unwrapList } from '@/lib/api'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  ref_type: string
  ref_id: string
  read_at?: string | null
  created_at: string
}

export const notificationApi = {
  list: async (limit = 20): Promise<NotificationItem[]> =>
    (await unwrapList<NotificationItem>(await api.get('/notifications', { params: { limit } }))).data,
  markRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`)
  },
  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all')
  },
}
