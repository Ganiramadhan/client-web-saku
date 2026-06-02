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
  payment_status?: 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed'
  payment_type?: string
  expires_at?: string | null
  payment_created_at?: string | null
  payment_paid_at?: string | null
  payment_expired_at?: string | null
  original_amount?: number
  discount_amount?: number
  voucher_code?: string
  referral_code?: string
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
  user_photo_url?: string
  user_last_login_at?: string | null
}

export interface CheckoutResponse {
  subscription_id: string
  order_id: string
  snap_token: string
  redirect_url: string
  expires_at?: string | null
  payment_status: string
  original_amount: number
  discount_amount: number
  amount: number
  voucher_code?: string
  client_key: string
  is_production: boolean
}

export interface ValidateVoucherResponse {
  code: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  original_amount: number
  discount_amount: number
  pay_amount: number
  currency: string
}

export interface Voucher {
  id: string
  code: string
  name: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number
  min_amount: number
  max_redemptions: number
  used_count: number
  starts_at?: string | null
  ends_at?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VoucherPayload = Omit<Voucher, 'id' | 'used_count' | 'created_at' | 'updated_at'>

export const subscriptionApi = {
  listPlans: async (): Promise<Plan[]> =>
    (await unwrapList<Plan>(await api.get('/subscriptions/plans'))).data,
  mySubscriptions: async (): Promise<Subscription[]> =>
    (await unwrapList<Subscription>(await api.get('/subscriptions/me'))).data,
  active: async (): Promise<Subscription | null> => {
    const res = await api.get('/subscriptions/me/active')
    return (res.data?.data ?? null) as Subscription | null
  },
  checkout: async (plan_code: string, with_trial = false, referral_code?: string, voucher_code?: string): Promise<CheckoutResponse> =>
    unwrap<CheckoutResponse>(await api.post('/subscriptions/checkout', { plan_code, with_trial, referral_code, voucher_code })),
  validateVoucher: async (plan_code: string, voucher_code: string): Promise<ValidateVoucherResponse> =>
    unwrap<ValidateVoucherResponse>(await api.post('/subscriptions/voucher/validate', { plan_code, voucher_code })),
  renewInvoice: async (id: string): Promise<CheckoutResponse> =>
    unwrap<CheckoutResponse>(await api.post(`/subscriptions/${id}/renew-invoice`)),
  confirm: async (order_id: string): Promise<Subscription> =>
    unwrap<Subscription>(await api.post('/subscriptions/confirm', { order_id })),
  cancel: async (id: string): Promise<void> => {
    await api.post(`/subscriptions/${id}/cancel`)
  },
  listAllAdmin: async (params: { page?: number; limit?: number } = {}): Promise<AdminSubscription[]> => {
    const res = await api.get('/admin/subscriptions', { params })
    return (res.data?.data ?? []) as AdminSubscription[]
  },
  listVouchersAdmin: async (params: { page?: number; limit?: number } = {}): Promise<Voucher[]> =>
    (await unwrapList<Voucher>(await api.get('/admin/vouchers', { params }))).data,
  createVoucherAdmin: async (payload: VoucherPayload): Promise<Voucher> =>
    unwrap<Voucher>(await api.post('/admin/vouchers', payload)),
  updateVoucherAdmin: async (id: string, payload: VoucherPayload): Promise<Voucher> =>
    unwrap<Voucher>(await api.put(`/admin/vouchers/${id}`, payload)),
  deleteVoucherAdmin: async (id: string): Promise<void> => {
    await api.delete(`/admin/vouchers/${id}`)
  },
}
