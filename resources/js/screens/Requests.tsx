import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type RequestEntryContent } from '../lib/api'
import { formatDuration, formatMemoryMB, formatRelative, statusClass } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { VerbBadge } from '../components/VerbBadge'
import { StatusBadge } from '../components/StatusBadge'
import { Avatar } from '../components/Avatar'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { StatCards } from './requests/StatCards'
import { FilterForm } from './requests/FilterForm'
import { SavedViewsRow } from './requests/SavedViewsRow'
import { RequestDetailBody } from './requests/RequestDetailBody'
import {
  STATUS_CLASSES,
  applyFiltersToParams,
  readFiltersFromUrl,
  type RequestFilters,
  type StatusClass,
} from './requests/filters'

const GRID_COLUMNS =
  '52px minmax(220px,1fr) 60px 70px 56px 70px 132px 104px 74px 26px'

export function RequestsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFiltersFromUrl(params), [params])
  const selectedId = params.get('id')

  const setFilters = useCallback(
    (next: RequestFilters) => {
      const merged = applyFiltersToParams(params, next)
      merged.delete('id')
      setParams(merged, { replace: true })
    },
    [params, setParams],
  )

  const openDetail = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set('id', id)
      setParams(next, { replace: false })
    },
    [params, setParams],
  )

  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('id')
    setParams(next, { replace: false })
  }, [params, setParams])

  const listQuery = useQuery({
    queryKey: ['requests', 'list'],
    queryFn: () => api.requests.list({ take: 100 }),
    refetchInterval: isPolling && !selectedId ? 2000 : false,
  })

  const entries = useMemo(
    () => listQuery.data?.entries ?? [],
    [listQuery.data],
  )
  const filtered = useMemo(() => applyFilters(entries, filters), [entries, filters])

  const statusCounts = useMemo(() => countByStatus(entries), [entries])
  const durations = useMemo(
    () => filtered.map((e) => toMs(e.content.duration)),
    [filtered],
  )
  const errorCount = useMemo(
    () => filtered.filter((e) => e.content.response_status >= 400).length,
    [filtered],
  )

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Requests</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} requests
          </div>
        </div>
        <StatCards durations={durations} errorCount={errorCount} />
      </div>

      <FilterForm value={filters} onChange={setFilters} statusCounts={statusCounts} />
      <SavedViewsRow value={filters} onApply={setFilters} />

      <EntryTable
        columns={requestColumns}
        rows={filtered}
        gridTemplateColumns={GRID_COLUMNS}
        getRowKey={(e) => e.id}
        selectedKey={selectedId}
        onRowClick={(e) => openDetail(e.id)}
        isLoading={listQuery.isLoading}
        emptyMessage={
          entries.length === 0
            ? 'No requests recorded yet.'
            : 'No requests match these filters.'
        }
      />

      {selectedId && (
        <RequestDetail id={selectedId} onClose={closeDetail} />
      )}
    </>
  )
}

function RequestDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['requests', 'show', id],
    queryFn: () => api.requests.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Request detail"
      title={
        entry ? (
          <>
            <VerbBadge method={entry.content.method} />
            <span>{entry.content.uri}</span>
          </>
        ) : (
          'Loading…'
        )
      }
      subtitle={entry?.content.controller_action ?? undefined}
    >
      {detailQuery.isLoading && <div className="state">Loading detail…</div>}
      {detailQuery.isError && (
        <div className="state state--error">
          {(detailQuery.error as Error).message}
        </div>
      )}
      {detail && <RequestDetailBody detail={detail} />}
    </EntryDetailDrawer>
  )
}

function applyFilters(
  entries: EntryRow<RequestEntryContent>[],
  f: RequestFilters,
): EntryRow<RequestEntryContent>[] {
  const search = f.search.trim().toLowerCase()
  return entries.filter((e) => {
    if (f.verbs.length && !f.verbs.includes(e.content.method.toUpperCase() as never)) {
      return false
    }
    if (f.statuses.length) {
      const cls = statusClass(e.content.response_status)
      if (!f.statuses.includes(cls as StatusClass)) return false
    }
    if (f.minDuration && toMs(e.content.duration) < f.minDuration) return false
    if (search) {
      const hay = [
        e.content.uri,
        e.content.controller_action ?? '',
        e.content.user?.name ?? '',
        e.content.user?.email ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

function countByStatus(
  entries: EntryRow<RequestEntryContent>[],
): Record<StatusClass, number> {
  const counts: Record<StatusClass, number> = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
  for (const e of entries) {
    const cls = statusClass(e.content.response_status)
    if (STATUS_CLASSES.includes(cls as StatusClass)) counts[cls as StatusClass]++
  }
  return counts
}

function toMs(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

const requestColumns: EntryColumn<EntryRow<RequestEntryContent>>[] = [
  {
    key: 'verb',
    label: 'Verb',
    render: (e) => <VerbBadge method={e.content.method} />,
  },
  {
    key: 'path',
    label: 'Path',
    render: (e) => (
      <span className="cell-path">
        <span className="cell-path__uri">{e.content.uri}</span>
        <span className="cell-path__route">
          {e.content.controller_action || '—'}
        </span>
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    align: 'right',
    render: (e) => <StatusBadge status={e.content.response_status} />,
  },
  {
    key: 'time',
    label: 'Time',
    align: 'right',
    render: (e) => {
      const ms = toMs(e.content.duration)
      const tone =
        ms >= 1000 ? 'is-slowest' : ms >= 500 ? 'is-slow' : 'is-fast'
      return <span className={'cell-time ' + tone}>{formatDuration(ms)}</span>
    },
  },
  {
    key: 'sql',
    label: 'SQL',
    align: 'right',
    render: () => <span className="cell-sql">—</span>,
  },
  {
    key: 'memory',
    label: 'Memory',
    align: 'right',
    render: (e) => (
      <span className="cell-memory">
        {e.content.memory ? formatMemoryMB(e.content.memory) : '—'}
      </span>
    ),
  },
  {
    key: 'user',
    label: 'User',
    render: (e) => {
      const u = e.content.user
      const name = u?.name ?? u?.email ?? (u ? `user #${u.id}` : 'Guest')
      return (
        <span className="cell-user">
          <Avatar name={u ? name : undefined} kind={u ? 'user' : 'guest'} />
          <span className="cell-user__name">{name}</span>
        </span>
      )
    },
  },
  {
    key: 'ip',
    label: 'IP',
    render: (e) => <span className="cell-ip">{e.content.ip_address ?? '—'}</span>,
  },
  {
    key: 'when',
    label: 'When',
    align: 'right',
    render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span>,
  },
]
