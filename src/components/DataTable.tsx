'use client'

import { useState } from 'react'
import { usePagination } from '@/hooks/usePagination'
import { useFilterPresets } from '@/hooks/useFilterPresets'
import { Pagination } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { FilterableHeader } from '@/components/ui/filterable-header'
import { FilterConfig } from '@/hooks/usePagination'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MobileFilterDrawer } from '@/components/ui/mobile-filter-drawer'
import { FilterPresets } from '@/components/ui/filter-presets'

interface DataItem {
  id: string
  [key: string]: any // Allow for dynamic fields
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface Column {
  key: string
  label: string
  filterType?: "text" | "select" | "multi-select" | "date" | "boolean"
  filterOptions?: { value: string; label: string }[]
}

interface DataTableProps {
  endpoint: string
  columns: Column[]
  data?: DataItem[]
  onFilterChange?: (filters: FilterConfig[]) => void
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
]

const availableFilters: FilterConfig[] = [
  {
    key: 'name',
    value: null,
    operator: 'contains',
    type: 'text'
  },
  {
    key: 'email',
    value: null,
    operator: 'contains',
    type: 'text'
  },
  {
    key: 'status',
    value: null,
    operator: 'in',
    type: 'multi-select'
  },
  {
    key: 'createdAt',
    value: null,
    operator: 'between',
    type: 'date'
  }
]

export function DataTable({
  endpoint,
  columns,
  data: initialData,
  onFilterChange
}: DataTableProps) {
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  })
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const isMobile = useMediaQuery('(max-width: 640px)')

  const {
    items: data,
    isLoading,
    error: apiError,
    currentPage,
    totalPages,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange: applyFilters,
    retry,
  } = usePagination<DataItem>({
    initialPage: 1,
    initialPageSize: 10,
    storageKey: "data-table",
    fetchData: async (page, pageSize, searchQuery, currentFilters) => {
      try {
        const response = await fetch(
          `${endpoint}?page=${page}&pageSize=${pageSize}&sortBy=${sortConfig.key}&sortDirection=${sortConfig.direction}&filters=${JSON.stringify(
            currentFilters
          )}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }
        return await response.json()
      } catch (err) {
        throw err
      }
    },
  })

  const {
    presets,
    savePreset,
    deletePreset,
    applyPreset
  } = useFilterPresets({
    storageKey: 'data-table-presets',
    onPresetApply: (presetFilters) => {
      setFilters(presetFilters)
    }
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilter: FilterConfig = {
      key,
      value,
      type: columns.find((col) => col.key === key)?.filterType || "text",
      operator: "contains", // Default operator for text search
    }
    setFilters((prev) => {
      const existingFilterIndex = prev.findIndex((f) => f.key === key)
      const newFilters =
        existingFilterIndex >= 0
          ? [...prev.slice(0, existingFilterIndex), newFilter, ...prev.slice(existingFilterIndex + 1)]
          : [...prev, newFilter]
      applyFilters(newFilters)
      onFilterChange?.(newFilters)
      return newFilters
    })
    handlePageChange(1) // Reset to first page when filters change
  }

  if (apiError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load data.{" "}
          <Button variant="link" onClick={retry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FilterPresets
          presets={presets}
          currentFilters={filters}
          onSavePreset={savePreset}
          onApplyPreset={applyPreset}
          onDeletePreset={deletePreset}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <FilterableHeader
                    title={column.label}
                    filterType={column.filterType}
                    filterOptions={column.filterOptions}
                    currentFilter={filters.find((f) => f.key === column.key)}
                    onFilterChange={(filter) => {
                      if (filter) {
                        handleFilterChange(column.key, filter.value)
                      } else {
                        handleFilterChange(column.key, null)
                      }
                    }}
                    currentSort={sortConfig.key === column.key ? sortConfig.direction : undefined}
                    onSortChange={(direction) => {
                      if (direction) {
                        setSortConfig({ key: column.key, direction: direction as "asc" | "desc" })
                      }
                    }}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
            aria-label="Items per page"
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
      {isMobile && (
        <MobileFilterDrawer
          filters={availableFilters}
          onFilterChange={handleFilterChange}
          statusOptions={statusOptions}
          activeFilters={filters}
        />
      )}
    </div>
  )
} 