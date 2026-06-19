import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type LogEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { LevelBadge } from '../components/LevelBadge'
import { LogDetailBody } from './logs/LogDetailBody'

const GRID_COLUMNS = '90px minmax(220px,1fr) 74px 26px'

const LEVELS = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'notice',
  'info',
  'debug',
] as const

export function LogsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const levelsParam = params.get('lvl') ?? ''
  const activeLevels = useMemo(
    () => new Set(levelsParam.split(',').filter(Boolean)),
    [levelsParam],
  )
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

  const toggleLevel = useCallback(
    (level: string) => {
      const next = new Set(activeLevels)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      const merged = new URLSearchParams(params)
      const joined = Array.from(next).join(',')
      if (joined) merged.set('lvl', joined)
      else merged.delete('lvl')
      merged.delete('id')
      setParams(merged, { replace: true })
    },
    [activeLevels, params, setParams],
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

  const list = useEntryList<LogEntryContent>({
    queryKey: ['logs', 'list'],
    fetcher: api.logs.list,
    isPolling: isPolling && !selectedId,
  })

  const entries = list.rows

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (activeLevels.size > 0 && !activeLevels.has(e.content.level.toLowerCase())) {
        return false
      }
      if (needle) {
        const hay = e.content.message.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [entries, search, activeLevels])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Logs</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} entries
          </div>
        </div>
      </div>

      <div className="filter-form">
        <label className="filter-search">
          <input
            type="search"
            placeholder="Filter by message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </label>
        <div className="filter-divider" />
        <div className="chip-group" role="group" aria-label="Log level">
          {LEVELS.map((level) => {
            const active = activeLevels.has(level)
            return (
              <button
                key={level}
                type="button"
                className={`chip chip-log chip-log--${level}${
                  active ? ' is-active' : ''
                }`}
                aria-pressed={active}
                onClick={() => toggleLevel(level)}
              >
                {level.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>

      <EntryTable
        columns={logColumns}
        rows={filtered}
        gridTemplateColumns={GRID_COLUMNS}
        getRowKey={(e) => e.id}
        selectedKey={selectedId}
        onRowClick={(e) => openDetail(e.id)}
        isLoading={list.isLoading}
        hasMore={list.hasMore}
        isLoadingMore={list.isLoadingMore}
        onLoadMore={list.loadMore}
        emptyMessage={
          entries.length === 0
            ? 'No log entries recorded yet.'
            : 'No log entries match these filters.'
        }
      />

      {selectedId && <LogDetail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function LogDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['logs', 'show', id],
    queryFn: () => api.logs.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Log entry"
      title={
        entry ? (
          <span className="log-title">
            <LevelBadge level={entry.content.level} />
            <span>{truncate(entry.content.message, 200)}</span>
          </span>
        ) : (
          'Loading…'
        )
      }
    >
      {detailQuery.isLoading && <div className="state">Loading detail…</div>}
      {detailQuery.isError && (
        <div className="state state--error">
          {(detailQuery.error as Error).message}
        </div>
      )}
      {detail && <LogDetailBody detail={detail} />}
    </EntryDetailDrawer>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n).trimEnd() + '…'
}

const logColumns: EntryColumn<EntryRow<LogEntryContent>>[] = [
  {
    key: 'level',
    label: 'Level',
    render: (e) => <LevelBadge level={e.content.level} />,
  },
  {
    key: 'message',
    label: 'Message',
    render: (e) => (
      <span className="cell-log-message" title={e.content.message}>
        {e.content.message}
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
