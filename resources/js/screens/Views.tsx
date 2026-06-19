import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type ViewEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = 'minmax(180px,1fr) minmax(220px,2fr) 80px 74px 26px'

export function ViewsScreen() {
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

  const list = useEntryList<ViewEntryContent>({
    queryKey: ['views', 'list'],
    fetcher: api.views.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) =>
      `${e.content.name} ${e.content.path ?? ''}`.toLowerCase().includes(needle)
    )
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Views</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} renders</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by view name or path…" value={search}
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
        emptyMessage="No views rendered yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['views', 'show', id], queryFn: () => api.views.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="View"
      title={q.data?.entry ? <span>{q.data.entry.content.name}</span> : 'Loading…'}
      subtitle={q.data?.entry?.content.path}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<ViewEntryContent> }) {
  const { entry } = detail
  const data = Array.isArray(entry.content.data)
    ? entry.content.data
    : Object.keys(entry.content.data ?? {})
  const metrics: Metric[] = [
    { label: 'Data keys', value: data.length },
    { label: 'Composers', value: entry.content.composers?.length ?? 0 },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      {data.length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Data variables</div>
          <div className="kv-list">
            {data.map((k) => (
              <div key={k} className="kv-row">
                <div className="kv-row__key">{k}</div>
                <div className="kv-row__value">passed</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {entry.content.composers && entry.content.composers.length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Composers</div>
          <div className="kv-list">
            {entry.content.composers.map((c) => (
              <div key={c} className="kv-row">
                <div className="kv-row__key">composer</div>
                <div className="kv-row__value">{c}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const columns: EntryColumn<EntryRow<ViewEntryContent>>[] = [
  { key: 'name', label: 'Name', render: (e) => <span className="cell-mono">{e.content.name}</span> },
  { key: 'path', label: 'Path', render: (e) => <span className="cell-location">{e.content.path ?? '—'}</span> },
  { key: 'data', label: 'Data', align: 'right', render: (e) => {
    const n = Array.isArray(e.content.data) ? e.content.data.length : Object.keys(e.content.data ?? {}).length
    return <span className="cell-sql">{n} {n === 1 ? 'key' : 'keys'}</span>
  }},
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
