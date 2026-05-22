import type { SplitBillParticipantInput } from '../api'

export interface SplitParticipantRow extends SplitBillParticipantInput {
  _key: string
}

export function newParticipantRow(name = '', amount = 0): SplitParticipantRow {
  return { _key: Math.random().toString(36).slice(2), name, amount, phone: '' }
}
