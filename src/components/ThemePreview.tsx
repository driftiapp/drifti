'use client'

import { useTheme } from '@/context/ThemeContext'
import { motion } from 'framer-motion'
import { ColorSwatch } from "@/components/ui/color-swatch"
import styles from '@/styles/theme.module.css'
import { cn } from '@/lib/utils'

interface ThemePreviewProps {
  theme: keyof typeof themePreviews
  onSelect?: () => void
  isSelected?: boolean
}

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

export function ThemePreview({ theme, onSelect, isSelected }: ThemePreviewProps) {
  const { setTheme } = useTheme()
  const preview = themePreviews[theme]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-lg border transition-all ${isSelected
        ? 'ring-2 ring-[var(--primary)] ring-offset-2'
        : 'border-[var(--border)] hover:border-[var(--primary)]'
        }`}
      onClick={() => {
        setTheme(theme)
        onSelect?.()
      }}
      role="button"
      tabIndex={0}
      aria-label={`Preview ${preview.name} theme`}
    >
      <div
        className={cn(
          "p-4",
          styles.themePreview
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full",
                styles.themeAvatar
              )}
              style={{ backgroundColor: preview.colors[3] }}
            />
            <div>
              <div className="font-medium">Sample App</div>
              <div className="text-sm opacity-70">Theme Preview</div>
            </div>
          </div>
          <div
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              styles.themeButton
            )}
            style={{
              backgroundColor: preview.colors[3],
              color: preview.colors[0],
            }}
          >
            Action
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg p-4",
            styles.themeCard
          )}
        >
          <div className="mb-2 font-medium">Sample Card</div>
          <div className="text-sm opacity-70">
            This is how your app will look with the {preview.name} theme.
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {preview.colors.map((color, i) => (
              <ColorSwatch
                key={i}
                color={color}
                size="sm"
              />
            ))}
          </div>
          <div className="text-sm font-medium">{preview.name}</div>
        </div>
      </div>
    </motion.div>
  )
} 