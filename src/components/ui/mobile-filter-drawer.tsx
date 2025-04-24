import * as React from 'react'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FilterConfig } from '@/hooks/usePagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import { Checkbox } from '@/components/ui/checkbox'

interface MobileFilterDrawerProps {
  filters: FilterConfig[]
  onFilterChange: (filter: FilterConfig | null) => void
  statusOptions: { value: string; label: string }[]
  activeFilters: FilterConfig[]
}

export function MobileFilterDrawer({ 
  filters, 
  onFilterChange, 
  statusOptions,
  activeFilters 
}: MobileFilterDrawerProps) {
  const [open, setOpen] = React.useState(false)

  const handleFilterChange = (key: string, value: any, type: FilterConfig['type']) => {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      onFilterChange({
        key,
        value: null,
        operator: 'equals',
        type
      })
      return
    }

    let operator: FilterConfig['operator'] = 'equals'
    if (type === 'text') operator = 'contains'
    if (type === 'multi-select') operator = 'in'
    if (type === 'range') operator = 'between'

    onFilterChange({
      key,
      value,
      operator,
      type
    })
  }

  const renderFilterInput = (filter: FilterConfig) => {
    const currentValue = activeFilters.find(f => f.key === filter.key)?.value

    switch (filter.type) {
      case 'text':
        return (
          <Input
            value={currentValue?.toString() || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value, 'text')}
            placeholder={`Filter by ${filter.key}...`}
            className="w-full"
          />
        )
      
      case 'select':
      case 'multi-select':
        return (
          <Select
            value={currentValue?.toString() || ''}
            onValueChange={(value) => handleFilterChange(filter.key, value, filter.type)}
            multiple={filter.type === 'multi-select'}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${filter.key}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Clear filter</SelectItem>
              {filter.key === 'status' && statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Calendar
            mode="range"
            selected={currentValue as DateRange | undefined}
            onSelect={(range: DateRange | undefined) => handleFilterChange(filter.key, range, 'date')}
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={currentValue as boolean || false}
              onCheckedChange={(checked) => handleFilterChange(filter.key, checked, 'boolean')}
            />
            <label className="text-sm">Yes</label>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        >
          <Filter className="h-4 w-4" />
          {activeFilters.length > 0 && (
            <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <label className="text-sm font-medium capitalize">
                {filter.key}
              </label>
              {renderFilterInput(filter)}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
} 