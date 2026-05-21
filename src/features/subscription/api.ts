import { api, unwrap, unwrapList } from '@/lib/api'

export type PlanPeriod = 'monthly' | 'yearly'

export interface Plan {
  id: string
  code: string
  name: string
  price: number
  currency: string
  period: PlanPeriod
  features: string[]
  is_active: boolean
}

export interface Subscription {
  id: string
  plan_id: string
  plan_code: string
  plan_name: string
  status: 'pending' | 'active' | 'trialing' | 'expired' | 'cancelled' | 'failed'
  amount: number
  currency: string
  order_id: string
  payment_type?: string
  starts_at?: string | null
  ends_at?: string | null
  paid_at?: string | null
  trial_ends_at?: string | null
  is_trial?: boolean
  next_billing_at?: string | null
  created_at: string
  updated_at: string
}

export interface AdminSubscription extends Subscription {
  user_id: string
  user_name: string
  user_email: string
}

export interface CheckoutResponse {
  subscription_id: string
  order_id: string
  snap_token: string
  redirect_url: string
  client_key: string
  is_production: boolean
}

export const subscriptionApi = {
  listPlans: async (): Promise<Plan[]> =>
    (await unwrapList<Plan>(await api.get('/subscriptions/plans'))).data,
  mySubscriptions: async (): Promise<Subscription[]> =>
    (await unwrapList<Subscription>(await api.get('/subscriptions/me'))).data,
  active: async (): Promise<Subscription | null> => {
    const res = await api.get('/subscriptions/me/active')
    return (res.data?.data ?? null) as Subscription | null
  },
  checkout: async (plan_code: string, with_trial = false): Promise<CheckoutResponse> =>
    unwrap<CheckoutResponse>(await api.post('/subscriptions/checkout', { plan_code, with_trial })),
  confirm: async (order_id: string): Promise<Subscription> =>
    unwrap<Subscription>(await api.post('/subscriptions/confirm', { order_id })),
  cancel: async (id: string): Promise<void> => {
    await api.post(`/subscriptions/${id}/cancel`)
  },
  listAllAdmin: async (params: { page?: number; limit?: number } = {}): Promise<AdminSubscription[]> => {
    const res = await api.get('/admin/subscriptions', { params })
    return (res.data?.data ?? []) as AdminSubscription[]
  },
}
