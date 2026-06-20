import type { ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import {
  PRESET_VIEWS,
  viewMatches,
  type RequestFilters,
  type SavedView,
} from './filters'

type Props = {
  value: RequestFilters
  onApply: (next: RequestFilters) => void
  views?: SavedView[]
  onCreate?: () => void
  onRemove?: (id: string) => void
  trailing?: ReactNode
}

export function SavedViewsRow({
  value,
  onApply,
  views = PRESET_VIEWS,
  onCreate,
  onRemove,
  trailing,
}: Props) {
  return (
    <div className="views-row" role="toolbar" aria-label="Saved views">
      <span className="views-row__label">Views</span>
      {views.map((view) => {
        const active = viewMatches(view, value)
        const removable = !view.builtIn && onRemove
        return (
          <span
            key={view.id}
            className={'view-pill-wrap' + (removable ? ' has-remove' : '')}
          >
            <button
              type="button"
              className={'view-pill' + (active ? ' is-active' : '')}
              aria-pressed={active}
              onClick={() => onApply(view.filters)}
            >
              {view.label}
            </button>
            {removable && (
              <button
                type="button"
                className="view-pill__remove"
                aria-label={`Delete saved view "${view.label}"`}
                title="Delete saved view"
                onClick={() => onRemove(view.id)}
              >
                <X size={10} />
              </button>
            )}
          </span>
        )
      })}
      {onCreate && (
        <button
          type="button"
          className="view-pill view-pill--new"
          onClick={onCreate}
        >
          <Plus size={11} />
          New view
        </button>
      )}
      {trailing && <div className="views-row__trailing">{trailing}</div>}
    </div>
  )
}
