import { useMemo } from 'react'
import { formatDuration, percentile } from '../../lib/format'

type Props = {
  durations: number[]
  errorCount: number
}

export function StatCards({ durations, errorCount }: Props) {
  const { avg, p95 } = useMemo(() => {
    if (durations.length === 0) return { avg: 0, p95: 0 }
    const sum = durations.reduce((a, b) => a + b, 0)
    const sorted = [...durations].sort((a, b) => a - b)
    return { avg: sum / durations.length, p95: percentile(sorted, 0.95) }
  }, [durations])

  return (
    <div className="stat-cards">
      <StatCard label="Avg" value={formatDuration(avg)} />
      <StatCard label="p95" value={formatDuration(p95)} />
      <StatCard
        label="Errors"
        value={String(errorCount)}
        tone={errorCount > 0 ? 'error' : 'ok'}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'ok' | 'error'
}) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span
        className={
          'stat-card__value' +
          (tone === 'error' ? ' is-error' : tone === 'ok' ? ' is-ok' : '')
        }
      >
        {value}
      </span>
    </div>
  )
}
