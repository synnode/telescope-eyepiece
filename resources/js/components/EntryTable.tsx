import { ChevronRight } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

export type EntryColumn<T> = {
  key: string
  label?: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

type Props<T> = {
  columns: EntryColumn<T>[]
  rows: T[]
  gridTemplateColumns: string
  minWidth?: number | string
  getRowKey: (row: T) => string
  selectedKey?: string | null
  onRowClick?: (row: T) => void
  emptyMessage?: string
  isLoading?: boolean
  showChevron?: boolean
}

export function EntryTable<T>({
  columns,
  rows,
  gridTemplateColumns,
  minWidth = 1060,
  getRowKey,
  selectedKey,
  onRowClick,
  emptyMessage = 'No entries match these filters.',
  isLoading,
  showChevron = true,
}: Props<T>) {
  const gridStyle: CSSProperties = { gridTemplateColumns }

  return (
    <div className="entry-table-card">
      <div className="entry-table" style={{ minWidth }}>
        <div className="entry-table__head" style={gridStyle}>
          {columns.map((col) => (
            <div
              key={col.key}
              className={
                'entry-table__th' + (col.align === 'right' ? ' is-right' : '')
              }
            >
              {col.label}
            </div>
          ))}
          {showChevron && <div className="entry-table__th" aria-hidden="true" />}
        </div>

        <div className="entry-table__body">
          {isLoading && rows.length === 0 && (
            <div className="entry-table__state">Loading…</div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="entry-table__state">{emptyMessage}</div>
          )}
          {rows.map((row) => {
            const key = getRowKey(row)
            const selected = key === selectedKey
            return (
              <div
                key={key}
                className={'entry-row' + (selected ? ' is-selected' : '')}
                style={gridStyle}
                role="button"
                tabIndex={0}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick?.(row)
                  }
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={
                      'entry-row__cell' +
                      (col.align === 'right' ? ' is-right' : '')
                    }
                  >
                    {col.render(row)}
                  </div>
                ))}
                {showChevron && (
                  <div className="entry-row__cell entry-row__chevron">
                    <ChevronRight size={14} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
