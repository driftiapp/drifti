'use client'

import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

const themePreviews = {
  light: {
    name: 'Light',
    description: 'Clean and bright',
    colors: ['#ffffff', '#f3f4f6', '#1f2937', '#3b82f6'],
  },
  dark: {
    name: 'Dark',
    description: 'Easy on the eyes',
    colors: ['#1f2937', '#374151', '#f3f4f6', '#60a5fa'],
  },
  sepia: {
    name: 'Sepia',
    description: 'Warm and cozy',
    colors: ['#f4ecd8', '#d9c7a7', '#5c3a21', '#8b5a2b'],
  },
  'high-contrast': {
    name: 'High Contrast',
    description: 'Maximum readability',
    colors: ['#000000', '#ffffff', '#ffff00', '#00ffff'],
  },
  rider: {
    name: 'Rider',
    description: 'For passengers',
    colors: ['#f8fafc', '#e2e8f0', '#1e293b', '#4f46e5'],
  },
  driver: {
    name: 'Driver',
    description: 'For drivers',
    colors: ['#f0fdf4', '#d1fae5', '#064e3b', '#059669'],
  },
  owner: {
    name: 'Owner',
    description: 'For business owners',
    colors: ['#faf5ff', '#e9d5ff', '#4c1d95', '#7c3aed'],
  },
  solarized: {
    name: 'Solarized',
    description: 'Programmer friendly',
    colors: ['#fdf6e3', '#eee8d5', '#586e75', '#268bd2'],
  },
  neon: {
    name: 'Neon',
    description: 'Vibrant and bold',
    colors: ['#000000', '#00ff00', '#ffffff', '#ff00ff'],
  },
  pastel: {
    name: 'Pastel',
    description: 'Soft and gentle',
    colors: ['#fafafa', '#e5e7eb', '#4b5563', '#a5b4fc'],
  },
  system: {
    name: 'System',
    description: 'Follows your OS',
    colors: ['#ffffff', '#e5e7eb', '#1f2937', '#3b82f6'],
  },
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<keyof typeof themePreviews | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    const themes = Object.keys(themePreviews) as Array<keyof typeof themePreviews>
    const currentIndex = themes.indexOf(theme as keyof typeof themePreviews)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setPreviewTheme(themes[(currentIndex + 1) % themes.length])
        break
      case 'ArrowUp':
        e.preventDefault()
        setPreviewTheme(themes[(currentIndex - 1 + themes.length) % themes.length])
        break
      case 'Enter':
        e.preventDefault()
        if (previewTheme) {
          setTheme(previewTheme)
          setIsOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setPreviewTheme(null)
        break
    }
  }, [isOpen, previewTheme, setTheme, theme])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!isOpen) {
      setPreviewTheme(null)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--primary)]/10 transition-colors"
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: `var(--primary)` }} />
        <span>{themePreviews[theme as keyof typeof themePreviews].name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg p-2 z-50"
            role="listbox"
            aria-label="Theme options"
          >
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(themePreviews).map(([key, preview]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key as keyof typeof themePreviews)
                    setIsOpen(false)
                  }}
                  onMouseEnter={() => setPreviewTheme(key as keyof typeof themePreviews)}
                  className={`p-2 rounded-lg text-left transition-colors ${
                    theme === key
                      ? 'bg-[var(--primary)] text-white'
                      : 'hover:bg-[var(--primary)]/10'
                  }`}
                  role="option"
                  aria-selected={theme === key}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{preview.name}</div>
                      <div className="text-sm opacity-70">{preview.description}</div>
                    </div>
                    <div className="flex gap-1">
                      {preview.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 