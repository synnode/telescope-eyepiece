import { useMemo } from 'react'
import { Avatar } from '../../components/Avatar'
import { MetricGrid, type Metric } from '../../components/MetricGrid'
import type {
  EntryRow,
  EntryShowResponse,
  QueryEntryContent,
  RequestEntryContent,
  RequestUser,
} from '../../lib/api'
import { formatDuration, formatMemoryMB, formatRelative, statusClass } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<RequestEntryContent>
}

export function RequestDetailBody({ detail }: Props) {
  const { entry, batch } = detail
  const { content } = entry

  const queries = useMemo(
    () => batch.filter((e): e is EntryRow<QueryEntryContent> => e.type === 'query'),
    [batch],
  )

  const dbTime = useMemo(
    () => queries.reduce((sum, q) => sum + toNumber(q.content?.time), 0),
    [queries],
  )

  const duration = toNumber(content.duration)
  const memory = content.memory ?? 0
  const sCls = statusClass(content.response_status)

  const metrics: Metric[] = [
    {
      label: 'Status',
      value: content.response_status,
      valueClassName: `is-status-${sCls}`,
    },
    { label: 'Duration', value: formatDuration(duration) },
    { label: 'Memory', value: formatMemoryMB(memory) },
    { label: 'SQL queries', value: queries.length },
    { label: 'DB time', value: formatDuration(dbTime) },
    {
      label: 'When',
      value: formatRelative(entry.created_at),
      tone: 'small',
    },
  ]

  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      <WhoCard user={content.user} ip={resolveIp(content)} />
      <HeadersBlock headers={content.headers} />
      <PayloadBlock payload={content.payload} />
      <QueriesBlock queries={queries} dbTime={dbTime} />
      <ResponseBlock response={content.response} />
    </div>
  )
}

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

function resolveIp(content: RequestEntryContent): string {
  const forwarded = content.headers?.['x-forwarded-for']
  if (Array.isArray(forwarded)) return forwarded[0] ?? content.ip_address ?? ''
  if (typeof forwarded === 'string') return forwarded.split(',')[0]!.trim()
  return content.ip_address ?? ''
}

function WhoCard({ user, ip }: { user?: RequestUser; ip: string }) {
  if (!user) {
    return (
      <div className="who-card">
        <Avatar kind="guest" size={38} />
        <div className="who-card__main">
          <div className="who-card__name">Guest</div>
          <div className="who-card__meta">Unauthenticated</div>
        </div>
        {ip && <div className="who-card__ip">{ip}</div>}
      </div>
    )
  }

  const name = user.name ?? user.email ?? `user #${user.id}`
  const meta = `user #${user.id}${user.email ? ' · ' + user.email : ''}`

  return (
    <div className="who-card">
      <Avatar name={name} size={38} />
      <div className="who-card__main">
        <div className="who-card__name">{name}</div>
        <div className="who-card__meta">{meta}</div>
      </div>
      {ip && <div className="who-card__ip">{ip}</div>}
    </div>
  )
}

function HeadersBlock({
  headers,
}: {
  headers?: Record<string, string | string[]>
}) {
  const entries = headers ? Object.entries(headers) : []
  if (entries.length === 0) return null

  return (
    <section className="detail-section">
      <div className="detail-section__label">Request headers</div>
      <div className="kv-list">
        {entries.map(([k, v]) => (
          <div key={k} className="kv-row">
            <div className="kv-row__key">{k}</div>
            <div className="kv-row__value">
              {Array.isArray(v) ? v.join(', ') : v}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PayloadBlock({
  payload,
}: {
  payload?: Record<string, unknown> | unknown[] | null
}) {
  if (payload == null) return null
  const isEmpty =
    Array.isArray(payload) ? payload.length === 0 : Object.keys(payload).length === 0
  if (isEmpty) return null

  return (
    <section className="detail-section">
      <div className="detail-section__label">Request payload</div>
      <div className="code-card">
        <pre className="code-card__sql">{JSON.stringify(payload, null, 2)}</pre>
      </div>
    </section>
  )
}

function ResponseBlock({ response }: { response: unknown }) {
  if (response == null) return null
  const isEmpty =
    (Array.isArray(response) && response.length === 0) ||
    (typeof response === 'object' &&
      !Array.isArray(response) &&
      Object.keys(response as object).length === 0) ||
    (typeof response === 'string' && response.length === 0)
  if (isEmpty) return null

  const body =
    typeof response === 'string' ? response : JSON.stringify(response, null, 2)

  return (
    <section className="detail-section">
      <div className="detail-section__label">Response body</div>
      <div className="code-card">
        <pre className="code-card__sql">{body}</pre>
      </div>
    </section>
  )
}

function QueriesBlock({
  queries,
  dbTime,
}: {
  queries: EntryRow<QueryEntryContent>[]
  dbTime: number
}) {
  return (
    <section className="detail-section">
      <div className="detail-section__label">
        SQL queries
        <span className="detail-section__meta">
          {queries.length} · {formatDuration(dbTime)}
        </span>
      </div>
      {queries.length === 0 ? (
        <div className="code-card code-card--empty">No queries recorded.</div>
      ) : (
        queries.map((q) => (
          <div key={q.id} className="code-card">
            <div className="code-card__head">
              <span className="code-card__conn">{q.content.connection}</span>
              <span
                className={
                  'code-card__time' +
                  (toNumber(q.content.time) >= 80 ? ' is-slow' : '')
                }
              >
                {formatDuration(toNumber(q.content.time))}
              </span>
            </div>
            <pre className="code-card__sql">{q.content.sql}</pre>
          </div>
        ))
      )}
    </section>
  )
}
