import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
  page: number
  pageCount: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  itemLabel?: string
  compact?: boolean
}

function visiblePages(page: number, pageCount: number, count: number) {
  if (pageCount <= count) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const start = Math.max(1, Math.min(page - Math.floor(count / 2), pageCount - count + 1))
  return Array.from({ length: count }, (_, index) => start + index)
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'items',
  compact = false,
}: PaginationProps) {
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-0 pt-3"
      aria-label={`Pagination for ${itemLabel}`}
    >
      <p className="m-0 text-[0.75rem] text-muted-foreground">
        Showing{' '}
        <strong className="font-[650] text-foreground">
          {start}–{end}
        </strong>{' '}
        of {totalItems} {itemLabel}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className={compact ? 'size-7' : undefined}
            disabled={page === 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={compact ? 'size-7' : undefined}
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          {visiblePages(page, pageCount, compact ? 3 : 5).map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? 'secondary' : 'ghost'}
              size="icon-sm"
              className={compact ? 'size-7' : undefined}
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon-sm"
            className={compact ? 'size-7' : undefined}
            disabled={page === pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={compact ? 'size-7' : undefined}
            disabled={page === pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      )}
    </nav>
  )
}
