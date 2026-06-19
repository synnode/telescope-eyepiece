import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type QueryEntryContent } from '../lib/api'
import { formatDuration, formatRelative, percentile } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { QueryDetailBody } from './queries/QueryDetailBody'

const GRID_COLUMNS = '70px minmax(220px,1fr) 70px 160px 74px 26px'

export function QueriesScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const slowOnly = params.get('slow') === '1'
  const selectedId = params.get('id')

  const setSearch = useCallback(
    (next: string) => {
      const merged = new URLSearchParams(params)
      if (next) merged.set('q', next)
      else merged.delete('q')
      merged.delete('id')
      setParams(merged, { replace: true })
    },
    [params, setParams],
  )

  const toggleSlow = useCallback(() => {
    const merged = new URLSearchParams(params)
    if (slowOnly) merged.delete('slow')
    else merged.set('slow', '1')
    merged.delete('id')
    setParams(merged, { replace: true })
  }, [params, setParams, slowOnly])

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
    queryKey: ['queries', 'list'],
    queryFn: () => api.queries.list({ take: 100 }),
    refetchInterval: isPolling && !selectedId ? 2000 : false,
  })

  const entries = useMemo(
    () => listQuery.data?.entries ?? [],
    [listQuery.data],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (slowOnly && !(e.content.slow || toMs(e.content.time) >= 80)) return false
      if (needle) {
        const hay = [e.content.sql, e.content.file ?? '', e.content.connection]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [entries, search, slowOnly])

  const times = useMemo(() => filtered.map((e) => toMs(e.content.time)), [filtered])
  const slowCount = useMemo(
    () => filtered.filter((e) => e.content.slow || toMs(e.content.time) >= 80).length,
    [filtered],
  )

  const { avg, p95 } = useMemo(() => {
    if (times.length === 0) return { avg: 0, p95: 0 }
    const sorted = [...times].sort((a, b) => a - b)
    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      p95: percentile(sorted, 0.95),
    }
  }, [times])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Queries</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} queries
          </div>
        </div>
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card__label">Avg</span>
            <span className="stat-card__value">{formatDuration(avg)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">p95</span>
            <span className="stat-card__value">{formatDuration(p95)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Slow</span>
            <span
              className={
                'stat-card__value' + (slowCount > 0 ? ' is-error' : ' is-ok')
              }
            >
              {slowCount}
            </span>
          </div>
        </div>
      </div>

      <div className="filter-form">
        <label className="filter-search">
          <input
            type="search"
            placeholder="Filter by SQL, file, connection…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </label>
        <div className="filter-divider" />
        <button
          type="button"
          className={'chip' + (slowOnly ? ' is-active' : '')}
          aria-pressed={slowOnly}
          onClick={toggleSlow}
        >
          Slow only
        </button>
      </div>

      <EntryTable
        columns={queryColumns}
        rows={filtered}
        gridTemplateColumns={GRID_COLUMNS}
        getRowKey={(e) => e.id}
        selectedKey={selectedId}
        onRowClick={(e) => openDetail(e.id)}
        isLoading={listQuery.isLoading}
        emptyMessage={
          entries.length === 0
            ? 'No queries recorded yet.'
            : 'No queries match these filters.'
        }
      />

      {selectedId && <QueryDetail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function QueryDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['queries', 'show', id],
    queryFn: () => api.queries.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Query detail"
      title={entry ? <span>{truncate(entry.content.sql, 200)}</span> : 'Loading…'}
      subtitle={
        entry?.content.file
          ? `${trimPath(entry.content.file)}:${entry.content.line ?? '?'}`
          : undefined
      }
    >
      {detailQuery.isLoading && <div className="state">Loading detail…</div>}
      {detailQuery.isError && (
        <div className="state state--error">
          {(detailQuery.error as Error).message}
        </div>
      )}
      {detail && <QueryDetailBody detail={detail} />}
    </EntryDetailDrawer>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n).trimEnd() + '…'
}

function trimPath(file: string): string {
  const idx = file.indexOf('/app/')
  if (idx !== -1) return file.slice(idx + 1)
  const parts = file.split('/')
  return parts.slice(-3).join('/')
}

function toMs(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

const queryColumns: EntryColumn<EntryRow<QueryEntryContent>>[] = [
  {
    key: 'connection',
    label: 'Conn',
    render: (e) => <span className="cell-conn">{e.content.connection}</span>,
  },
  {
    key: 'sql',
    label: 'SQL',
    render: (e) => <span className="cell-sql-row">{e.content.sql}</span>,
  },
  {
    key: 'time',
    label: 'Time',
    align: 'right',
    render: (e) => {
      const ms = toMs(e.content.time)
      const tone =
        ms >= 1000 ? 'is-slowest' : ms >= 80 ? 'is-slow' : 'is-fast'
      return <span className={'cell-time ' + tone}>{formatDuration(ms)}</span>
    },
  },
  {
    key: 'file',
    label: 'Location',
    render: (e) => (
      <span className="cell-location">
        {e.content.file ? `${trimPath(e.content.file)}:${e.content.line ?? '?'}` : '—'}
      </span>
    ),
  },
  {
    key: 'when',
    label: 'When',
    align: 'right',
    render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span>,
  },
]
