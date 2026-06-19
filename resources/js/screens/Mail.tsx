import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ShellContext } from '../App'
import { api, type EntryRow, type MailAddressMap, type MailEntryContent } from '../lib/api'
import { useEntryList } from '../lib/useEntryList'
import { formatRelative } from '../lib/format'
import { EntryTable, type EntryColumn } from '../components/EntryTable'
import { EntryDetailDrawer } from '../components/EntryDetailDrawer'
import { MailDetailBody } from './mail/MailDetailBody'

const GRID_COLUMNS = '180px minmax(220px,1fr) 200px 74px 26px'

export function MailScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
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

  const list = useEntryList<MailEntryContent>({
    queryKey: ['mail', 'list'],
    fetcher: api.mail.list,
    isPolling: isPolling && !selectedId,
  })

  const entries = list.rows

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter((e) => {
      const hay = [
        e.content.subject ?? '',
        ...addressKeys(e.content.from),
        ...addressKeys(e.content.to),
        e.content.mailable,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [entries, search])

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Mail</h1>
          <div className="screen-subtitle">
            {filtered.length} of {entries.length} messages
          </div>
        </div>
      </div>

      <div className="filter-form">
        <label className="filter-search">
          <input
            type="search"
            placeholder="Filter by subject, address, mailable…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </label>
      </div>

      <EntryTable
        columns={mailColumns}
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
            ? 'No mail sent yet.'
            : 'No messages match these filters.'
        }
      />

      {selectedId && <MailDetail id={selectedId} onClose={closeDetail} />}
    </>
  )
}

function MailDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['mail', 'show', id],
    queryFn: () => api.mail.show(id),
  })

  const detail = detailQuery.data
  const entry = detail?.entry

  return (
    <EntryDetailDrawer
      isOpen
      onClose={onClose}
      eyebrow="Mail"
      title={entry ? <span>{entry.content.subject || '(no subject)'}</span> : 'Loading…'}
      subtitle={
        entry ? `from ${addressLabel(entry.content.from)}` : undefined
      }
    >
      {detailQuery.isLoading && <div className="state">Loading detail…</div>}
      {detailQuery.isError && (
        <div className="state state--error">
          {(detailQuery.error as Error).message}
        </div>
      )}
      {detail && <MailDetailBody detail={detail} />}
    </EntryDetailDrawer>
  )
}

function addressKeys(map: MailAddressMap | undefined): string[] {
  return map ? Object.keys(map).concat(Object.values(map).filter(Boolean) as string[]) : []
}

function addressLabel(map: MailAddressMap | undefined): string {
  if (!map) return '—'
  const entries = Object.entries(map)
  if (entries.length === 0) return '—'
  const [email, name] = entries[0]!
  return name ? `${name} <${email}>` : email
}

const mailColumns: EntryColumn<EntryRow<MailEntryContent>>[] = [
  {
    key: 'from',
    label: 'From',
    render: (e) => (
      <span className="cell-mail-addr">{addressLabel(e.content.from)}</span>
    ),
  },
  {
    key: 'subject',
    label: 'Subject',
    render: (e) => (
      <span className="cell-mail-subject" title={e.content.subject ?? ''}>
        {e.content.subject || '(no subject)'}
      </span>
    ),
  },
  {
    key: 'to',
    label: 'To',
    render: (e) => (
      <span className="cell-mail-addr">{addressLabel(e.content.to)}</span>
    ),
  },
  {
    key: 'when',
    label: 'When',
    align: 'right',
    render: (e) => <span className="cell-when">{formatRelative(e.created_at)}</span>,
  },
]
