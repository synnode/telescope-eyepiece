import { Search, X } from 'lucide-react'
import {
  DURATION_PRESETS,
  EMPTY_FILTERS,
  STATUS_CLASSES,
  VERBS,
  hasActiveFilters,
  type HttpVerb,
  type RequestFilters,
  type StatusClass,
} from './filters'

type Props = {
  value: RequestFilters
  onChange: (next: RequestFilters) => void
  statusCounts: Record<StatusClass, number>
}

export function FilterForm({ value, onChange, statusCounts }: Props) {
  const toggleVerb = (v: HttpVerb) =>
    onChange({
      ...value,
      verbs: value.verbs.includes(v)
        ? value.verbs.filter((x) => x !== v)
        : [...value.verbs, v],
    })

  const toggleStatus = (s: StatusClass) =>
    onChange({
      ...value,
      statuses: value.statuses.includes(s)
        ? value.statuses.filter((x) => x !== s)
        : [...value.statuses, s],
    })

  return (
    <div className="filter-form">
      <label className="filter-search">
        <Search size={14} className="filter-search__icon" />
        <input
          type="search"
          placeholder="Filter by path, route, tag…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </label>

      <div className="filter-divider" />

      <div className="chip-group" role="group" aria-label="HTTP verb">
        {VERBS.map((verb) => {
          const active = value.verbs.includes(verb)
          return (
            <button
              key={verb}
              type="button"
              className={`chip chip-verb chip-verb--${verb.toLowerCase()}${
                active ? ' is-active' : ''
              }`}
              aria-pressed={active}
              onClick={() => toggleVerb(verb)}
            >
              {verb}
            </button>
          )
        })}
      </div>

      <div className="filter-divider" />

      <div className="chip-group" role="group" aria-label="Status class">
        {STATUS_CLASSES.map((cls) => {
          const active = value.statuses.includes(cls)
          return (
            <button
              key={cls}
              type="button"
              className={`chip chip-status chip-status--${cls}${
                active ? ' is-active' : ''
              }`}
              aria-pressed={active}
              onClick={() => toggleStatus(cls)}
            >
              <span className={`status-dot status-dot--${cls}`} />
              {cls}
              <span className="chip__count">{statusCounts[cls] ?? 0}</span>
            </button>
          )
        })}
      </div>

      <div className="filter-divider" />

      <div className="chip-group" role="group" aria-label="Duration">
        {DURATION_PRESETS.map(({ label, value: v }) => {
          const active = value.minDuration === v
          return (
            <button
              key={label}
              type="button"
              className={`chip chip-duration${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onChange({ ...value, minDuration: v })}
            >
              {label}
            </button>
          )
        })}
      </div>

      {hasActiveFilters(value) && (
        <button
          type="button"
          className="filter-clear"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  )
}
