import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type RequestEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { useSavedViews } from '../lib/savedViews'
import { useColumnVisibility, type ColumnDef } from '../lib/columnVisibility'
import { formatDuration, formatMemoryMB, formatRelative, statusClass } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { VerbBadge } from '../components/VerbBadge'
import { StatusBadge } from '../components/StatusBadge'
import { Avatar } from '../components/Avatar'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { PromptModal } from '../components/PromptModal'
import { ColumnChooser } from '../components/ColumnChooser'
import { StatCards } from './requests/StatCards'
import { FilterForm } from './requests/FilterForm'
import { SavedViewsRow } from './requests/SavedViewsRow'
import { RequestDetailBody } from './requests/RequestDetailBody'
import {
  PRESET_VIEWS,
  STATUS_CLASSES,
  applyFiltersToParams,
  readFiltersFromUrl,
  type RequestFilters,
  type StatusClass,
} from './requests/filters'

type RequestRow = EntryRow<RequestEntryContent>

type RequestColumnDef = ColumnDef & {
  render: (row: RequestRow) => ReactNode
  align?: 'left' | 'right'
}

const SqlCountsContext = createContext<Record<string, number>>({})

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

  const { views, createView, removeView } = useSavedViews<RequestFilters>(
    'eyepiece-views-requests',
    PRESET_VIEWS,
  )
  const [isNamingView, setIsNamingView] = useState(false)

  const handleCreateView = useCallback(() => setIsNamingView(true), [])

  const {
    visibleColumns,
    visibleKeys,
    toggle: toggleColumn,
    reset: resetColumns,
    gridTemplate,
  } = useColumnVisibility('eyepiece-cols-requests', REQUEST_COLUMNS)

  const columns: EntryColumn<RequestRow>[] = useMemo(
    () =>
      visibleColumns.map((c) => ({
        key: c.key,
        label: c.label,
        align: c.align,
        render: c.render,
      })),
    [visibleColumns],
  )

  const list = useEntryList<RequestEntryContent>({
    queryKey: ['requests', 'list'],
    fetcher: api.requests.list,
    isPolling: isPolling && !selectedId,
  })

  const batchIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of list.rows) {
      if (row.batch_id) ids.add(row.batch_id)
    }
    return Array.from(ids)
  }, [list.rows])

  const sqlCountsQuery = useQuery({
    queryKey: ['requests', 'sql-counts', batchIds.join(',')],
    queryFn: () => api.eyepiece.batchQueryCounts(batchIds),
    enabled: batchIds.length > 0,
    staleTime: 1500,
  })
  const sqlCounts = sqlCountsQuery.data?.counts ?? {}

  const entries = list.rows
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
      <SavedViewsRow
        value={filters}
        onApply={setFilters}
        views={views}
        onCreate={handleCreateView}
        onRemove={removeView}
        trailing={
          <ColumnChooser
            columns={REQUEST_COLUMNS}
            visibleKeys={visibleKeys}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        }
      />

      <SqlCountsContext.Provider value={sqlCounts}>
        <EntryTable
          columns={columns}
          rows={filtered}
          gridTemplateColumns={gridTemplate('26px')}
          getRowKey={(e) => e.id}
          selectedKey={selectedId}
          onRowClick={(e) => openDetail(e.id)}
          isLoading={list.isLoading}
          hasMore={list.hasMore}
          isLoadingMore={list.isLoadingMore}
          onLoadMore={list.loadMore}
          emptyMessage={
            entries.length === 0
              ? 'No requests recorded yet.'
              : 'No requests match these filters.'
          }
        />
      </SqlCountsContext.Provider>

      {selectedId && (
        <RequestDetail id={selectedId} onClose={closeDetail} />
      )}

      <PromptModal
        isOpen={isNamingView}
        title="Save view"
        label="View name"
        placeholder="e.g. Slow API endpoints"
        onSubmit={(name) => {
          createView(filters, name)
          setIsNamingView(false)
        }}
        onCancel={() => setIsNamingView(false)}
      />
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

function SqlCountCell({ batchId }: { batchId: string | null }) {
  const counts = useContext(SqlCountsContext)
  if (!batchId) return <span className="cell-sql">—</span>
  const count = counts[batchId]
  if (count === undefined) return <span className="cell-sql">—</span>
  if (count === 0) return <span className="cell-sql">0</span>
  return (
    <span className={'cell-sql' + (count >= 50 ? ' is-slow' : '')}>{count}</span>
  )
}

function toMs(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

const REQUEST_COLUMNS: RequestColumnDef[] = [
  {
    key: 'verb',
    label: 'Verb',
    width: '52px',
    mandatory: true,
    render: (e) => <VerbBadge method={e.content.method} />,
  },
  {
    key: 'path',
    label: 'Path',
    width: 'minmax(220px,1fr)',
    mandatory: true,
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
    width: '60px',
    align: 'right',
    render: (e) => <StatusBadge status={e.content.response_status} />,
  },
  {
    key: 'time',
    label: 'Time',
    width: '70px',
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
    width: '56px',
    align: 'right',
    render: (e) => <SqlCountCell batchId={e.batch_id} />,
  },
  {
    key: 'memory',
    label: 'Memory',
    width: '70px',
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
    width: '132px',
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
    width: '104px',
    render: (e) => <span className="cell-ip">{e.content.ip_address ?? '—'}</span>,
  },
  {
    key: 'when',
    label: 'When',
    width: '74px',
    align: 'right',
    render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span>,
  },
]
