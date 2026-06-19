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

export type ExceptionTraceFrame = {
  file?: string
  line?: number
}

export type ExceptionEntryContent = {
  class: string
  file: string
  line: number
  message: string
  context?: Record<string, unknown> | null
  trace: ExceptionTraceFrame[]
  line_preview: Record<string, string>
  resolved_at?: string | null
}

export type LogLevel =
  | 'emergency'
  | 'alert'
  | 'critical'
  | 'error'
  | 'warning'
  | 'notice'
  | 'info'
  | 'debug'

export type LogEntryContent = {
  level: LogLevel | string
  message: string
  context?: Record<string, unknown> | null
}

export type JobStatus = 'pending' | 'processed' | 'failed'

export type JobEntryContent = {
  status: JobStatus | string
  connection: string
  queue: string
  name: string
  tries?: number | null
  timeout?: number | null
  data?: Record<string, unknown>
  exception?: {
    message: string
    line: number
    trace?: Array<{ file?: string; line?: number; function?: string; class?: string }>
    line_preview?: Record<string, string>
  }
}

export type CommandEntryContent = {
  command: string
  exit_code: number
  arguments: Record<string, unknown>
  options: Record<string, unknown>
}

export type MailAddressMap = Record<string, string | null>

export type MailEntryContent = {
  mailable: string
  queued: boolean | string
  from: MailAddressMap
  replyTo?: MailAddressMap
  to: MailAddressMap
  cc?: MailAddressMap
  bcc?: MailAddressMap
  subject: string | null
  html?: string
  raw?: string
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
  logs: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<LogEntryContent>>('logs', params),
    show: (id: string) => apiGet<EntryShowResponse<LogEntryContent>>(`logs/${id}`),
  },
  jobs: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<JobEntryContent>>('jobs', params),
    show: (id: string) => apiGet<EntryShowResponse<JobEntryContent>>(`jobs/${id}`),
  },
  commands: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<CommandEntryContent>>('commands', params),
    show: (id: string) => apiGet<EntryShowResponse<CommandEntryContent>>(`commands/${id}`),
  },
  mail: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<MailEntryContent>>('mail', params),
    show: (id: string) => apiGet<EntryShowResponse<MailEntryContent>>(`mail/${id}`),
    previewUrl: (id: string) => apiUrl(`mail/${id}/preview`),
    downloadUrl: (id: string) => apiUrl(`mail/${id}/download`),
  },
  exceptions: {
    list: (params: EntryListParams = {}) =>
      apiPost<EntryListResponse<ExceptionEntryContent>>('exceptions', params),
    show: (id: string) => apiGet<EntryShowResponse<ExceptionEntryContent>>(`exceptions/${id}`),
    resolve: async (id: string) => {
      const res = await fetch(apiUrl(`exceptions/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ resolved_at: 'now' }),
      })
      if (!res.ok) throw new Error('Failed to resolve exception')
      return res.json() as Promise<EntryShowResponse<ExceptionEntryContent>>
    },
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
