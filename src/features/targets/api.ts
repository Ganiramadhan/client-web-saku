import { api, unwrap, unwrapList } from '@/lib/api'
import type { SavingsGoal, SavingsGoalContribution } from '@/types/api'

export interface SavingsGoalPayload {
  name: string
  description?: string
  target_amount: number
  deadline?: string | null
  wallet_id?: string | null
  icon?: string
  color?: string
}

export interface SavingsGoalUpdatePayload extends Partial<SavingsGoalPayload> {}

export interface ContributePayload {
  amount: number
  note?: string
}

export const savingsGoalApi = {
  list: async (): Promise<SavingsGoal[]> =>
    (await unwrapList<SavingsGoal>(await api.get('/savings-goals'))).data,
  get: async (id: string): Promise<SavingsGoal> =>
    unwrap<SavingsGoal>(await api.get(`/savings-goals/${id}`)),
  create: async (payload: SavingsGoalPayload): Promise<SavingsGoal> =>
    unwrap<SavingsGoal>(await api.post('/savings-goals', payload)),
  update: async (id: string, payload: SavingsGoalUpdatePayload): Promise<SavingsGoal> =>
    unwrap<SavingsGoal>(await api.put(`/savings-goals/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/savings-goals/${id}`)
  },
  contribute: async (id: string, payload: ContributePayload): Promise<SavingsGoal> =>
    unwrap<SavingsGoal>(await api.post(`/savings-goals/${id}/contribute`, payload)),
  contributions: async (id: string): Promise<SavingsGoalContribution[]> =>
    (await unwrapList<SavingsGoalContribution>(await api.get(`/savings-goals/${id}/contributions`))).data,
}
