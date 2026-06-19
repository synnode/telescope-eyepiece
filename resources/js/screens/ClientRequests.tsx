import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type ClientRequestEntryContent, type EntryRow, type EntryShowResponse } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatDuration, formatRelative, statusClass } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { VerbBadge } from '../components/VerbBadge'
import { StatusBadge } from '../components/StatusBadge'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = '52px minmax(220px,1fr) 60px 70px 74px 26px'

export function ClientRequestsScreen() {
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

  const list = useEntryList<ClientRequestEntryContent>({
    queryKey: ['client-requests', 'list'],
    fetcher: api.clientRequests.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) => e.content.uri.toLowerCase().includes(needle))
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">HTTP Client</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} outbound calls</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by URI…" value={search}
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
        emptyMessage="No outbound HTTP calls recorded yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['client-requests', 'show', id], queryFn: () => api.clientRequests.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="HTTP client request"
      title={q.data?.entry ? (
        <span className="job-title">
          <VerbBadge method={q.data.entry.content.method} />
          <span>{q.data.entry.content.uri}</span>
        </span>
      ) : 'Loading…'}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<ClientRequestEntryContent> }) {
  const { entry } = detail
  const { content } = entry
  const duration = toNumber(content.duration)
  const sCls = content.response_status ? statusClass(content.response_status) : 'other'
  const metrics: Metric[] = [
    { label: 'Status', value: content.response_status ?? '—', valueClassName: `is-status-${sCls}` },
    { label: 'Duration', value: formatDuration(duration) },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      {content.headers && Object.keys(content.headers).length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Request headers</div>
          <div className="kv-list">
            {Object.entries(content.headers).map(([k, v]) => (
              <div key={k} className="kv-row">
                <div className="kv-row__key">{k}</div>
                <div className="kv-row__value">{Array.isArray(v) ? v.join(', ') : v}</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {content.response !== undefined && content.response !== null && (
        <section className="detail-section">
          <div className="detail-section__label">Response body</div>
          <div className="code-card">
            <pre className="code-card__sql">{
              typeof content.response === 'string'
                ? content.response
                : JSON.stringify(content.response, null, 2)
            }</pre>
          </div>
        </section>
      )}
    </div>
  )
}

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

const columns: EntryColumn<EntryRow<ClientRequestEntryContent>>[] = [
  { key: 'verb', label: 'Verb', render: (e) => <VerbBadge method={e.content.method} /> },
  { key: 'uri', label: 'URI', render: (e) => <span className="cell-mono" title={e.content.uri}>{e.content.uri}</span> },
  { key: 'status', label: 'Status', align: 'right', render: (e) => e.content.response_status ? <StatusBadge status={e.content.response_status} /> : <span className="cell-sql">—</span> },
  { key: 'time', label: 'Time', align: 'right', render: (e) => {
    const ms = toNumber(e.content.duration); if (!ms) return <span className="cell-sql">—</span>
    const tone = ms >= 1000 ? 'is-slowest' : ms >= 500 ? 'is-slow' : 'is-fast'
    return <span className={'cell-time ' + tone}>{formatDuration(ms)}</span>
  }},
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
