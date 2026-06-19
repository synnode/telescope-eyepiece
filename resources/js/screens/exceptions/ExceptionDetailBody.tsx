import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { EntryShowResponse, ExceptionEntryContent } from '../../lib/api'
import { api } from '../../lib/api'
import { formatRelative } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<ExceptionEntryContent>
  onResolved: () => void
}

export function ExceptionDetailBody({ detail, onResolved }: Props) {
  const { entry } = detail
  const { content } = entry
  const [resolving, setResolving] = useState(false)
  const isResolved = Boolean(content.resolved_at)

  const handleResolve = async () => {
    setResolving(true)
    try {
      await api.exceptions.resolve(entry.id)
      onResolved()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="request-detail">
      <div className="exc-meta">
        <div className="exc-meta__class">{content.class}</div>
        <div className="exc-meta__when">{formatRelative(entry.created_at)}</div>
      </div>

      <div className={'exc-message' + (isResolved ? ' is-resolved' : '')}>
        <pre>{content.message}</pre>
      </div>

      <div className="exc-actions">
        {isResolved ? (
          <span className="exc-resolved-badge">
            <CheckCircle2 size={13} />
            Resolved {formatRelative(content.resolved_at!)}
          </span>
        ) : (
          <button
            type="button"
            className="btn-resolve"
            onClick={handleResolve}
            disabled={resolving}
          >
            <CheckCircle2 size={13} />
            {resolving ? 'Marking…' : 'Mark as resolved'}
          </button>
        )}
      </div>

      <LinePreview
        preview={content.line_preview}
        file={content.file}
        errorLine={content.line}
      />

      <TraceList trace={content.trace} />

      {content.context && Object.keys(content.context).length > 0 && (
        <ContextBlock context={content.context} />
      )}
    </div>
  )
}

function LinePreview({
  preview,
  file,
  errorLine,
}: {
  preview: Record<string, string>
  file: string
  errorLine: number
}) {
  const lines = useMemo(
    () =>
      Object.entries(preview)
        .map(([k, v]) => [Number(k), v] as const)
        .sort((a, b) => a[0] - b[0]),
    [preview],
  )

  if (lines.length === 0) return null

  return (
    <section className="detail-section">
      <div className="detail-section__label">
        Source
        <span className="detail-section__meta">{trimPath(file)}</span>
      </div>
      <div className="code-card">
        <div className="code-listing">
          {lines.map(([num, text]) => (
            <div
              key={num}
              className={
                'code-listing__row' + (num === errorLine ? ' is-error' : '')
              }
            >
              <span className="code-listing__num">{num}</span>
              <pre className="code-listing__line">{text || ' '}</pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TraceList({ trace }: { trace: Array<{ file?: string; line?: number }> }) {
  if (!trace || trace.length === 0) return null

  return (
    <section className="detail-section">
      <div className="detail-section__label">
        Stack trace
        <span className="detail-section__meta">{trace.length} frames</span>
      </div>
      <div className="trace-list">
        {trace.map((frame, i) => (
          <div key={i} className="trace-row">
            <span className="trace-row__idx">#{i}</span>
            <span className="trace-row__file">
              {frame.file ? trimPath(frame.file) : '<internal>'}
            </span>
            {frame.line !== undefined && (
              <span className="trace-row__line">:{frame.line}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function ContextBlock({ context }: { context: Record<string, unknown> }) {
  return (
    <section className="detail-section">
      <div className="detail-section__label">Log context</div>
      <div className="kv-list">
        {Object.entries(context).map(([k, v]) => (
          <div key={k} className="kv-row">
            <div className="kv-row__key">{k}</div>
            <div className="kv-row__value">
              {typeof v === 'string' ? v : JSON.stringify(v)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function trimPath(file: string): string {
  const idx = file.indexOf('/app/')
  if (idx !== -1) return file.slice(idx + 1)
  const parts = file.split('/')
  return parts.slice(-3).join('/')
}
