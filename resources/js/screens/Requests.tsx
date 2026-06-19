import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function RequestsScreen() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['requests'],
    queryFn: () => api.requests.list({ take: 50 }),
  })

  if (isLoading) return <div className="state">Loading…</div>
  if (isError) return <div className="state error">{(error as Error).message}</div>
  if (!data) return null

  return (
    <section>
      <header className="screen-header">
        <h1>Requests</h1>
        <span className={'status status-' + data.status}>{data.status}</span>
      </header>

      <table className="entries">
        <thead>
          <tr>
            <th>Verb</th>
            <th>Path</th>
            <th>Status</th>
            <th>Duration</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((entry) => (
            <tr key={entry.id}>
              <td><span className={'verb verb-' + entry.content.method.toLowerCase()}>{entry.content.method}</span></td>
              <td className="path">{entry.content.uri}</td>
              <td>{entry.content.response_status}</td>
              <td>{entry.content.duration ?? '—'} ms</td>
              <td>{entry.created_at}</td>
            </tr>
          ))}
          {data.entries.length === 0 && (
            <tr><td colSpan={5} className="state">No requests recorded yet.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
