
import { ErrorState } from './ErrorState'
import { SkeletonRows } from './Skeleton'
import type { ReactNode } from 'react'

/**
 * Card that scrolls a wide table horizontally inside itself, so dense admin
 * tables never make the whole page scroll sideways on phones.
 */
export function TableScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-sand-86 bg-surface ${className}`}>
      <div className="relative max-w-full overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Scrollable table">
        {children}
      </div>
    </div>
  )
}

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
}

/**
 * Simple data table with loading, error and empty states built in.
 * Columns can also be plain strings for a header-only placeholder table.
 */
export function DataTable<T>({
  columns,
  rows = [],
  rowKey,
  empty,
  loading = false,
  error,
  onRetry,
  minWidth = 'min-w-[640px]',
  onRowClick,
}: {
  columns: Array<Column<T> | string>
  rows?: Array<T>
  rowKey?: (row: T) => string | number
  empty: ReactNode
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  minWidth?: string
  onRowClick?: (row: T) => void
}) {
  const cols = columns.map((column, index) =>
    typeof column === 'string' ? { key: `${index}-${column}`, header: column, cell: () => null } : column,
  )
  return (
    <TableScroll>
      <table className={`w-full ${minWidth} text-left text-sm`}>
        <thead className="bg-ash-24 text-[11px] tracking-[0.14em] text-ash-459 uppercase">
          <tr>
            {cols.map((column) => (
              <th key={column.key} scope="col" className={`px-5 py-3 font-medium ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows columns={cols.length} />
          ) : error ? (
            <tr>
              <td colSpan={cols.length} className="px-5 py-6">
                <ErrorState compact error={error} onRetry={onRetry} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="px-5 py-16 text-center text-ash-573">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row) : index}
                className={`border-t border-sand-71 ${onRowClick ? 'cursor-pointer hover:bg-ash-40' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {cols.map((column) => (
                  <td key={column.key} className={`px-5 py-3.5 ${column.className ?? ''}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableScroll>
  )
}
