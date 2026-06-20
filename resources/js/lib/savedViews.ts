import { useCallback, useEffect, useState } from 'react'

export type SavedView<F> = {
  id: string
  label: string
  filters: F
  builtIn?: boolean
}

export function useSavedViews<F>(
  storageKey: string,
  presets: SavedView<F>[],
): {
  views: SavedView<F>[]
  createView: (filters: F, label: string) => string
  removeView: (id: string) => void
} {
  const [userViews, setUserViews] = useState<SavedView<F>[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as SavedView<F>[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(userViews))
    } catch {
      // ignore storage failures (private mode etc)
    }
  }, [storageKey, userViews])

  const createView = useCallback((filters: F, label: string) => {
    const id = `user-${Math.random().toString(36).slice(2, 10)}`
    setUserViews((prev) => [...prev, { id, label, filters }])
    return id
  }, [])

  const removeView = useCallback((id: string) => {
    setUserViews((prev) => prev.filter((v) => v.id !== id))
  }, [])

  return {
    views: [...presets, ...userViews],
    createView,
    removeView,
  }
}
