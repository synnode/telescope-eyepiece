import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type CacheEntryContent, type EntryRow, type EntryShowResponse } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { OutcomeBadge } from '../components/OutcomeBadge'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = '90px minmax(220px,1fr) minmax(200px,1fr) 74px 26px'
const TYPES = ['hit', 'missed', 'written', 'forgotten'] as const

export function CacheScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const typeParam = params.get('t') ?? ''
  const activeTypes = useMemo(() => new Set(typeParam.split(',').filter(Boolean)), [typeParam])
  const selectedId = params.get('id')

  const setSearch = (next: string) => {
    const m = new URLSearchParams(params)
    if (next) m.set('q', next); else m.delete('q')
    m.delete('id')
    setParams(m, { replace: true })
  }
  const toggleType = (t: string) => {
    const next = new Set(activeTypes)
    if (next.has(t)) next.delete(t); else next.add(t)
    const m = new URLSearchParams(params)
    const j = Array.from(next).join(',')
    if (j) m.set('t', j); else m.delete('t')
    m.delete('id')
    setParams(m, { replace: true })
  }
  const openDetail = useCallback((id: string) => {
    const next = new URLSearchParams(params); next.set('id', id); setParams(next)
  }, [params, setParams])
  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(params); next.delete('id'); setParams(next)
  }, [params, setParams])

  const list = useEntryList<CacheEntryContent>({
    queryKey: ['cache', 'list'],
    fetcher: api.cache.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return list.rows.filter((e) => {
      if (activeTypes.size > 0 && !activeTypes.has(e.content.type)) return false
      if (needle && !e.content.key.toLowerCase().includes(needle)) return false
      return true
    })
  }, [list.rows, search, activeTypes])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Cache</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} entries</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by key…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 10 }} />
        </label>
        <div className="filter-divider" />
        <div className="chip-group">
          {TYPES.map((t) => (
            <button key={t} type="button"
              className={'chip' + (activeTypes.has(t) ? ' is-active' : '')}
              aria-pressed={activeTypes.has(t)} onClick={() => toggleType(t)}>
              {t}
            </button>
          ))}
        </div>
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
        emptyMessage="No cache operations recorded yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['cache', 'show', id], queryFn: () => api.cache.show(id) })
  const entry = q.data?.entry
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Cache entry"
      title={entry ? <span className="job-title"><OutcomeBadge label={entry.content.type} tone={typeTone(entry.content.type)} /><span>{entry.content.key}</span></span> : 'Loading…'}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<CacheEntryContent> }) {
  const { entry } = detail
  const metrics: Metric[] = [
    { label: 'Type', value: <OutcomeBadge label={entry.content.type} tone={typeTone(entry.content.type)} /> },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
    { label: 'Expires', value: entry.content.expiration ? `${entry.content.expiration}s` : '—' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      <section className="detail-section">
        <div className="detail-section__label">Key</div>
        <div className="code-card"><pre className="code-card__sql">{entry.content.key}</pre></div>
      </section>
      {entry.content.value !== undefined && entry.content.value !== null && (
        <section className="detail-section">
          <div className="detail-section__label">Value</div>
          <div className="code-card">
            <pre className="code-card__sql">{
              typeof entry.content.value === 'string'
                ? entry.content.value
                : JSON.stringify(entry.content.value, null, 2)
            }</pre>
          </div>
        </section>
      )}
    </div>
  )
}

function typeTone(t: string): 'ok' | 'fail' | 'pending' | 'muted' {
  if (t === 'hit') return 'ok'
  if (t === 'missed') return 'fail'
  if (t === 'written') return 'pending'
  return 'muted'
}

const columns: EntryColumn<EntryRow<CacheEntryContent>>[] = [
  { key: 'type', label: 'Type', render: (e) => <OutcomeBadge label={e.content.type} tone={typeTone(e.content.type)} /> },
  { key: 'key', label: 'Key', render: (e) => <span className="cell-mono" title={e.content.key}>{e.content.key}</span> },
  { key: 'value', label: 'Value', render: (e) => (
    <span className="cell-mono cell-mono--muted" title={String(e.content.value ?? '')}>
      {e.content.value === undefined ? '—' : typeof e.content.value === 'string' ? e.content.value : JSON.stringify(e.content.value)}
    </span>
  )},
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
