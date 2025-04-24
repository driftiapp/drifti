import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, ChevronsUpDown, Filter, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FilterConfig } from '@/hooks/usePagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useState } from "react"

interface FilterableHeaderProps {
  title: string
  filterType?: "text" | "select" | "multi-select" | "date" | "boolean"
  filterOptions?: { value: string; label: string }[]
  currentFilter?: FilterConfig | null
  onFilterChange: (key: string, value: any) => void
  currentSort?: "asc" | "desc"
  onSortChange: (direction: "asc" | "desc") => void
}

export function FilterableHeader({
  title,
  filterType,
  filterOptions,
  currentFilter,
  onFilterChange,
  currentSort,
  onSortChange,
}: FilterableHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (value: any) => {
    if (value === null || value === "") {
      onFilterChange(title.toLowerCase(), null)
    } else {
      onFilterChange(title.toLowerCase(), value)
    }
  }

  const handleSortChange = () => {
    const newDirection = currentSort === "asc" ? "desc" : "asc"
    onSortChange(newDirection)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 lg:px-3"
        onClick={handleSortChange}
      >
        {title}
        {currentSort && (
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 transition-transform",
              currentSort === "desc" && "rotate-180"
            )}
          />
        )}
      </Button>

      {filterType && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                currentFilter && "bg-primary/10 text-primary"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter by {title}</h4>
                {currentFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange(null)}
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {filterType === "text" && (
                <input
                  type="text"
                  value={(currentFilter?.value as string) || ""}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={`Search ${title.toLowerCase()}...`}
                />
              )}

              {filterType === "select" && (
                <select
                  value={(currentFilter?.value as string) || ""}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-label={`Select ${title.toLowerCase()}`}
                >
                  <option value="">Select {title.toLowerCase()}</option>
                  {filterOptions?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {filterType === "multi-select" && (
                <div className="space-y-2">
                  {filterOptions?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={Array.isArray(currentFilter?.value)
                          ? currentFilter.value.includes(option.value)
                          : false}
                        onCheckedChange={(checked) => {
                          const currentValues = Array.isArray(currentFilter?.value)
                            ? currentFilter.value
                            : []
                          if (checked) {
                            handleFilterChange([...currentValues, option.value])
                          } else {
                            handleFilterChange(
                              currentValues.filter((v) => v !== option.value)
                            )
                          }
                        }}
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {filterType === "date" && (
                <Calendar
                  mode="range"
                  selected={currentFilter?.value as { from: Date; to: Date } | undefined}
                  onSelect={(range) => handleFilterChange(range)}
                  className="rounded-md border"
                />
              )}

              {filterType === "boolean" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="boolean-filter"
                    checked={!!currentFilter?.value}
                    onCheckedChange={(checked) => handleFilterChange(checked)}
                  />
                  <label
                    htmlFor="boolean-filter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {title}
                  </label>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
} 