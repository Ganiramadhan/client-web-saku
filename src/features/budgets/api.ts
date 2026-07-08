import { api, unwrap, unwrapList } from '@/lib/api'
import type { Budget, BudgetPeriod } from '@/types/api'

export interface BudgetPayload {
  wallet_id: string
  category_id: string
  limit_amount: number
  period: BudgetPeriod
}

export const budgetApi = {
  list: async (): Promise<Budget[]> =>
    (await unwrapList<Budget>(await api.get('/budgets'))).data,
  create: async (payload: BudgetPayload): Promise<Budget> =>
    unwrap<Budget>(await api.post('/budgets', payload)),
  update: async (id: string, payload: Partial<BudgetPayload>): Promise<Budget> =>
    unwrap<Budget>(await api.put(`/budgets/${id}`, payload)),
}
