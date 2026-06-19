import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import type { ShellContext } from '../App'
import { api } from '../lib/api'
import { formatRelative } from '../lib/format'

export function DumpsScreen() {
  const { isPolling } = useOutletContext<ShellContext>()
  const q = useQuery({
    queryKey: ['dumps', 'list'],
    queryFn: () => api.dumps.list({ take: 100 }),
    refetchInterval: isPolling ? 2000 : false,
  })

  const entries = q.data?.entries ?? []
  const wrongCache = q.data?.status === 'wrong-cache'

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Dumps</h1>
          <div className="screen-subtitle">
            {entries.length} {entries.length === 1 ? 'dump' : 'dumps'} captured
          </div>
        </div>
      </div>

      <div className="dumps-area">
        {wrongCache && (
          <div className="dumps-warning">
            <TriangleAlert size={16} />
            <div>
              <strong>Dumps require a persistent cache driver.</strong>
              <p>
                Your cache currently uses the <code>array</code> store, which
                only lives for one request. Set <code>CACHE_DRIVER</code> to
                <code>file</code>, <code>redis</code> or similar so the dump
                watcher can be enabled while this page is open.
              </p>
            </div>
          </div>
        )}

        {!wrongCache && entries.length === 0 && (
          <div className="dumps-empty">
            <p>
              No dumps yet. While this page is open, calls to <code>dump()</code>
              {' '}or <code>dd()</code> will be captured here in real time.
            </p>
          </div>
        )}

        {entries.map((entry) => (
          <article key={entry.id} className="dump-card">
            <header className="dump-card__head">
              <span className="dump-card__when">
                {formatRelative(entry.created_at)}
              </span>
              {entry.tags && entry.tags.length > 0 && (
                <span className="dump-card__tags">
                  {entry.tags.join(' · ')}
                </span>
              )}
            </header>
            <div
              className="dump-card__body"
              dangerouslySetInnerHTML={{ __html: entry.content.dump }}
            />
          </article>
        ))}
      </div>
    </>
  )
}
