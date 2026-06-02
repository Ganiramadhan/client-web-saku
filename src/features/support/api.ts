import { api, unwrap, unwrapList } from '@/lib/api'
import type { SupportPriority, SupportTicket, SupportTicketStatus } from '@/types/api'

export interface CreateSupportTicketPayload {
  subject: string
  category: string
  priority: SupportPriority
  message: string
  attachment_key?: string
  attachment_name?: string
  attachment_type?: string
}

export interface ReplySupportTicketPayload {
  message: string
  attachment_key?: string
  attachment_name?: string
  attachment_type?: string
}

export interface SupportAttachmentUpload {
  image: string
  preview_url: string
  preview_expires_in: number
}

interface SupportListParams {
  admin?: boolean
  status?: SupportTicketStatus | 'all'
}

const basePath = (admin?: boolean) => (admin ? '/admin/support-tickets' : '/support-tickets')

export const supportApi = {
  list: async ({ admin, status = 'all' }: SupportListParams = {}): Promise<SupportTicket[]> =>
    (await unwrapList<SupportTicket>(await api.get(basePath(admin), { params: { status } }))).data,
  create: async (payload: CreateSupportTicketPayload): Promise<SupportTicket> =>
    unwrap<SupportTicket>(await api.post('/support-tickets', payload)),
  reply: async (id: string, payload: ReplySupportTicketPayload, admin?: boolean): Promise<SupportTicket> =>
    unwrap<SupportTicket>(await api.post(`${basePath(admin)}/${id}/reply`, payload)),
  updateStatus: async (id: string, status: SupportTicketStatus): Promise<SupportTicket> =>
    unwrap<SupportTicket>(await api.patch(`/admin/support-tickets/${id}/status`, { status })),
  uploadAttachment: async (file: File, admin?: boolean): Promise<SupportAttachmentUpload> => {
    const form = new FormData()
    form.append('image', file)
    return unwrap<SupportAttachmentUpload>(await api.post(`${basePath(admin)}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }))
  },
}
