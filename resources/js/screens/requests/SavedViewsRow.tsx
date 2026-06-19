import { Plus } from 'lucide-react'
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
}

export function SavedViewsRow({
  value,
  onApply,
  views = PRESET_VIEWS,
  onCreate,
}: Props) {
  return (
    <div className="views-row" role="toolbar" aria-label="Saved views">
      <span className="views-row__label">Views</span>
      {views.map((view) => {
        const active = viewMatches(view, value)
        return (
          <button
            key={view.id}
            type="button"
            className={'view-pill' + (active ? ' is-active' : '')}
            aria-pressed={active}
            onClick={() => onApply(view.filters)}
          >
            {view.label}
          </button>
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
    </div>
  )
}
