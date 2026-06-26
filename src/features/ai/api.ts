import { api, unwrap, unwrapList, type APIMeta } from '@/lib/api'
import type {
  AICategorizeResponse,
  AIChatResponse,
  AIInsightsResponse,
  AIProcessingLog,
  AIScanReceiptResponse,
  AISuggestBudgetResponse,
} from '@/types/api'


export const aiLogApi = {
  list: async (
    feature?: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: AIProcessingLog[]; meta: APIMeta | null }> =>
    unwrapList<AIProcessingLog>(
      await api.get('/ai-logs', { params: { feature, page, limit } }),
    ),
  listAll: async (
    page = 1,
    limit = 20,
  ): Promise<{ data: AIProcessingLog[]; meta: APIMeta | null }> =>
    unwrapList<AIProcessingLog>(
      await api.get('/admin/ai-logs', { params: { page, limit } }),
    ),
  delete: async (id: string): Promise<void> => {
    await api.delete(`/ai-logs/${id}`)
  },
  deleteMany: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return
    await api.post('/ai-logs/bulk-delete', { ids })
  },
  chatHistory: async (page = 1, limit = 50): Promise<{ data: AIProcessingLog[]; meta: APIMeta | null }> =>
    unwrapList<AIProcessingLog>(
      await api.get('/ai/chat-history', { params: { page, limit } }),
    ),
  nlpHistory: async (page = 1, limit = 50): Promise<{ data: AIProcessingLog[]; meta: APIMeta | null }> =>
    unwrapList<AIProcessingLog>(
      await api.get('/ai/nlp-history', { params: { page, limit } }),
    ),
  scanReceiptHistory: async (page = 1, limit = 100): Promise<{ data: AIProcessingLog[]; meta: APIMeta | null }> =>
    unwrapList<AIProcessingLog>(
      await api.get('/ai/scan-receipt-history', { params: { page, limit } }),
    ),
}


export interface CategorizeRequest {
  text: string
  user_categories?: string[]
  session_id?: string
  language?: 'id' | 'en'
  reference_date?: string
  timezone?: string
}

export interface ScanReceiptRequest {
  image_base64: string
  media_type?: string
  user_categories?: string[]
}

export interface PromoteScanImageResponse {
  image_key: string
}

export interface InsightsRequest {
  from?: string
  to?: string
  limit?: number
}

export interface SuggestBudgetRequest {
  months?: number
  wallet_id?: string
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  include_context?: boolean
  history?: ChatHistoryTurn[]
  session_id?: string
  language?: 'id' | 'en'
  reference_date?: string
  timezone?: string
  cashflow_start_day?: number
}

export const aiApi = {
  categorize: async (req: CategorizeRequest): Promise<AICategorizeResponse> =>
    unwrap<AICategorizeResponse>(await api.post('/ai/categorize', req)),
  scanReceipt: async (req: ScanReceiptRequest): Promise<AIScanReceiptResponse> =>
    unwrap<AIScanReceiptResponse>(await api.post('/ai/scan-receipt', req, { timeout: 90_000 })),
  promoteScanImage: async (image_key: string, log_id?: string): Promise<PromoteScanImageResponse> =>
    unwrap<PromoteScanImageResponse>(await api.post('/ai/scan-receipt/promote-image', { image_key, log_id })),
  insights: async (req: InsightsRequest): Promise<AIInsightsResponse> =>
    unwrap<AIInsightsResponse>(await api.post('/ai/insights', req)),
  suggestBudget: async (req: SuggestBudgetRequest): Promise<AISuggestBudgetResponse> =>
    unwrap<AISuggestBudgetResponse>(await api.post('/ai/suggest-budget', req)),
  chat: async (req: ChatRequest): Promise<AIChatResponse> =>
    unwrap<AIChatResponse>(await api.post('/ai/chat', req)),
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',', 2)[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
