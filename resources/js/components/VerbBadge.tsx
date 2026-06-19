type Props = {
  method: string
}

export function VerbBadge({ method }: Props) {
  const verb = method.toUpperCase()
  const variant = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(verb)
    ? verb.toLowerCase()
    : 'get'
  return <span className={`verb-badge verb-badge--${variant}`}>{verb}</span>
}
