import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type CommandEntryContent, type EntryRow } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { OutcomeBadge } from '../components/OutcomeBadge'
import { CommandDetailBody } from './commands/CommandDetailBody'

const GRID_COLUMNS = '70px minmax(220px,1fr) 74px 26px'

export function CommandsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const failedOnly = params.get('failed') === '1'
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

  const toggleFailed = useCallback(() => {
    const merged = new URLSearchParams(params)
    if (failedOnly) merged.delete('failed')
    else merged.set('failed', '1')
    merged.delete('id')
    setParams(merged, { replace: true })
  }, [params, setParams, failedOnly])

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

  const list = useEntryList<CommandEntryContent>({
    queryKey: ['commands', 'list'],
    fetcher: api.commands.list,
    isPolling: isPolling && !selectedId,
  })

  const entries = list.rows

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (failedOnly && e.content.exit_code === 0) return false
      if (needle && !e.content.command.toLowerCase().includes(needle)) return false
      return true
    })
  }, [entries, search, failedOnly])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Commands</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} commands
          </div>
        </div>
      </div>

      <div className="filter-form">
        <label className="filter-search">
          <input
            type="search"
            placeholder="Filter by command…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </label>
        <div className="filter-divider" />
        <button
          type="button"
          className={'chip' + (failedOnly ? ' is-active' : '')}
          aria-pressed={failedOnly}
          onClick={toggleFailed}
        >
          Failed only
        </button>
      </div>

      <EntryTable
        columns={commandColumns}
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
            ? 'No commands recorded yet.'
            : 'No commands match these filters.'
        }
      />

      {selectedId && <CommandDetail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function CommandDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['commands', 'show', id],
    queryFn: () => api.commands.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Command"
      title={
        entry ? (
          <span className="job-title">
            <OutcomeBadge
              label={String(entry.content.exit_code)}
              tone={entry.content.exit_code === 0 ? 'ok' : 'fail'}
            />
            <span>{entry.content.command}</span>
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
      {detail && <CommandDetailBody detail={detail} />}
    </EntryDetailDrawer>
  )
}

const commandColumns: EntryColumn<EntryRow<CommandEntryContent>>[] = [
  {
    key: 'exit',
    label: 'Exit',
    render: (e) => (
      <OutcomeBadge
        label={String(e.content.exit_code)}
        tone={e.content.exit_code === 0 ? 'ok' : 'fail'}
      />
    ),
  },
  {
    key: 'command',
    label: 'Command',
    render: (e) => (
      <span className="cell-command" title={e.content.command}>
        {e.content.command}
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
