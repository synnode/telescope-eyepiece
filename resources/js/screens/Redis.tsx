import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type RedisEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatDuration, formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = '90px minmax(220px,1fr) 80px 74px 26px'

export function RedisScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const selectedId = params.get('id')

  const setSearch = (next: string) => {
    const m = new URLSearchParams(params)
    if (next) m.set('q', next); else m.delete('q')
    m.delete('id'); setParams(m, { replace: true })
  }
  const openDetail = useCallback((id: string) => {
    const next = new URLSearchParams(params); next.set('id', id); setParams(next)
  }, [params, setParams])
  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(params); next.delete('id'); setParams(next)
  }, [params, setParams])

  const list = useEntryList<RedisEntryContent>({
    queryKey: ['redis', 'list'],
    fetcher: api.redis.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) =>
      `${e.content.command} ${e.content.connection}`.toLowerCase().includes(needle)
    )
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Redis</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} commands</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by command or connection…" value={search}
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
        emptyMessage="No redis commands recorded yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['redis', 'show', id], queryFn: () => api.redis.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Redis command"
      title={q.data?.entry ? <span className="cell-mono">{q.data.entry.content.command}</span> : 'Loading…'}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<RedisEntryContent> }) {
  const { entry } = detail
  const time = toNumber(entry.content.time)
  const metrics: Metric[] = [
    { label: 'Connection', value: entry.content.connection, tone: 'small' },
    { label: 'Time', value: formatDuration(time) },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      <section className="detail-section">
        <div className="detail-section__label">Command</div>
        <div className="code-card"><pre className="code-card__sql">{entry.content.command}</pre></div>
      </section>
    </div>
  )
}

function toNumber(v: number | string): number {
  return typeof v === 'number' ? v : Number(v) || 0
}

const columns: EntryColumn<EntryRow<RedisEntryContent>>[] = [
  { key: 'conn', label: 'Conn', render: (e) => <span className="cell-conn">{e.content.connection}</span> },
  { key: 'cmd', label: 'Command', render: (e) => <span className="cell-mono" title={e.content.command}>{e.content.command}</span> },
  { key: 'time', label: 'Time', align: 'right', render: (e) => {
    const ms = toNumber(e.content.time)
    const tone = ms >= 50 ? 'is-slow' : 'is-fast'
    return <span className={'cell-time ' + tone}>{formatDuration(ms)}</span>
  }},
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
