import { api, unwrap } from '@/lib/api'

export interface LandingChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface LandingChatResult {
  reply: string
}

export async function askLandingChat(
  message: string,
  history: LandingChatTurn[],
  language: 'id' | 'en',
): Promise<LandingChatResult> {
  const res = await api.post('/landing-chat', { message, history, language })
  return unwrap(res)
}
