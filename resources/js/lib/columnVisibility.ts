import { useCallback, useEffect, useMemo, useState } from 'react'

export type ColumnDef = {
  key: string
  label: string
  width: string
  mandatory?: boolean
}

export function useColumnVisibility<T extends ColumnDef>(
  storageKey: string,
  columns: T[],
): {
  visibleKeys: Set<string>
  visibleColumns: T[]
  toggle: (key: string) => void
  reset: () => void
  gridTemplate: (trailing?: string) => string
} {
  const allKeys = useMemo(() => columns.map((c) => c.key), [columns])

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return new Set()
      const arr = JSON.parse(raw) as string[]
      return new Set(arr)
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...hiddenKeys]))
    } catch {
      // ignore storage failures
    }
  }, [storageKey, hiddenKeys])

  const toggle = useCallback(
    (key: string) => {
      const col = columns.find((c) => c.key === key)
      if (!col || col.mandatory) return
      setHiddenKeys((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    [columns],
  )

  const reset = useCallback(() => setHiddenKeys(new Set()), [])

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenKeys.has(c.key)),
    [columns, hiddenKeys],
  )

  const visibleKeys = useMemo(
    () => new Set(visibleColumns.map((c) => c.key)),
    [visibleColumns],
  )

  const gridTemplate = useCallback(
    (trailing?: string) => {
      const widths = visibleColumns.map((c) => c.width)
      if (trailing) widths.push(trailing)
      return widths.join(' ')
    },
    [visibleColumns],
  )

  // Suppress unused — public surface contract
  void allKeys

  return { visibleKeys, visibleColumns, toggle, reset, gridTemplate }
}
