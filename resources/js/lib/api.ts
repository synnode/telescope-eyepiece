import { getCsrfToken, getTelescopePath } from './telescope'

function apiUrl(endpoint: string): string {
  const base = getTelescopePath().replace(/\/$/, '')
  return `${base}/telescope-api/${endpoint}`
}

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
  const res = await fetch(apiUrl(endpoint), {
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
  const res = await fetch(apiUrl(endpoint), {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
  if (!res.ok) {
    throw new Error(`API ${endpoint} failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// --- typed endpoints ---------------------------------------------------

export type RequestUser = {
  id: string | number
  name: string | null
  email?: string | null
}

export type RequestEntryContent = {
  method: string
  uri: string
  controller_action?: string | null
  response_status: number
  duration: number | string | null
  ip_address?: string
  memory?: number
  user?: RequestUser
  headers?: Record<string, string | string[]>
  payload?: Record<string, unknown>
  middleware?: string[]
}

export type QueryEntryContent = {
  connection: string
  driver?: string
  bindings: unknown[]
  sql: string
  time: number | string
  slow?: boolean
  file?: string
  line?: number
  hash?: string
}

export type EntryShowResponse<T = unknown> = {
  entry: EntryRow<T> & { batch_id: string; sequence: number }
  batch: Array<EntryRow<unknown>>
}

export const api = {
  requests: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<RequestEntryContent>>('requests', params),
    show: (id: string) => apiGet<EntryShowResponse<RequestEntryContent>>(`requests/${id}`),
  },
  queries: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<QueryEntryContent>>('queries', params),
    show: (id: string) => apiGet<EntryShowResponse<QueryEntryContent>>(`queries/${id}`),
  },
  toggleRecording: () => apiPost<void>('toggle-recording'),
  clearEntries: async () => {
    const res = await fetch(apiUrl('entries'), {
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
