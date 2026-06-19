type Kind = 'user' | 'guest' | 'api'

type Props = {
  name?: string | null
  kind?: Kind
  size?: number
}

const USER_PALETTE: Array<{ text: string; bg: string }> = [
  { text: '#0369a1', bg: '#e0f2fe' },
  { text: '#15803d', bg: '#dcfce7' },
  { text: '#b45309', bg: '#fef3c7' },
  { text: '#9333ea', bg: '#f3e8ff' },
  { text: '#be123c', bg: '#ffe4e6' },
]

const GUEST = { text: '#a1a1aa', bg: '#f1f1f4' }
const API = { text: '#7c3aed', bg: '#ede9fe' }

export function Avatar({ name, kind = 'user', size = 20 }: Props) {
  const palette =
    kind === 'guest' || !name
      ? GUEST
      : kind === 'api'
        ? API
        : USER_PALETTE[hash(name) % USER_PALETTE.length]!

  const label = !name
    ? '·'
    : kind === 'api'
      ? '·'
      : initials(name)

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: palette.bg,
        color: palette.text,
        fontSize: Math.max(9, Math.round(size * 0.45)),
      }}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '·'
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}
