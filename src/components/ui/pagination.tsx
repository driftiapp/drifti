import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps, Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaginationProps extends React.ComponentProps<"nav"> {
  showFirstLast?: boolean
  pageSize?: number
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showGoToPage?: boolean
  maxPageButtons?: number
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ 
    className, 
    showFirstLast = false,
    pageSize = 10,
    totalItems = 0,
    currentPage = 1,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    showPageSizeSelector = true,
    showGoToPage = true,
    maxPageButtons = 5,
    ...props 
  }, ref) => {
    const totalPages = Math.ceil(totalItems / pageSize)
    const [goToPage, setGoToPage] = React.useState("")
    
    // Calculate the range of page numbers to display
    const getPageRange = () => {
      const halfRange = Math.floor(maxPageButtons / 2)
      let start = Math.max(1, currentPage - halfRange)
      const end = Math.min(totalPages, start + maxPageButtons - 1)
      
      if (end - start + 1 < maxPageButtons) {
        start = Math.max(1, end - maxPageButtons + 1)
      }
      
      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }

    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange?.(page)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent, page: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handlePageChange(page)
      }
    }

    const handleGoToPage = (e: React.FormEvent) => {
      e.preventDefault()
      const page = parseInt(goToPage)
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        handlePageChange(page)
        setGoToPage("")
      }
    }

    const pageRange = getPageRange()

    return (
      <div className="flex flex-col items-center gap-4">
        <nav
          ref={ref}
          role="navigation"
          aria-label="pagination"
          className={cn("mx-auto flex w-full justify-center", className)}
          {...props}
        >
          <ul className="flex flex-row items-center gap-1">
            {showFirstLast && (
              <li>
                <PaginationLink
                  aria-label="Go to first page"
                  onClick={() => handlePageChange(1)}
                  onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, 1)}
                  disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : 0}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">First page</span>
                </PaginationLink>
              </li>
            )}
            <li>
              <PaginationLink
                aria-label="Go to previous page"
                onClick={() => handlePageChange(currentPage - 1)}
                onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, currentPage - 1)}
                disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : 0}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </PaginationLink>
            </li>

            {/* Page numbers */}
            {pageRange[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(1)}
                    onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, 1)}
                    aria-label="Go to page 1"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {pageRange[0] > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis aria-label="More pages before" />
                  </PaginationItem>
                )}
              </>
            )}

            {pageRange.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => handlePageChange(page)}
                  onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {pageRange[pageRange.length - 1] < totalPages && (
              <>
                {pageRange[pageRange.length - 1] < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis aria-label="More pages after" />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(totalPages)}
                    onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, totalPages)}
                    aria-label={`Go to page ${totalPages}`}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <li>
              <PaginationLink
                aria-label="Go to next page"
                onClick={() => handlePageChange(currentPage + 1)}
                onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, currentPage + 1)}
                disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : 0}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </PaginationLink>
            </li>
            {showFirstLast && (
              <li>
                <PaginationLink
                  aria-label="Go to last page"
                  onClick={() => handlePageChange(totalPages)}
                  onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, totalPages)}
                  disabled={currentPage === totalPages}
                  tabIndex={currentPage === totalPages ? -1 : 0}
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Last page</span>
                </PaginationLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-muted-foreground">
                Items per page:
              </label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value: string) => onPageSizeChange?.(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showGoToPage && (
            <form onSubmit={handleGoToPage} className="flex items-center gap-2">
              <label htmlFor="goToPage" className="text-sm text-muted-foreground">
                Go to page:
              </label>
              <Input
                id="goToPage"
                type="number"
                min={1}
                max={totalPages}
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                className="w-[100px]"
                aria-label="Page number"
              />
              <Button type="submit" size="sm">
                Go
              </Button>
            </form>
          )}
        </div>
      </div>
    )
  }
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Omit<ButtonProps, "type"> & {
  type?: "button" | "submit" | "reset"
}

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  type = "button",
  ...props
}: PaginationLinkProps) => (
  <Button
    type={type}
    aria-current={isActive ? "page" : undefined}
    variant={isActive ? "outline" : "ghost"}
    size={size}
    className={cn(
      "w-9 h-9",
      {
        "pointer-events-none": isActive,
        "hover:bg-transparent hover:text-primary": !isActive,
      },
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} 