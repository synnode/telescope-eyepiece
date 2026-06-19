import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EntryListParams, EntryListResponse, EntryRow, EntryStatus } from './api'

type Options<T> = {
  queryKey: readonly unknown[]
  fetcher: (params: EntryListParams) => Promise<EntryListResponse<T>>
  take?: number
  isPolling: boolean
}

type Result<T> = {
  rows: EntryRow<T>[]
  isLoading: boolean
  isError: boolean
  error: unknown
  status: EntryStatus | undefined
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  resetPaging: () => void
}

export function useEntryList<T>({
  queryKey,
  fetcher,
  take = 50,
  isPolling,
}: Options<T>): Result<T> {
  const [olderPages, setOlderPages] = useState<EntryRow<T>[][]>([])
  const [olderExhausted, setOlderExhausted] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const pageOne = useQuery({
    queryKey: [...queryKey, 'page-1', take],
    queryFn: () => fetcher({ take }),
    refetchInterval: isPolling ? 2000 : false,
  })

  const firstEntries = useMemo(
    () => pageOne.data?.entries ?? [],
    [pageOne.data],
  )

  const rows = useMemo(
    () => [...firstEntries, ...olderPages.flat()],
    [firstEntries, olderPages],
  )

  const lastBatchSize =
    olderPages.length > 0
      ? (olderPages[olderPages.length - 1]?.length ?? 0)
      : firstEntries.length

  const hasMore = !olderExhausted && lastBatchSize >= take

  const loadMore = useCallback(async () => {
    const lastSeen = rows[rows.length - 1]
    if (!lastSeen || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const res = await fetcher({ take, before: lastSeen.sequence })
      if (res.entries.length === 0) {
        setOlderExhausted(true)
      } else {
        setOlderPages((prev) => [...prev, res.entries])
        if (res.entries.length < take) setOlderExhausted(true)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [fetcher, isLoadingMore, rows, take])

  const resetPaging = useCallback(() => {
    setOlderPages([])
    setOlderExhausted(false)
  }, [])

  return {
    rows,
    isLoading: pageOne.isLoading,
    isError: pageOne.isError,
    error: pageOne.error,
    status: pageOne.data?.status,
    hasMore,
    isLoadingMore,
    loadMore,
    resetPaging,
  }
}
