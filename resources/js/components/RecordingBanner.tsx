import { CircleAlert } from 'lucide-react'
import type { EntryStatus } from '../lib/api'

type Props = {
  status: EntryStatus
}

const MESSAGE: Partial<Record<EntryStatus, string>> = {
  paused: 'Telescope recording is paused. New entries will not be captured.',
  disabled: 'Telescope recording is disabled in the configuration.',
  off: 'This watcher is disabled in the configuration.',
  'wrong-cache': 'Dumps require a persistent cache driver.',
}

export function RecordingBanner({ status }: Props) {
  if (status === 'enabled') return null
  const message = MESSAGE[status]
  if (!message) return null
  return (
    <div className="recording-banner" role="status">
      <CircleAlert size={15} />
      <span>{message}</span>
    </div>
  )
}
