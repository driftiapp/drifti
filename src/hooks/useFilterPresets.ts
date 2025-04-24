import { useState, useEffect } from 'react'
import { FilterConfig } from './usePagination'

export interface FilterPreset {
  id: string
  name: string
  filters: FilterConfig[]
  createdAt: string
  lastUsed?: string
}

interface UseFilterPresetsOptions {
  storageKey: string
  onPresetApply?: (filters: FilterConfig[]) => void
  maxPresets?: number
}

export function useFilterPresets({
  storageKey,
  onPresetApply,
  maxPresets = 10
}: UseFilterPresetsOptions) {
  const [presets, setPresets] = useState<FilterPreset[]>([])

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem(`filter-presets-${storageKey}`)
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets))
      } catch (error) {
        console.error('Failed to parse saved filter presets:', error)
      }
    }
  }, [storageKey])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`filter-presets-${storageKey}`, JSON.stringify(presets))
  }, [presets, storageKey])

  const savePreset = (name: string, filters: FilterConfig[]) => {
    if (presets.length >= maxPresets) {
      // Remove least recently used preset if at max capacity
      const sortedPresets = [...presets].sort((a, b) => {
        const aDate = a.lastUsed ? new Date(a.lastUsed) : new Date(a.createdAt)
        const bDate = b.lastUsed ? new Date(b.lastUsed) : new Date(b.createdAt)
        return aDate.getTime() - bDate.getTime()
      })
      sortedPresets.shift() // Remove oldest preset
      setPresets(sortedPresets)
    }

    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: new Date().toISOString()
    }

    setPresets(prev => [...prev, newPreset])
  }

  const updatePreset = (id: string, updates: Partial<FilterPreset>) => {
    setPresets(prev => 
      prev.map(preset => 
        preset.id === id ? { ...preset, ...updates } : preset
      )
    )
  }

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id))
  }

  const applyPreset = (id: string) => {
    const preset = presets.find(p => p.id === id)
    if (preset) {
      updatePreset(id, { lastUsed: new Date().toISOString() })
      onPresetApply?.(preset.filters)
    }
  }

  return {
    presets,
    savePreset,
    updatePreset,
    deletePreset,
    applyPreset
  }
} 