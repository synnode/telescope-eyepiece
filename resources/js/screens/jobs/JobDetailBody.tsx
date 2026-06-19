import { MetricGrid, type Metric } from '../../components/MetricGrid'
import { OutcomeBadge } from '../../components/OutcomeBadge'
import type { EntryShowResponse, JobEntryContent } from '../../lib/api'
import { formatRelative } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<JobEntryContent>
}

export function JobDetailBody({ detail }: Props) {
  const { entry } = detail
  const { content } = entry

  const metrics: Metric[] = [
    {
      label: 'Status',
      value: <OutcomeBadge label={content.status} tone={jobTone(content.status)} />,
    },
    { label: 'Queue', value: content.queue || 'default', tone: 'small' },
    { label: 'Connection', value: content.connection || '—', tone: 'small' },
    { label: 'Tries', value: content.tries ?? '—' },
    { label: 'Timeout', value: content.timeout ?? '—' },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]

  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />

      {content.exception && (
        <section className="detail-section">
          <div className="detail-section__label">Exception</div>
          <div className="exc-message">
            <pre>{content.exception.message}</pre>
          </div>
          {content.exception.line_preview && (
            <div className="code-card">
              <div className="code-listing">
                {Object.entries(content.exception.line_preview)
                  .map(([k, v]) => [Number(k), v] as const)
                  .sort((a, b) => a[0] - b[0])
                  .map(([num, text]) => (
                    <div
                      key={num}
                      className={
                        'code-listing__row' +
                        (num === content.exception?.line ? ' is-error' : '')
                      }
                    >
                      <span className="code-listing__num">{num}</span>
                      <pre className="code-listing__line">{text || ' '}</pre>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {content.data && Object.keys(content.data).length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Job data</div>
          <div className="kv-list">
            {Object.entries(content.data).map(([k, v]) => (
              <div key={k} className="kv-row">
                <div className="kv-row__key">{k}</div>
                <div className="kv-row__value">
                  {typeof v === 'string' ? v : JSON.stringify(v)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function jobTone(status: string): 'ok' | 'pending' | 'fail' | 'muted' {
  switch (status) {
    case 'processed':
      return 'ok'
    case 'failed':
      return 'fail'
    case 'pending':
      return 'pending'
    default:
      return 'muted'
  }
}
