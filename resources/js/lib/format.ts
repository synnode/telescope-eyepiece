export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatMemoryMB(mb: number): string {
  return `${Math.round(mb)} MB`
}

export function statusClass(status: number): '2xx' | '3xx' | '4xx' | '5xx' | 'other' {
  if (status >= 200 && status < 300) return '2xx'
  if (status >= 300 && status < 400) return '3xx'
  if (status >= 400 && status < 500) return '4xx'
  if (status >= 500 && status < 600) return '5xx'
  return 'other'
}

export function formatRelative(iso: string, nowMs = Date.now()): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return iso
  const diff = Math.max(0, nowMs - then) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86_400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86_400)}d ago`
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  const idx = Math.max(0, Math.ceil(p * sortedAsc.length) - 1)
  return sortedAsc[idx] ?? 0
}
