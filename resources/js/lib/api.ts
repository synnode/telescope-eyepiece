import { getCsrfToken } from './telescope'

export type EntryStatus = 'enabled' | 'disabled' | 'paused' | 'off'

export type EntryListResponse<T = unknown> = {
  entries: Array<EntryRow<T>>
  status: EntryStatus
}

export type EntryRow<T = unknown> = {
  id: string
  sequence: number
  batch_id: string | null
  family_hash: string | null
  type: string
  content: T
  tags: string[]
  created_at: string
}

export type EntryListParams = {
  before?: string | number
  tag?: string
  family_hash?: string
  batch_id?: string
  take?: number
}

async function apiPost<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`/telescope-api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': getCsrfToken(),
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`API ${endpoint} failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`/telescope-api/${endpoint}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
  if (!res.ok) {
    throw new Error(`API ${endpoint} failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// --- typed endpoints ---------------------------------------------------

export type RequestEntryContent = {
  method: string
  uri: string
  controller_action?: string | null
  response_status: number
  duration: number | string | null
  ip_address?: string
  memory?: number
}

export const api = {
  requests: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<RequestEntryContent>>('requests', params),
    show: (id: string) => apiGet<{ entry: EntryRow<RequestEntryContent> }>(`requests/${id}`),
  },
  toggleRecording: () => apiPost<void>('toggle-recording'),
  clearEntries: async () => {
    const res = await fetch('/telescope-api/entries', {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': getCsrfToken(),
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    })
    if (!res.ok) throw new Error('Failed to clear entries')
  },
}
