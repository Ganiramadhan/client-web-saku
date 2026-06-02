import { api, unwrap, unwrapList } from '@/lib/api'
import type { Wallet, WalletTransfer, WalletType } from '@/types/api'

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

export interface WalletTransferPayload {
  from_wallet_id: string
  to_wallet_id: string
  amount: number
  clear_source_target?: boolean
  note?: string
}

export const walletApi = {
  list: async (): Promise<Wallet[]> =>
    (await unwrapList<Wallet>(await api.get('/wallets'))).data,
  transfers: async (limit = 20): Promise<WalletTransfer[]> =>
    (await unwrapList<WalletTransfer>(await api.get('/wallets/transfers', { params: { limit } }))).data,
  get: async (id: string): Promise<Wallet> =>
    unwrap<Wallet>(await api.get(`/wallets/${id}`)),
  create: async (payload: WalletPayload): Promise<Wallet> =>
    unwrap<Wallet>(await api.post('/wallets', payload)),
  update: async (id: string, payload: Partial<WalletPayload>): Promise<Wallet> =>
    unwrap<Wallet>(await api.put(`/wallets/${id}`, payload)),
  transfer: async (payload: WalletTransferPayload): Promise<void> => {
    await api.post('/wallets/transfer', payload)
  },
  deleteTransfers: async (ids: string[]): Promise<void> => {
    await api.delete('/wallets/transfers', { data: { ids } })
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/wallets/${id}`)
  },
}
