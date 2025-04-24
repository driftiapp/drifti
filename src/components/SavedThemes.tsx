'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/store/useTheme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface SavedTheme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    border: string
  }
  isPublic: boolean
}

export function SavedThemes() {
  const [themes, setThemes] = useState<SavedTheme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('/api/themes')
        if (!response.ok) throw new Error('Failed to fetch themes')
        const data = await response.json()
        setThemes(data)
      } catch (error) {
        console.error('Error fetching themes:', error)
        toast({
          title: 'Error',
          description: 'Failed to load saved themes',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchThemes()
  }, [toast])

  const applyTheme = (theme: SavedTheme) => {
    setTheme('custom')
    document.documentElement.style.setProperty('--primary', theme.colors.primary)
    document.documentElement.style.setProperty('--secondary', theme.colors.secondary)
    document.documentElement.style.setProperty('--background', theme.colors.background)
    document.documentElement.style.setProperty('--text', theme.colors.text)
    document.documentElement.style.setProperty('--border', theme.colors.border)
    
    toast({
      title: 'Theme Applied',
      description: `${theme.name} theme has been applied successfully`,
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-[var(--background)] rounded w-3/4" />
              <div className="h-3 bg-[var(--background)] rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="w-6 h-6 rounded bg-[var(--background)]"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Saved Themes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <CardHeader>
              <CardTitle>{theme.name}</CardTitle>
              <CardDescription>{theme.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 mb-4">
                {Object.entries(theme.colors).map(([key, value]) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: value }}
                    title={`${key}: ${value}`}
                  />
                ))}
              </div>
              <Button
                onClick={() => applyTheme(theme)}
                className="w-full"
              >
                Apply Theme
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 