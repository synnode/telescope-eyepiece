import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type ModelEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { OutcomeBadge } from '../components/OutcomeBadge'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = '90px minmax(220px,1fr) 90px 74px 26px'
const ACTIONS = ['created', 'updated', 'deleted', 'restored', 'retrieved'] as const

export function ModelsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const actionParam = params.get('a') ?? ''
  const activeActions = useMemo(() => new Set(actionParam.split(',').filter(Boolean)), [actionParam])
  const selectedId = params.get('id')

  const setSearch = (next: string) => {
    const m = new URLSearchParams(params); if (next) m.set('q', next); else m.delete('q')
    m.delete('id'); setParams(m, { replace: true })
  }
  const toggleAction = (a: string) => {
    const next = new Set(activeActions); if (next.has(a)) next.delete(a); else next.add(a)
    const m = new URLSearchParams(params); const j = Array.from(next).join(',')
    if (j) m.set('a', j); else m.delete('a')
    m.delete('id'); setParams(m, { replace: true })
  }
  const openDetail = useCallback((id: string) => {
    const n = new URLSearchParams(params); n.set('id', id); setParams(n)
  }, [params, setParams])
  const closeDetail = useCallback(() => {
    const n = new URLSearchParams(params); n.delete('id'); setParams(n)
  }, [params, setParams])

  const list = useEntryList<ModelEntryContent>({
    queryKey: ['models', 'list'],
    fetcher: api.models.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return list.rows.filter((e) => {
      if (activeActions.size > 0 && !activeActions.has(e.content.action)) return false
      if (needle && !e.content.model.toLowerCase().includes(needle)) return false
      return true
    })
  }, [list.rows, search, activeActions])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Models</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} events</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by model class…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 10 }} />
        </label>
        <div className="filter-divider" />
        <div className="chip-group">
          {ACTIONS.map((a) => (
            <button key={a} type="button"
              className={'chip' + (activeActions.has(a) ? ' is-active' : '')}
              aria-pressed={activeActions.has(a)} onClick={() => toggleAction(a)}>
              {a}
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
        emptyMessage="No model events recorded yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['models', 'show', id], queryFn: () => api.models.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Model event"
      title={q.data?.entry ? (
        <span className="job-title">
          <OutcomeBadge label={q.data.entry.content.action} tone={actionTone(q.data.entry.content.action)} />
          <span>{shortClass(q.data.entry.content.model)}</span>
        </span>
      ) : 'Loading…'}
      subtitle={q.data?.entry?.content.model}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<ModelEntryContent> }) {
  const { entry } = detail
  const metrics: Metric[] = [
    { label: 'Action', value: <OutcomeBadge label={entry.content.action} tone={actionTone(entry.content.action)} /> },
    { label: 'Count', value: entry.content.count ?? 1 },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      {entry.content.changes && Object.keys(entry.content.changes).length > 0 && (
        <section className="detail-section">
          <div className="detail-section__label">Changes</div>
          <div className="kv-list">
            {Object.entries(entry.content.changes).map(([k, v]) => (
              <div key={k} className="kv-row">
                <div className="kv-row__key">{k}</div>
                <div className="kv-row__value">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function actionTone(action: string): 'ok' | 'fail' | 'pending' | 'muted' {
  if (action === 'created') return 'ok'
  if (action === 'deleted') return 'fail'
  if (action === 'updated' || action === 'restored') return 'pending'
  return 'muted'
}

function shortClass(fqcn: string): string {
  const p = fqcn.split('\\')
  return p[p.length - 1] || fqcn
}

const columns: EntryColumn<EntryRow<ModelEntryContent>>[] = [
  { key: 'action', label: 'Action', render: (e) => <OutcomeBadge label={e.content.action} tone={actionTone(e.content.action)} /> },
  { key: 'model', label: 'Model', render: (e) => <span className="cell-mono" title={e.content.model}>{shortClass(e.content.model)}</span> },
  { key: 'count', label: 'Count', align: 'right', render: (e) => <span className="cell-sql">{e.content.count ?? 1}</span> },
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
