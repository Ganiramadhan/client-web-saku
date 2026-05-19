export type WalletType = 'personal' | 'business' | 'shared'
export type TransactionType = 'income' | 'expense'
export type TransactionSource = 'manual' | 'ai_ocr' | 'import' | 'api'
export type AIStatus = 'pending' | 'success' | 'failed'
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly'

export interface Wallet {
  id: string
  user_id: string
  name: string
  type: WalletType
  currency: string
  balance: number
  is_default: boolean
  target_name?: string | null
  target_amount?: number | null
  target_deadline?: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  type: TransactionType
  icon?: string
  color?: string
  is_system: boolean
}

export interface Transaction {
  id: string
  wallet_id: string
  category_id: string
  amount: number
  type: TransactionType
  description?: string
  merchant_name?: string
  transaction_date: string
  source: TransactionSource
  confidence_score?: number
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  wallet_id: string
  category_id: string
  limit_amount: number
  period: BudgetPeriod
  spent?: number
  remaining?: number
  period_start?: string
  period_end?: string
  created_at: string
  updated_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  wallet_id?: string | null
  name: string
  description?: string
  target_amount: number
  current_amount: number
  remaining: number
  progress_pct: number
  deadline?: string | null
  days_left?: number | null
  icon?: string
  color?: string
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface SavingsGoalContribution {
  id: string
  goal_id: string
  amount: number
  source: 'manual' | 'auto_income' | 'recurring'
  note?: string
  created_at: string
}

export interface AIProcessingLog {
  id: string
  user_id: string
  user_name?: string
  user_email?: string
  feature: string
  status: AIStatus
  extracted_amount?: number
  extracted_merchant?: string
  extracted_category?: string
  confidence_score?: number
  model_version?: string
  latency_ms?: number
  error_message?: string
  raw_response?: Record<string, unknown>
  image_url?: string
  created_at: string
  updated_at: string
}


export interface AICategorizeItem {
  amount: number
  merchant_name: string
  category: string
  type: TransactionType
  confidence: number
  description?: string
}

export interface AICategorizeResponse {
  amount: number
  merchant_name: string
  category: string
  type: TransactionType
  confidence: number
  needs_review: boolean
  raw_response?: Record<string, unknown>
  transactions?: AICategorizeItem[]
}

export interface AIScanReceiptResponse extends AICategorizeResponse {
  currency: string
  date: string
  ocr_text?: string
}

export interface AIInsightsResponse {
  summary: string
  top_categories: string[]
  recommendations: string[]
  anomalies: string[]
  health_score: number
  period: string
  total_income: number
  total_expense: number
  raw_response?: Record<string, unknown>
}

export interface AIBudgetSuggestion {
  category: string
  limit_amount: number
  period: BudgetPeriod
  reason: string
}

export interface AISuggestBudgetResponse {
  suggestions: AIBudgetSuggestion[]
  notes: string
  raw_response?: Record<string, unknown>
}

export interface AIChatResponse {
  reply: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status?: string
  phone?: string
  photo_url?: string
  created_at: string
  updated_at: string
}
