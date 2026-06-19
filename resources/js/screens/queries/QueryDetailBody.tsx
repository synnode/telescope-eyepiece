import { MetricGrid, type Metric } from '../../components/MetricGrid'
import type { EntryShowResponse, QueryEntryContent } from '../../lib/api'
import { formatDuration, formatRelative } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<QueryEntryContent>
}

export function QueryDetailBody({ detail }: Props) {
  const { entry } = detail
  const { content } = entry
  const time = toMs(content.time)

  const metrics: Metric[] = [
    { label: 'Connection', value: content.connection },
    {
      label: 'Time',
      value: formatDuration(time),
      valueClassName: time >= 1000 ? 'is-status-5xx' : time >= 80 ? 'is-status-4xx' : undefined,
    },
    { label: 'Slow', value: content.slow ? 'Yes' : 'No' },
    { label: 'Driver', value: content.driver ?? '—' },
    {
      label: 'Location',
      value: content.file ? `${trimPath(content.file)}:${content.line ?? '?'}` : '—',
      tone: 'small',
    },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]

  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />

      <section className="detail-section">
        <div className="detail-section__label">SQL</div>
        <div className="code-card">
          <pre className="code-card__sql">{content.sql}</pre>
        </div>
      </section>

      {content.hash && (
        <section className="detail-section">
          <div className="detail-section__label">
            Family hash
            <span className="detail-section__meta">groups equivalent queries</span>
          </div>
          <div className="kv-list">
            <div className="kv-row">
              <div className="kv-row__key">hash</div>
              <div className="kv-row__value">{content.hash}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function toMs(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

function trimPath(file: string): string {
  const idx = file.indexOf('/app/')
  if (idx !== -1) return file.slice(idx + 1)
  const parts = file.split('/')
  return parts.slice(-3).join('/')
}
