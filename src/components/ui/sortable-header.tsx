import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

interface SortableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string
  currentSort?: {
    key: string
    direction: 'asc' | 'desc'
  }
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void
}

const SortableHeader = React.forwardRef<HTMLTableCellElement, SortableHeaderProps>(
  ({ className, children, sortKey, currentSort, onSortChange, ...props }, ref) => {
    const isSorted = currentSort?.key === sortKey
    const direction = isSorted ? currentSort.direction : undefined

    const handleClick = () => {
      if (!onSortChange) return
      
      const newDirection = direction === 'asc' ? 'desc' : 'asc'
      onSortChange(sortKey, newDirection)
    }

    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
          onSortChange && 'cursor-pointer hover:bg-muted/50',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {onSortChange && (
            <span className="flex-shrink-0">
              {!isSorted && <ChevronsUpDown className="h-4 w-4" />}
              {isSorted && direction === 'asc' && <ChevronUp className="h-4 w-4" />}
              {isSorted && direction === 'desc' && <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      </th>
    )
  }
)
SortableHeader.displayName = 'SortableHeader'

export { SortableHeader } 