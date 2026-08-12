import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
  page: number
  pageCount: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

function visiblePages(page: number, pageCount: number) {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const start = Math.max(1, Math.min(page - 2, pageCount - 4))
  return Array.from({ length: 5 }, (_, index) => start + index)
}

export function Pagination({ page, pageCount, pageSize, totalItems, onPageChange, itemLabel = 'items' }: PaginationProps) {
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-0 pt-3" aria-label={`Pagination for ${itemLabel}`}>
      <p className="m-0 text-[0.75rem] text-muted-foreground">
        Showing <strong className="font-[650] text-foreground">{start}–{end}</strong> of {totalItems} {itemLabel}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
            <ChevronLeft aria-hidden="true" />
          </Button>
          {visiblePages(page, pageCount).map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? 'secondary' : 'ghost'}
              size="icon-sm"
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button variant="ghost" size="icon-sm" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page">
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </nav>
  )
}
