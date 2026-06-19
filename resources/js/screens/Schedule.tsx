import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type ScheduleEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = 'minmax(180px,1fr) 130px minmax(180px,1fr) 74px 26px'

export function ScheduleScreen() {
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

  const list = useEntryList<ScheduleEntryContent>({
    queryKey: ['schedule', 'list'],
    fetcher: api.schedule.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) =>
      `${e.content.command} ${e.content.description ?? ''} ${e.content.expression}`.toLowerCase().includes(needle)
    )
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Schedule</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} runs</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by command, description, expression…" value={search}
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
        emptyMessage="No scheduled commands recorded yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['schedule', 'show', id], queryFn: () => api.schedule.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Scheduled command"
      title={q.data?.entry ? <span className="cell-mono">{q.data.entry.content.command}</span> : 'Loading…'}
      subtitle={q.data?.entry?.content.description ?? undefined}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<ScheduleEntryContent> }) {
  const { entry } = detail
  const metrics: Metric[] = [
    { label: 'Expression', value: <span className="cell-mono">{entry.content.expression}</span>, tone: 'small' },
    { label: 'Timezone', value: entry.content.timezone ?? '—', tone: 'small' },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      {entry.content.user && (
        <section className="detail-section">
          <div className="detail-section__label">Run as</div>
          <div className="code-card"><pre className="code-card__sql">{entry.content.user}</pre></div>
        </section>
      )}
      {entry.content.output && (
        <section className="detail-section">
          <div className="detail-section__label">Output</div>
          <div className="code-card"><pre className="code-card__sql">{entry.content.output}</pre></div>
        </section>
      )}
    </div>
  )
}

const columns: EntryColumn<EntryRow<ScheduleEntryContent>>[] = [
  { key: 'command', label: 'Command', render: (e) => <span className="cell-mono" title={e.content.command}>{e.content.command}</span> },
  { key: 'expr', label: 'Expression', render: (e) => <span className="cell-conn">{e.content.expression}</span> },
  { key: 'desc', label: 'Description', render: (e) => <span className="cell-location" title={e.content.description ?? ''}>{e.content.description || '—'}</span> },
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
