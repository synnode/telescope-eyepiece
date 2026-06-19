type Props = {
  level: string
}

export function LevelBadge({ level }: Props) {
  const variant = level.toLowerCase()
  return (
    <span className={`level-badge level-badge--${variant}`}>
      {level.toUpperCase()}
    </span>
  )
}
