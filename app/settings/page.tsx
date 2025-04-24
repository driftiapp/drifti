'use client'

import { ThemePreview } from '@/components/ThemePreview'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { ThemeEditor } from '@/components/ThemeEditor'
import { useTheme } from '../../context/ThemeContext'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function SettingsPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset')

  return (
    <div className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-8 text-3xl font-bold">Settings</h1>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Theme</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('preset')}
                className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'preset'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background)] text-[var(--text)] hover:bg-[var(--primary)]/10'
                  }`}
              >
                Preset Themes
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'custom'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background)] text-[var(--text)] hover:bg-[var(--primary)]/10'
                  }`}
              >
                Custom Theme
              </button>
            </div>
          </div>

          {activeTab === 'preset' ? (
            <>
              <div className="mb-6">
                <ThemeSwitcher />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(themePreviews).map((themeKey) => (
                  <ThemePreview
                    key={themeKey}
                    theme={themeKey as keyof typeof themePreviews}
                    isSelected={theme === themeKey}
                  />
                ))}
              </div>
            </>
          ) : (
            <ThemeEditor />
          )}
        </div>
      </motion.div>
    </div>
  )
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