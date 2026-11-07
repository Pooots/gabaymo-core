import { ErrorState } from './ErrorState'
import { LoadingState } from './Skeleton'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'


/**
 * Renders a react-query result: skeleton while loading, ErrorState with retry
 * on failure, `empty` when `isEmpty(data)`, else `children(data)`.
 */
export function QueryState<T>({
  query,
  children,
  loading,
  empty,
  isEmpty,
  errorTitle,
  compact = false,
}: {
  query: Pick<UseQueryResult<T>, 'data' | 'error' | 'isPending' | 'isError' | 'refetch' | 'isRefetching'>
  children: (data: T) => ReactNode
  loading?: ReactNode
  empty?: ReactNode
  isEmpty?: (data: T) => boolean
  errorTitle?: string
  compact?: boolean
}) {
  if (query.isPending) return <>{loading ?? <LoadingState />}</>
  if (query.isError) {
    return (
      <ErrorState
        compact={compact}
        title={errorTitle}
        error={query.error}
        retrying={query.isRefetching}
        onRetry={() => void query.refetch()}
      />
    )
  }
  const data = query.data as T
  if (empty !== undefined && isEmpty?.(data)) return <>{empty}</>
  return <>{children(data)}</>
}
