import { api, unwrap, unwrapList } from '@/lib/api'
import type { Category, TransactionType } from '@/types/api'

export interface CategoryPayload {
  name: string
  type: TransactionType
  icon?: string
  color?: string
}

export const categoryApi = {
  list: async (type?: TransactionType): Promise<Category[]> =>
    (await unwrapList<Category>(
      await api.get('/categories', { params: type ? { type } : {} }),
    )).data,
  get: async (id: string): Promise<Category> =>
    unwrap<Category>(await api.get(`/categories/${id}`)),
  create: async (payload: CategoryPayload): Promise<Category> =>
    unwrap<Category>(await api.post('/categories', payload)),
  update: async (id: string, payload: Partial<CategoryPayload>): Promise<Category> =>
    unwrap<Category>(await api.put(`/categories/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}
