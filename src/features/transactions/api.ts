import { api, unwrap, unwrapList, type APIMeta } from '@/lib/api'
import type { Transaction, TransactionSource, TransactionType } from '@/types/api'

export interface TransactionPayload {
  wallet_id: string
  category_id: string
  amount: number
  type: TransactionType
  description?: string
  merchant_name?: string
  transaction_date: string
  source?: TransactionSource
  confidence_score?: number
}

export interface TransactionUpdatePayload {
  wallet_id?: string
  category_id?: string
  amount?: number
  type?: TransactionType
  description?: string
  merchant_name?: string
  transaction_date?: string
}

export interface TransactionListQuery {
  wallet_id?: string
  category_id?: string
  type?: TransactionType
  from?: string
  to?: string
  q?: string
  page?: number
  limit?: number
}

export const transactionApi = {
  list: async (
    q: TransactionListQuery = {},
  ): Promise<{ data: Transaction[]; meta: APIMeta | null }> =>
    unwrapList<Transaction>(await api.get('/transactions', { params: q })),
  get: async (id: string): Promise<Transaction> =>
    unwrap<Transaction>(await api.get(`/transactions/${id}`)),
  create: async (payload: TransactionPayload): Promise<Transaction> =>
    unwrap<Transaction>(await api.post('/transactions', payload)),
  update: async (id: string, payload: TransactionUpdatePayload): Promise<Transaction> =>
    unwrap<Transaction>(await api.put(`/transactions/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`)
  },
  exportXlsx: async (
    q: Omit<TransactionListQuery, 'page' | 'limit'> & { month?: string } = {},
  ): Promise<Blob> => {
    const res = await api.get('/transactions/export', {
      params: q,
      responseType: 'blob',
    })
    return res.data as Blob
  },
}
