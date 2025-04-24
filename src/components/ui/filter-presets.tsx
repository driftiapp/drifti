import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FilterPreset } from '@/hooks/useFilterPresets'
import { FilterConfig } from '@/hooks/usePagination'
import { BookmarkPlus, Bookmark, X, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterPresetsProps {
  presets: FilterPreset[]
  currentFilters: FilterConfig[]
  onSavePreset: (name: string, filters: FilterConfig[]) => void
  onApplyPreset: (id: string) => void
  onDeletePreset: (id: string) => void
  className?: string
}

export function FilterPresets({
  presets,
  currentFilters,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  className
}: FilterPresetsProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [newPresetName, setNewPresetName] = React.useState('')
  const [showSaveForm, setShowSaveForm] = React.useState(false)

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim(), currentFilters)
      setNewPresetName('')
      setShowSaveForm(false)
    }
  }

  const formatFilterSummary = (filters: FilterConfig[]) => {
    return filters.map(filter => {
      const value = Array.isArray(filter.value) 
        ? filter.value.join(', ')
        : filter.value?.toString() || ''
      return `${filter.key}: ${value}`
    }).join(' • ')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2",
            className
          )}
        >
          <Bookmark className="h-4 w-4" />
          <span>Filter Presets</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 space-y-2">
          {showSaveForm ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowSaveForm(false)
                    setNewPresetName('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="default"
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground px-2">
                Current filters: {formatFilterSummary(currentFilters)}
              </p>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowSaveForm(true)}
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>Save Current Filters</span>
            </Button>
          )}
        </div>
        {presets.length > 0 && (
          <div className="border-t">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-start gap-2 p-2 hover:bg-muted/50"
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-auto py-2"
                  onClick={() => onApplyPreset(preset.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFilterSummary(preset.filters)}
                    </div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeletePreset(preset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
} 