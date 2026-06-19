export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type StatusClass = '2xx' | '3xx' | '4xx' | '5xx'

export type RequestFilters = {
  search: string
  verbs: HttpVerb[]
  statuses: StatusClass[]
  minDuration: number
}

export const EMPTY_FILTERS: RequestFilters = {
  search: '',
  verbs: [],
  statuses: [],
  minDuration: 0,
}

export const VERBS: HttpVerb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
export const STATUS_CLASSES: StatusClass[] = ['2xx', '3xx', '4xx', '5xx']

export const DURATION_PRESETS: Array<{ label: string; value: number }> = [
  { label: 'All', value: 0 },
  { label: '≥100ms', value: 100 },
  { label: '≥500ms', value: 500 },
  { label: '≥1s', value: 1000 },
]

export type SavedView = {
  id: string
  label: string
  filters: RequestFilters
}

export const PRESET_VIEWS: SavedView[] = [
  {
    id: 'slow',
    label: 'Slow (≥500ms)',
    filters: { ...EMPTY_FILTERS, minDuration: 500 },
  },
  {
    id: 'errors',
    label: 'Errors only',
    filters: { ...EMPTY_FILTERS, statuses: ['4xx', '5xx'] },
  },
  {
    id: 'writes',
    label: 'Writes',
    filters: { ...EMPTY_FILTERS, verbs: ['POST', 'PUT', 'PATCH'] },
  },
]

export function hasActiveFilters(f: RequestFilters): boolean {
  return (
    f.search.length > 0 ||
    f.verbs.length > 0 ||
    f.statuses.length > 0 ||
    f.minDuration > 0
  )
}

export function viewMatches(view: SavedView, f: RequestFilters): boolean {
  return (
    view.filters.search === f.search &&
    view.filters.minDuration === f.minDuration &&
    sameSet(view.filters.verbs, f.verbs) &&
    sameSet(view.filters.statuses, f.statuses)
  )
}

function sameSet<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  return b.every((x) => s.has(x))
}
