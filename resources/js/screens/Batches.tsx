import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type BatchEntryContent, type EntryRow, type EntryShowResponse } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = 'minmax(180px,1fr) 90px 90px 70px 74px 26px'

export function BatchesScreen() {
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

  const list = useEntryList<BatchEntryContent>({
    queryKey: ['batches', 'list'],
    fetcher: api.batches.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) => (e.content.name ?? '').toLowerCase().includes(needle))
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Batches</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} batches</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by name…" value={search}
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
        emptyMessage="No batches dispatched yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['batches', 'show', id], queryFn: () => api.batches.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Job batch"
      title={q.data?.entry ? <span>{q.data.entry.content.name || '(unnamed)'}</span> : 'Loading…'}
      subtitle={q.data?.entry?.content.id}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<BatchEntryContent> }) {
  const { entry } = detail
  const c = entry.content
  const processed = c.processedJobs ?? c.totalJobs - c.pendingJobs
  const progress = c.totalJobs > 0 ? Math.round((processed / c.totalJobs) * 100) : 0
  const metrics: Metric[] = [
    { label: 'Total', value: c.totalJobs },
    { label: 'Processed', value: processed },
    { label: 'Failed', value: c.failedJobs, valueClassName: c.failedJobs > 0 ? 'is-status-5xx' : undefined },
    { label: 'Pending', value: c.pendingJobs },
    { label: 'Queue', value: c.queue ?? '—', tone: 'small' },
    { label: 'Progress', value: `${progress}%`, tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      <div className="batch-progress">
        <div className="batch-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <section className="detail-section">
        <div className="detail-section__label">Batch info</div>
        <div className="kv-list">
          <div className="kv-row"><div className="kv-row__key">id</div><div className="kv-row__value">{c.id}</div></div>
          <div className="kv-row"><div className="kv-row__key">connection</div><div className="kv-row__value">{c.connection ?? '—'}</div></div>
          <div className="kv-row"><div className="kv-row__key">allows failures</div><div className="kv-row__value">{c.allowsFailures ? 'yes' : 'no'}</div></div>
          {c.cancelledAt && <div className="kv-row"><div className="kv-row__key">cancelled at</div><div className="kv-row__value">{c.cancelledAt}</div></div>}
          {c.finishedAt && <div className="kv-row"><div className="kv-row__key">finished at</div><div className="kv-row__value">{c.finishedAt}</div></div>}
        </div>
      </section>
    </div>
  )
}

const columns: EntryColumn<EntryRow<BatchEntryContent>>[] = [
  { key: 'name', label: 'Name', render: (e) => <span className="cell-mono" title={e.content.name ?? ''}>{e.content.name || '(unnamed)'}</span> },
  { key: 'total', label: 'Total', align: 'right', render: (e) => <span className="cell-sql">{e.content.totalJobs}</span> },
  { key: 'pending', label: 'Pending', align: 'right', render: (e) => <span className="cell-sql">{e.content.pendingJobs}</span> },
  { key: 'failed', label: 'Failed', align: 'right', render: (e) => (
    <span className="cell-sql" style={e.content.failedJobs > 0 ? { color: 'var(--threshold-error)' } : undefined}>{e.content.failedJobs}</span>
  )},
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
