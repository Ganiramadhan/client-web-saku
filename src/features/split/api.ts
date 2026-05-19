import { api, unwrap, unwrapList } from '@/lib/api'

export interface SplitBillParticipant {
  id: string
  name: string
  phone?: string
  amount: number
  paid_at?: string | null
}

export interface SplitBill {
  id: string
  owner_user_id: string
  title: string
  total_amount: number
  currency: string
  notes?: string
  participants: SplitBillParticipant[]
  created_at: string
  updated_at: string
}

export interface SplitBillParticipantInput {
  id?: string
  name: string
  phone?: string
  amount: number
}

export interface CreateSplitBillRequest {
  title: string
  total_amount: number
  currency?: string
  notes?: string
  participants: SplitBillParticipantInput[]
}

export type UpdateSplitBillRequest = CreateSplitBillRequest

export interface SplitBillShare {
  text: string
  whatsapp_url: string
}

export const splitBillApi = {
  list: async (): Promise<SplitBill[]> =>
    (await unwrapList<SplitBill>(await api.get('/split-bills/'))).data,
  get: async (id: string): Promise<SplitBill> =>
    unwrap<SplitBill>(await api.get(`/split-bills/${id}`)),
  create: async (payload: CreateSplitBillRequest): Promise<SplitBill> =>
    unwrap<SplitBill>(await api.post('/split-bills/', payload)),
  update: async (id: string, payload: UpdateSplitBillRequest): Promise<SplitBill> =>
    unwrap<SplitBill>(await api.put(`/split-bills/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/split-bills/${id}`)
  },
  markPaid: async (id: string, participantId: string, paid: boolean): Promise<void> => {
    await api.patch(`/split-bills/${id}/participants/${participantId}/paid`, { paid })
  },
  share: async (id: string, phone?: string): Promise<SplitBillShare> => {
    const params = phone ? { phone } : undefined
    return unwrap<SplitBillShare>(await api.get(`/split-bills/${id}/share`, { params }))
  },
}
