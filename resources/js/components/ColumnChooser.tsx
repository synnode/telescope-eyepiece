import { useEffect, useRef, useState } from 'react'
import { Check, Columns3 } from 'lucide-react'
import type { ColumnDef } from '../lib/columnVisibility'

type Props = {
  columns: ColumnDef[]
  visibleKeys: Set<string>
  onToggle: (key: string) => void
  onReset: () => void
}

export function ColumnChooser({ columns, visibleKeys, onToggle, onReset }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const hiddenCount = columns.filter((c) => !visibleKeys.has(c.key)).length

  return (
    <div className="column-chooser" ref={rootRef}>
      <button
        type="button"
        className={'view-pill' + (open || hiddenCount > 0 ? ' is-active' : '')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <Columns3 size={11} />
        Columns
        {hiddenCount > 0 && <span className="column-chooser__count">{hiddenCount}</span>}
      </button>
      {open && (
        <div className="column-chooser__popover" role="menu">
          <div className="column-chooser__head">Visible columns</div>
          {columns.map((col) => {
            const visible = visibleKeys.has(col.key)
            return (
              <label
                key={col.key}
                className={
                  'column-chooser__row' + (col.mandatory ? ' is-mandatory' : '')
                }
              >
                <span
                  className={
                    'column-chooser__check' + (visible ? ' is-checked' : '')
                  }
                  aria-hidden="true"
                >
                  {visible && <Check size={11} />}
                </span>
                <span className="column-chooser__label">{col.label}</span>
                {col.mandatory && (
                  <span className="column-chooser__hint">required</span>
                )}
                <input
                  type="checkbox"
                  className="column-chooser__native"
                  checked={visible}
                  disabled={col.mandatory}
                  onChange={() => onToggle(col.key)}
                />
              </label>
            )
          })}
          <div className="column-chooser__foot">
            <button
              type="button"
              className="btn-secondary"
              onClick={onReset}
              disabled={hiddenCount === 0}
            >
              Show all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
