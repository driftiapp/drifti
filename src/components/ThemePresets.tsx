'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'

interface ThemePreset {
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    border: string
  }
}

interface ThemePresetsProps {
  onSelect: (theme: ThemePreset) => void
}

export function ThemePresets({ onSelect }: ThemePresetsProps) {
  const [presets, setPresets] = useState<ThemePreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('/api/themes/presets')
        if (!response.ok) throw new Error('Failed to fetch presets')
        const data = await response.json()
        setPresets(data)
      } catch (error) {
        console.error('Error fetching presets:', error)
        toast({
          title: 'Error',
          description: 'Failed to load theme presets',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPresets()
  }, [toast])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg bg-[var(--background)] border border-[var(--border)] animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Theme Presets</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <motion.button
            key={preset.name}
            onClick={() => onSelect(preset)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-left"
            aria-label={`Select ${preset.name} theme`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: preset.colors.primary }}
              />
              <div>
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm opacity-70">{preset.description}</div>
              </div>
            </div>
            <div className="flex gap-1">
              {Object.entries(preset.colors).map(([key, value]) => (
                <div
                  key={key}
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: value }}
                  title={`${key}: ${value}`}
                />
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
} 