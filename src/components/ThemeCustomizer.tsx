'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/store/useTheme'
import { ThemePresets } from './ThemePresets'
import { SavedThemes } from './SavedThemes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface CustomColors {
  primary: string
  secondary: string
  background: string
  text: string
  border: string
}

interface ThemePreset {
  name: string
  description: string
  colors: CustomColors
}

export function ThemeCustomizer() {
  const { setTheme } = useTheme()
  const [customColors, setCustomColors] = useState<CustomColors>({
    primary: '#000000',
    secondary: '#000000',
    background: '#ffffff',
    text: '#000000',
    border: '#e5e7eb',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [themeName, setThemeName] = useState('')
  const [themeDescription, setThemeDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Apply colors in real-time
    document.documentElement.style.setProperty('--primary', customColors.primary)
    document.documentElement.style.setProperty('--secondary', customColors.secondary)
    document.documentElement.style.setProperty('--background', customColors.background)
    document.documentElement.style.setProperty('--text', customColors.text)
    document.documentElement.style.setProperty('--border', customColors.border)
  }, [customColors])

  const handleColorChange = (key: keyof CustomColors, value: string) => {
    setCustomColors((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const applyCustomTheme = () => {
    setTheme('custom')
    toast({
      title: 'Theme Applied',
      description: 'Your custom theme has been applied successfully',
    })
  }

  const handlePresetSelect = (preset: ThemePreset) => {
    setCustomColors(preset.colors)
    applyCustomTheme()
  }

  const saveTheme = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: themeName,
          description: themeDescription,
          colors: customColors,
          isPublic,
        }),
      })

      if (!response.ok) throw new Error('Failed to save theme')

      await response.json()
      toast({
        title: 'Theme Saved',
        description: 'Your custom theme has been saved successfully',
      })
    } catch (error) {
      console.error('Error saving theme:', error)
      toast({
        title: 'Error',
        description: 'Failed to save theme',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <ThemePresets onSelect={handlePresetSelect} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Customize Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(customColors).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="capitalize">
                {key}
              </Label>
              <div className="flex gap-2">
                <Input
                  id={key}
                  type="color"
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleColorChange(key as keyof CustomColors, e.target.value)
                  }
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleColorChange(key as keyof CustomColors, e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={applyCustomTheme} className="flex-1">
          Apply Theme
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              Save Theme
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Custom Theme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="themeName">Theme Name</Label>
                <Input
                  id="themeName"
                  value={themeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThemeName(e.target.value)}
                  placeholder="Enter theme name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeDescription">Description</Label>
                <Textarea
                  id="themeDescription"
                  value={themeDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setThemeDescription(e.target.value)}
                  placeholder="Enter theme description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="isPublic">Make Public</Label>
              </div>
              <Button
                onClick={saveTheme}
                disabled={isSaving || !themeName}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Theme'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SavedThemes />
    </div>
  )
} 