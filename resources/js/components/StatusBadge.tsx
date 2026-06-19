import { statusClass } from '../lib/format'

type Props = {
  status: number
}

export function StatusBadge({ status }: Props) {
  const cls = statusClass(status)
  return <span className={`status-badge status-badge--${cls}`}>{status}</span>
}
