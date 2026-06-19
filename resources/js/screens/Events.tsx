import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type EventEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = 'minmax(220px,2fr) 80px 90px 74px 26px'

export function EventsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const selectedId = params.get('id')

  const setSearch = (next: string) => {
    const m = new URLSearchParams(params); if (next) m.set('q', next); else m.delete('q')
    m.delete('id'); setParams(m, { replace: true })
  }
  const openDetail = useCallback((id: string) => {
    const n = new URLSearchParams(params); n.set('id', id); setParams(n)
  }, [params, setParams])
  const closeDetail = useCallback(() => {
    const n = new URLSearchParams(params); n.delete('id'); setParams(n)
  }, [params, setParams])

  const list = useEntryList<EventEntryContent>({
    queryKey: ['events', 'list'],
    fetcher: api.events.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) => e.content.name.toLowerCase().includes(needle))
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Events</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} events</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by event name…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 10 }} />
        </label>
      </div>
      <EntryTable
        columns={columns}
        rows={filtered}
        gridTemplateColumns={GRID}
        getRowKey={(e) => e.id}
        selectedKey={selectedId}
        onRowClick={(e) => openDetail(e.id)}
        isLoading={list.isLoading}
        hasMore={list.hasMore}
        isLoadingMore={list.isLoadingMore}
        onLoadMore={list.loadMore}
        emptyMessage="No events dispatched yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['events', 'show', id], queryFn: () => api.events.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Event"
      title={q.data?.entry ? <span>{shortClass(q.data.entry.content.name)}</span> : 'Loading…'}
      subtitle={q.data?.entry?.content.name}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<EventEntryContent> }) {
  const { entry } = detail
  const metrics: Metric[] = [
    { label: 'Listeners', value: entry.content.listeners?.length ?? 0 },
    { label: 'Broadcast', value: entry.content.broadcast ? 'Yes' : 'No' },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      {entry.content.payload && Object.keys(entry.content.payload).length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Payload</div>
          <div className="kv-list">
            {Object.entries(entry.content.payload).map(([k, v]) => (
              <div key={k} className="kv-row">
                <div className="kv-row__key">{k}</div>
                <div className="kv-row__value">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {entry.content.listeners && entry.content.listeners.length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Listeners</div>
          <div className="kv-list">
            {entry.content.listeners.map((l, i) => {
              const name = typeof l === 'string' ? l : l.name
              const queued = typeof l === 'string' ? false : Boolean(l.queued)
              return (
                <div key={`${name}-${i}`} className="kv-row">
                  <div className="kv-row__key">{queued ? 'queued' : 'sync'}</div>
                  <div className="kv-row__value">{name}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function shortClass(fqcn: string): string {
  const p = fqcn.split('\\')
  return p[p.length - 1] || fqcn
}

const columns: EntryColumn<EntryRow<EventEntryContent>>[] = [
  { key: 'name', label: 'Event', render: (e) => <span className="cell-mono" title={e.content.name}>{shortClass(e.content.name)}</span> },
  { key: 'listeners', label: 'Listeners', align: 'right', render: (e) => <span className="cell-sql">{e.content.listeners?.length ?? 0}</span> },
  { key: 'broadcast', label: 'Broadcast', render: (e) => <span className="cell-conn">{e.content.broadcast ? 'yes' : '—'}</span> },
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
