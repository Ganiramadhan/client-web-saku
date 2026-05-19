import { api, unwrap, unwrapList } from '@/lib/api'
import type { Wallet, WalletType } from '@/types/api'

export interface WalletPayload {
  name: string
  type: WalletType
  currency?: string
  balance?: number
  is_default?: boolean
  target_name?: string | null
  target_amount?: number | null
  target_deadline?: string | null
}

export const walletApi = {
  list: async (): Promise<Wallet[]> =>
    (await unwrapList<Wallet>(await api.get('/wallets'))).data,
  get: async (id: string): Promise<Wallet> =>
    unwrap<Wallet>(await api.get(`/wallets/${id}`)),
  create: async (payload: WalletPayload): Promise<Wallet> =>
    unwrap<Wallet>(await api.post('/wallets', payload)),
  update: async (id: string, payload: Partial<WalletPayload>): Promise<Wallet> =>
    unwrap<Wallet>(await api.put(`/wallets/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/wallets/${id}`)
  },
}
