import { MetricGrid, type Metric } from '../../components/MetricGrid'
import { OutcomeBadge } from '../../components/OutcomeBadge'
import type { CommandEntryContent, EntryShowResponse } from '../../lib/api'
import { formatRelative } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<CommandEntryContent>
}

export function CommandDetailBody({ detail }: Props) {
  const { entry } = detail
  const { content } = entry
  const success = content.exit_code === 0

  const metrics: Metric[] = [
    {
      label: 'Exit code',
      value: (
        <OutcomeBadge
          label={String(content.exit_code)}
          tone={success ? 'ok' : 'fail'}
        />
      ),
    },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
    { label: 'Tags', value: entry.tags?.length ?? 0 },
  ]

  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />

      <KVSection label="Arguments" data={content.arguments} />
      <KVSection label="Options" data={content.options} />
    </div>
  )
}

function KVSection({
  label,
  data,
}: {
  label: string
  data: Record<string, unknown>
}) {
  const entries = Object.entries(data ?? {})
  if (entries.length === 0) return null
  return (
    <section className="detail-section">
      <div className="detail-section__label">{label}</div>
      <div className="kv-list">
        {entries.map(([k, v]) => (
          <div key={k} className="kv-row">
            <div className="kv-row__key">{k}</div>
            <div className="kv-row__value">
              {v === null
                ? 'null'
                : typeof v === 'string'
                  ? v
                  : JSON.stringify(v)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
