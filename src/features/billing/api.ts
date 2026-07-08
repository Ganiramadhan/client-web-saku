import { api, unwrap, unwrapList } from '@/lib/api'

export type BillingCycle = 'weekly' | 'monthly' | 'yearly'
export type BillingStatus = 'active' | 'paused'

export interface UpcomingBilling {
  id: string
  user_id: string
  name: string
  provider: string
  amount: number
  currency: string
  cycle: BillingCycle
  due_date: string
  status: BillingStatus
  notes: string
  created_at: string
  updated_at: string
}

export interface UpcomingBillingPayload {
  name: string
  provider?: string
  amount: number
  currency?: string
  cycle: BillingCycle
  due_date: string
  status?: BillingStatus
  notes?: string
}

export const upcomingBillingApi = {
  list: async (): Promise<UpcomingBilling[]> =>
    (await unwrapList<UpcomingBilling>(await api.get('/upcoming-billings'))).data,
  create: async (payload: UpcomingBillingPayload): Promise<UpcomingBilling> =>
    unwrap<UpcomingBilling>(await api.post('/upcoming-billings', payload)),
  update: async (id: string, payload: Partial<UpcomingBillingPayload>): Promise<UpcomingBilling> =>
    unwrap<UpcomingBilling>(await api.put(`/upcoming-billings/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/upcoming-billings/${id}`)
  },
}
