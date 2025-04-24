'use client'

import { useTheme } from '../../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChromePicker, ColorResult } from 'react-color'
import dynamic from 'next/dynamic'
import { ThemeShare } from './ThemeShare'
import { applyThemeColors } from "@/lib/theme-utils"

const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false
})

interface CustomTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    border: string
  }
}

export function ThemeEditor() {
  const { setTheme } = useTheme()
  const [customTheme, setCustomTheme] = useState<CustomTheme>({
    name: 'My Theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  })
  const [activeColor, setActiveColor] = useState<keyof CustomTheme['colors'] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Apply theme preview
  useEffect(() => {
    if (isPreviewMode) {
      document.documentElement.style.setProperty('--primary', customTheme.colors.primary)
      document.documentElement.style.setProperty('--secondary', customTheme.colors.secondary)
      document.documentElement.style.setProperty('--background', customTheme.colors.background)
      document.documentElement.style.setProperty('--text', customTheme.colors.text)
      document.documentElement.style.setProperty('--border', customTheme.colors.border)
    }
    return () => {
      if (isPreviewMode) {
        document.documentElement.style.removeProperty('--primary')
        document.documentElement.style.removeProperty('--secondary')
        document.documentElement.style.removeProperty('--background')
        document.documentElement.style.removeProperty('--text')
        document.documentElement.style.removeProperty('--border')
      }
    }
  }, [customTheme, isPreviewMode])

  const handleColorChange = (color: ColorResult) => {
    if (activeColor) {
      setCustomTheme(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          [activeColor]: color.hex,
        },
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/custom-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customTheme),
      })

      if (!response.ok) throw new Error('Failed to save theme')

      // Apply the theme using our utility
      applyThemeColors(customTheme.colors)
      setTheme('custom')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    } catch (error) {
      console.error('Error saving theme:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Color Picker Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label htmlFor="theme-name" className="block text-sm font-medium mb-2">Theme Name</label>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${isPreviewMode
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--background)] text-[var(--text)] border border-[var(--border)]'
              }`}
          >
            {isPreviewMode ? 'Exit Preview' : 'Preview Theme'}
          </button>
        </div>

        <input
          id="theme-name"
          type="text"
          value={customTheme.name}
          onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
          placeholder="Enter theme name"
          aria-label="Theme name"
        />

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(customTheme.colors).map(([key, value]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <label htmlFor={`color-${key}`} className="block text-sm font-medium mb-2 capitalize">{key}</label>
              <button
                id={`color-${key}`}
                onClick={() => setActiveColor(key as keyof CustomTheme['colors'])}
                className="w-full h-10 rounded-lg border border-[var(--border)] transition-transform"
                style={{ backgroundColor: value }}
                aria-label={`Select ${key} color`}
              />
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeColor && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50"
            >
              <ChromePicker
                color={customTheme.colors[activeColor]}
                onChange={handleColorChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
          aria-label="Save theme"
        >
          {isSaving ? 'Saving...' : 'Save Theme'}
        </motion.button>

        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none"
            >
              <ReactConfetti
                width={typeof window !== 'undefined' ? window.innerWidth : 0}
                height={typeof window !== 'undefined' ? window.innerHeight : 0}
                recycle={false}
                numberOfPieces={500}
                gravity={0.3}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Preview Section */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-medium">Live Preview</h3>
        <motion.div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: customTheme.colors.background,
            color: customTheme.colors.text,
            borderColor: customTheme.colors.border,
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: customTheme.colors.primary }}
                />
                <div>
                  <div className="font-medium">Sample App</div>
                  <div className="text-sm opacity-70">Theme Preview</div>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: customTheme.colors.primary,
                  color: customTheme.colors.background,
                }}
                aria-label="Sample action button"
              >
                Action
              </button>
            </div>

            <div
              className="p-4 rounded-lg mb-4"
              style={{
                backgroundColor: customTheme.colors.secondary,
                color: customTheme.colors.text,
              }}
            >
              <div className="font-medium mb-2">Sample Card</div>
              <div className="text-sm opacity-70">
                This is how your app will look with your custom theme.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: customTheme.colors.primary,
                  color: customTheme.colors.background,
                }}
                aria-label="Sample primary button"
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: customTheme.colors.border,
                  color: customTheme.colors.text,
                }}
                aria-label="Sample secondary button"
              >
                Secondary Button
              </button>
            </div>
          </div>
        </motion.div>

        <ThemeShare theme={customTheme} />
      </motion.div>
    </div>
  )
} 