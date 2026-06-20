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

import type { SavedView as GenericSavedView } from '../../lib/savedViews'

export type SavedView = GenericSavedView<RequestFilters>

export const PRESET_VIEWS: SavedView[] = [
  {
    id: 'slow',
    label: 'Slow (≥500ms)',
    filters: { ...EMPTY_FILTERS, minDuration: 500 },
    builtIn: true,
  },
  {
    id: 'errors',
    label: 'Errors only',
    filters: { ...EMPTY_FILTERS, statuses: ['4xx', '5xx'] },
    builtIn: true,
  },
  {
    id: 'writes',
    label: 'Writes',
    filters: { ...EMPTY_FILTERS, verbs: ['POST', 'PUT', 'PATCH'] },
    builtIn: true,
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

export function countActiveFilters(f: RequestFilters): number {
  let n = 0
  if (f.search.length > 0) n++
  if (f.verbs.length > 0) n++
  if (f.statuses.length > 0) n++
  if (f.minDuration > 0) n++
  return n
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

export function readFiltersFromUrl(params: URLSearchParams): RequestFilters {
  const search = params.get('q') ?? ''
  const verbs = splitCsv(params.get('v')).filter((v): v is HttpVerb =>
    VERBS.includes(v as HttpVerb),
  )
  const statuses = splitCsv(params.get('s')).filter((s): s is StatusClass =>
    STATUS_CLASSES.includes(s as StatusClass),
  )
  const minDuration = Number(params.get('d')) || 0
  return { search, verbs, statuses, minDuration }
}

export function applyFiltersToParams(
  base: URLSearchParams,
  f: RequestFilters,
): URLSearchParams {
  const next = new URLSearchParams(base)
  setOrDelete(next, 'q', f.search)
  setOrDelete(next, 'v', f.verbs.join(','))
  setOrDelete(next, 's', f.statuses.join(','))
  setOrDelete(next, 'd', f.minDuration ? String(f.minDuration) : '')
  return next
}

function setOrDelete(p: URLSearchParams, key: string, value: string) {
  if (value) p.set(key, value)
  else p.delete(key)
}

function splitCsv(raw: string | null): string[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean)
}
