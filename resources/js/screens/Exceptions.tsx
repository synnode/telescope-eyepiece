import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type ExceptionEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { ExceptionDetailBody } from './exceptions/ExceptionDetailBody'

const GRID_COLUMNS = '160px minmax(220px,1fr) 200px 74px 26px'

export function ExceptionsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const showResolved = params.get('resolved') === '1'
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

  const toggleResolved = useCallback(() => {
    const merged = new URLSearchParams(params)
    if (showResolved) merged.delete('resolved')
    else merged.set('resolved', '1')
    merged.delete('id')
    setParams(merged, { replace: true })
  }, [params, setParams, showResolved])

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

  const list = useEntryList<ExceptionEntryContent>({
    queryKey: ['exceptions', 'list'],
    fetcher: api.exceptions.list,
    isPolling: isPolling && !selectedId,
  })

  const entries = list.rows

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (!showResolved && e.content.resolved_at) return false
      if (needle) {
        const hay = [e.content.class, e.content.message, e.content.file]
          .join(' ')
          .toLowerCase()
          if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [entries, search, showResolved])

  const unresolvedCount = useMemo(
    () => entries.filter((e) => !e.content.resolved_at).length,
    [entries],
  )

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Exceptions</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} exceptions
          </div>
        </div>
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card__label">Unresolved</span>
            <span
              className={
                'stat-card__value' + (unresolvedCount > 0 ? ' is-error' : ' is-ok')
              }
            >
              {unresolvedCount}
            </span>
          </div>
        </div>
      </div>

      <div className="filter-form">
        <label className="filter-search">
          <input
            type="search"
            placeholder="Filter by class, message, file…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </label>
        <div className="filter-divider" />
        <button
          type="button"
          className={'chip' + (showResolved ? ' is-active' : '')}
          aria-pressed={showResolved}
          onClick={toggleResolved}
        >
          Include resolved
        </button>
      </div>

      <EntryTable
        columns={exceptionColumns}
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
            ? 'No exceptions recorded.'
            : 'No exceptions match these filters.'
        }
      />

      {selectedId && <ExceptionDetail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function ExceptionDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const detailQuery = useQuery({
    queryKey: ['exceptions', 'show', id],
    queryFn: () => api.exceptions.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Exception detail"
      title={
        entry ? (
          <span className="exc-title">{shortClass(entry.content.class)}</span>
        ) : (
          'Loading…'
        )
      }
      subtitle={
        entry ? `${trimPath(entry.content.file)}:${entry.content.line}` : undefined
      }
    >
      {detailQuery.isLoading && <div className="state">Loading detail…</div>}
      {detailQuery.isError && (
        <div className="state state--error">
          {(detailQuery.error as Error).message}
        </div>
      )}
      {detail && (
        <ExceptionDetailBody
          detail={detail}
          onResolved={() => {
            queryClient.invalidateQueries({ queryKey: ['exceptions'] })
          }}
        />
      )}
    </EntryDetailDrawer>
  )
}

function shortClass(fqcn: string): string {
  const parts = fqcn.split('\\')
  return parts[parts.length - 1] || fqcn
}

function trimPath(file: string): string {
  const idx = file.indexOf('/app/')
  if (idx !== -1) return file.slice(idx + 1)
  const parts = file.split('/')
  return parts.slice(-3).join('/')
}

const exceptionColumns: EntryColumn<EntryRow<ExceptionEntryContent>>[] = [
  {
    key: 'class',
    label: 'Class',
    render: (e) => (
      <span
        className={
          'cell-exc-class' + (e.content.resolved_at ? ' is-resolved' : '')
        }
        title={e.content.class}
      >
        {shortClass(e.content.class)}
      </span>
    ),
  },
  {
    key: 'message',
    label: 'Message',
    render: (e) => (
      <span
        className="cell-exc-message"
        title={e.content.message}
      >
        {e.content.message}
      </span>
    ),
  },
  {
    key: 'location',
    label: 'Location',
    render: (e) => (
      <span className="cell-location">
        {trimPath(e.content.file)}:{e.content.line}
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
