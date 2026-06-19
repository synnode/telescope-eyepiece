import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type JobEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { OutcomeBadge } from '../components/OutcomeBadge'
import { JobDetailBody } from './jobs/JobDetailBody'

function jobTone(status: string): 'ok' | 'pending' | 'fail' | 'muted' {
  switch (status) {
    case 'processed':
      return 'ok'
    case 'failed':
      return 'fail'
    case 'pending':
      return 'pending'
    default:
      return 'muted'
  }
}

const GRID_COLUMNS = '90px 90px minmax(220px,1fr) 74px 26px'
const STATUSES = ['pending', 'processed', 'failed'] as const

export function JobsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const statusParam = params.get('s') ?? ''
  const activeStatuses = useMemo(
    () => new Set(statusParam.split(',').filter(Boolean)),
    [statusParam],
  )
  const selectedId = params.get('id')

  const setSearch = useCallback(
    (next: string) => {
      const merged = new URLSearchParams(params)
      if (next) merged.set('q', next)
      else merged.delete('q')
      merged.delete('id')
      setParams(merged, { replace: true })
    },
    [params, setParams],
  )

  const toggleStatus = useCallback(
    (s: string) => {
      const next = new Set(activeStatuses)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      const merged = new URLSearchParams(params)
      const joined = Array.from(next).join(',')
      if (joined) merged.set('s', joined)
      else merged.delete('s')
      merged.delete('id')
      setParams(merged, { replace: true })
    },
    [activeStatuses, params, setParams],
  )

  const openDetail = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set('id', id)
      setParams(next, { replace: false })
    },
    [params, setParams],
  )

  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('id')
    setParams(next, { replace: false })
  }, [params, setParams])

  const list = useEntryList<JobEntryContent>({
    queryKey: ['jobs', 'list'],
    fetcher: api.jobs.list,
    isPolling: isPolling && !selectedId,
  })

  const entries = list.rows

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (activeStatuses.size > 0 && !activeStatuses.has(e.content.status)) {
        return false
      }
      if (needle) {
        const hay = [e.content.name, e.content.queue, e.content.connection]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [entries, search, activeStatuses])

  const failedCount = useMemo(
    () => entries.filter((e) => e.content.status === 'failed').length,
    [entries],
  )

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Jobs</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} jobs
          </div>
        </div>
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card__label">Failed</span>
            <span
              className={
                'stat-card__value' + (failedCount > 0 ? ' is-error' : ' is-ok')
              }
            >
              {failedCount}
            </span>
          </div>
        </div>
      </div>

      <div className="filter-form">
        <label className="filter-search">
          <input
            type="search"
            placeholder="Filter by job class, queue, connection…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </label>
        <div className="filter-divider" />
        <div className="chip-group" role="group" aria-label="Status">
          {STATUSES.map((s) => {
            const active = activeStatuses.has(s)
            return (
              <button
                key={s}
                type="button"
                className={'chip' + (active ? ' is-active' : '')}
                aria-pressed={active}
                onClick={() => toggleStatus(s)}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      <EntryTable
        columns={jobColumns}
        rows={filtered}
        gridTemplateColumns={GRID_COLUMNS}
        getRowKey={(e) => e.id}
        selectedKey={selectedId}
        onRowClick={(e) => openDetail(e.id)}
        isLoading={list.isLoading}
        hasMore={list.hasMore}
        isLoadingMore={list.isLoadingMore}
        onLoadMore={list.loadMore}
        emptyMessage={
          entries.length === 0
            ? 'No jobs recorded yet.'
            : 'No jobs match these filters.'
        }
      />

      {selectedId && <JobDetail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function JobDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['jobs', 'show', id],
    queryFn: () => api.jobs.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Job detail"
      title={
        entry ? (
          <span className="job-title">
            <OutcomeBadge label={entry.content.status} tone={jobTone(entry.content.status)} />
            <span>{shortClass(entry.content.name)}</span>
          </span>
        ) : (
          'Loading…'
        )
      }
      subtitle={entry ? entry.content.name : undefined}
    >
      {detailQuery.isLoading && <div className="state">Loading detail…</div>}
      {detailQuery.isError && (
        <div className="state state--error">
          {(detailQuery.error as Error).message}
        </div>
      )}
      {detail && <JobDetailBody detail={detail} />}
    </EntryDetailDrawer>
  )
}

function shortClass(fqcn: string): string {
  const parts = fqcn.split('\\')
  return parts[parts.length - 1] || fqcn
}

const jobColumns: EntryColumn<EntryRow<JobEntryContent>>[] = [
  {
    key: 'status',
    label: 'Status',
    render: (e) => (
      <OutcomeBadge label={e.content.status} tone={jobTone(e.content.status)} />
    ),
  },
  {
    key: 'queue',
    label: 'Queue',
    render: (e) => (
      <span className="cell-conn">{e.content.queue || 'default'}</span>
    ),
  },
  {
    key: 'name',
    label: 'Job',
    render: (e) => (
      <span className="cell-job-name" title={e.content.name}>
        {shortClass(e.content.name)}
      </span>
    ),
  },
  {
    key: 'when',
    label: 'When',
    align: 'right',
    render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span>,
  },
]
