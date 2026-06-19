import { LevelBadge } from '../../components/LevelBadge'
import { MetricGrid, type Metric } from '../../components/MetricGrid'
import type { EntryShowResponse, LogEntryContent } from '../../lib/api'
import { formatRelative } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<LogEntryContent>
}

export function LogDetailBody({ detail }: Props) {
  const { entry } = detail
  const { content } = entry

  const metrics: Metric[] = [
    { label: 'Level', value: <LevelBadge level={content.level} /> },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
    { label: 'Tags', value: entry.tags?.length ?? 0 },
  ]

  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />

      <div className={`log-message log-message--${content.level.toLowerCase()}`}>
        <pre>{content.message}</pre>
      </div>

      {content.context && Object.keys(content.context).length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Context</div>
          <div className="kv-list">
            {Object.entries(content.context).map(([k, v]) => (
              <div key={k} className="kv-row">
                <div className="kv-row__key">{k}</div>
                <div className="kv-row__value">
                  {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
