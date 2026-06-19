import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { api } from '../lib/api'

export function MonitoredTagsScreen() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const tagsQuery = useQuery({
    queryKey: ['monitored-tags'],
    queryFn: api.monitoredTags.list,
  })

  const addMutation = useMutation({
    mutationFn: (tag: string) => api.monitoredTags.add(tag),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['monitored-tags'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (tag: string) => api.monitoredTags.remove(tag),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['monitored-tags'] }),
  })

  const tags = tagsQuery.data?.tags ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || addMutation.isPending) return
    addMutation.mutate(trimmed)
  }

  return (
    <>
      <div className="screen-title-row">
        <div>
          <h1 className="screen-title">Monitored Tags</h1>
          <div className="screen-subtitle">
            Telescope keeps tagged entries indefinitely; others honor the
            normal pruning window.
          </div>
        </div>
      </div>

      <div className="tags-area">
        <form className="tags-form" onSubmit={handleSubmit}>
          <label className="filter-search">
            <Tag size={14} className="filter-search__icon" />
            <input
              type="text"
              placeholder="Tag to monitor — e.g. Auth:1 or user:42"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn-resolve"
            disabled={!draft.trim() || addMutation.isPending}
          >
            <Plus size={13} />
            {addMutation.isPending ? 'Adding…' : 'Monitor'}
          </button>
        </form>

        {addMutation.isError && (
          <div className="state state--error">
            {(addMutation.error as Error).message}
          </div>
        )}

        <div className="tags-list">
          {tagsQuery.isLoading && <div className="state">Loading…</div>}
          {tagsQuery.isError && (
            <div className="state state--error">
              {(tagsQuery.error as Error).message}
            </div>
          )}
          {tagsQuery.data && tags.length === 0 && (
            <div className="state">No tags being monitored yet.</div>
          )}
          {tags.map((tag) => (
            <div key={tag} className="tag-row">
              <Tag size={13} className="tag-row__icon" />
              <span className="tag-row__label">{tag}</span>
              <button
                type="button"
                className="tag-row__remove"
                aria-label={`Stop monitoring ${tag}`}
                onClick={() => removeMutation.mutate(tag)}
                disabled={removeMutation.isPending}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
