type Tone = 'ok' | 'pending' | 'fail' | 'muted'

type Props = {
  label: string
  tone: Tone
}

export function OutcomeBadge({ label, tone }: Props) {
  return (
    <span className={`outcome-badge outcome-badge--${tone}`}>{label}</span>
  )
}
