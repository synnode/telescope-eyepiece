import type { ReactNode } from 'react'

export type Metric = {
  label: string
  value: ReactNode
  tone?: 'default' | 'small'
  valueClassName?: string
}

type Props = {
  metrics: Metric[]
}

export function MetricGrid({ metrics }: Props) {
  return (
    <div className="metric-grid">
      {metrics.map((m) => (
        <div key={m.label} className="metric-tile">
          <span className="metric-tile__label">{m.label}</span>
          <span
            className={
              'metric-tile__value' +
              (m.tone === 'small' ? ' is-small' : '') +
              (m.valueClassName ? ' ' + m.valueClassName : '')
            }
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  )
}
