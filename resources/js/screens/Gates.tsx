import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type GateEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { OutcomeBadge } from '../components/OutcomeBadge'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = '90px minmax(180px,1fr) minmax(180px,1fr) 74px 26px'

export function GatesScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const deniedOnly = params.get('denied') === '1'
  const selectedId = params.get('id')

  const setSearch = (next: string) => {
    const m = new URLSearchParams(params); if (next) m.set('q', next); else m.delete('q')
    m.delete('id'); setParams(m, { replace: true })
  }
  const toggleDenied = () => {
    const m = new URLSearchParams(params); if (deniedOnly) m.delete('denied'); else m.set('denied', '1')
    m.delete('id'); setParams(m, { replace: true })
  }
  const openDetail = useCallback((id: string) => {
    const n = new URLSearchParams(params); n.set('id', id); setParams(n)
  }, [params, setParams])
  const closeDetail = useCallback(() => {
    const n = new URLSearchParams(params); n.delete('id'); setParams(n)
  }, [params, setParams])

  const list = useEntryList<GateEntryContent>({
    queryKey: ['gates', 'list'],
    fetcher: api.gates.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return list.rows.filter((e) => {
      if (deniedOnly && e.content.result !== 'denied') return false
      if (needle && !e.content.ability.toLowerCase().includes(needle)) return false
      return true
    })
  }, [list.rows, search, deniedOnly])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Gates</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} checks</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by ability…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 10 }} />
        </label>
        <div className="filter-divider" />
        <button type="button" className={'chip' + (deniedOnly ? ' is-active' : '')}
          aria-pressed={deniedOnly} onClick={toggleDenied}>Denied only</button>
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
        emptyMessage="No gate checks recorded yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['gates', 'show', id], queryFn: () => api.gates.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Gate check"
      title={q.data?.entry ? (
        <span className="job-title">
          <OutcomeBadge label={q.data.entry.content.result} tone={q.data.entry.content.result === 'allowed' ? 'ok' : 'fail'} />
          <span>{q.data.entry.content.ability}</span>
        </span>
      ) : 'Loading…'}
      subtitle={q.data?.entry?.content.file ? `${trimPath(q.data.entry.content.file)}:${q.data.entry.content.line}` : undefined}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<GateEntryContent> }) {
  const { entry } = detail
  const args = entry.content.arguments ?? []
  const metrics: Metric[] = [
    { label: 'Result', value: <OutcomeBadge label={entry.content.result} tone={entry.content.result === 'allowed' ? 'ok' : 'fail'} /> },
    { label: 'Ability', value: entry.content.ability, tone: 'small' },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      {entry.content.message && (
        <div className="exc-message">
          <pre>{entry.content.message}</pre>
        </div>
      )}
      {args.length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Arguments</div>
          <div className="kv-list">
            {args.map((a, i) => (
              <div key={i} className="kv-row">
                <div className="kv-row__key">#{i}</div>
                <div className="kv-row__value">{typeof a === 'string' ? a : JSON.stringify(a)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function trimPath(file: string): string {
  const idx = file.indexOf('/app/')
  if (idx !== -1) return file.slice(idx + 1)
  const parts = file.split('/'); return parts.slice(-3).join('/')
}

const columns: EntryColumn<EntryRow<GateEntryContent>>[] = [
  { key: 'result', label: 'Result', render: (e) => <OutcomeBadge label={e.content.result} tone={e.content.result === 'allowed' ? 'ok' : 'fail'} /> },
  { key: 'ability', label: 'Ability', render: (e) => <span className="cell-mono" title={e.content.ability}>{e.content.ability}</span> },
  { key: 'location', label: 'Location', render: (e) => (
    <span className="cell-location">{e.content.file ? `${trimPath(e.content.file)}:${e.content.line}` : '—'}</span>
  )},
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
