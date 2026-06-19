import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type EntryShowResponse, type NotificationEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MetricGrid, type Metric } from '../components/MetricGrid'

const GRID = 'minmax(200px,2fr) 130px minmax(180px,1fr) 74px 26px'

export function NotificationsScreen() {
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

  const list = useEntryList<NotificationEntryContent>({
    queryKey: ['notifications', 'list'],
    fetcher: api.notifications.list,
    isPolling: isPolling && !selectedId,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return list.rows
    return list.rows.filter((e) =>
      `${e.content.notification} ${e.content.channel} ${e.content.notifiable}`.toLowerCase().includes(needle)
    )
  }, [list.rows, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Notifications</h1>
          <div className="screen-subtitle">{filtered.length} of {list.rows.length} sent</div>
        </div>
      </div>
      <div className="filter-form">
        <label className="filter-search">
          <input type="search" placeholder="Filter by notification, channel, notifiable…" value={search}
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
        emptyMessage="No notifications sent yet."
      />
      {selectedId && <Detail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['notifications', 'show', id], queryFn: () => api.notifications.show(id) })
  return (
    <EntryDetailDrawer isOpen onClose={onClose} eyebrow="Notification"
      title={q.data?.entry ? <span>{shortClass(q.data.entry.content.notification)}</span> : 'Loading…'}
      subtitle={q.data?.entry?.content.notification}>
      {q.isLoading && <div className="state">Loading…</div>}
      {q.data && <Body detail={q.data} />}
    </EntryDetailDrawer>
  )
}

function Body({ detail }: { detail: EntryShowResponse<NotificationEntryContent> }) {
  const { entry } = detail
  const metrics: Metric[] = [
    { label: 'Channel', value: entry.content.channel },
    { label: 'Queued', value: entry.content.queued ? 'Yes' : 'No' },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]
  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />
      <section className="detail-section">
        <div className="detail-section__label">Notifiable</div>
        <div className="code-card"><pre className="code-card__sql">{entry.content.notifiable}</pre></div>
      </section>
      {entry.content.response !== undefined && entry.content.response !== null && (
        <section className="detail-section">
          <div className="detail-section__label">Channel response</div>
          <div className="code-card">
            <pre className="code-card__sql">{
              typeof entry.content.response === 'string'
                ? entry.content.response
                : JSON.stringify(entry.content.response, null, 2)
            }</pre>
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

const columns: EntryColumn<EntryRow<NotificationEntryContent>>[] = [
  { key: 'notification', label: 'Notification', render: (e) => <span className="cell-mono" title={e.content.notification}>{shortClass(e.content.notification)}</span> },
  { key: 'channel', label: 'Channel', render: (e) => <span className="cell-conn">{e.content.channel}</span> },
  { key: 'notifiable', label: 'Notifiable', render: (e) => <span className="cell-location" title={e.content.notifiable}>{e.content.notifiable}</span> },
  { key: 'when', label: 'When', align: 'right', render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span> },
]
