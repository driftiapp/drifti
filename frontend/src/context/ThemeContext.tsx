'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTheme as useThemeStore } from '../store/useTheme'

type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast' | 'rider' | 'driver' | 'owner' | 'solarized' | 'neon' | 'pastel' | 'system' | 'custom'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themeColors = {
  light: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    background: '#1f2937',
    text: '#f3f4f6',
    border: '#374151',
  },
  sepia: {
    primary: '#8b5a2b',
    secondary: '#a67c52',
    background: '#f4ecd8',
    text: '#5c3a21',
    border: '#d9c7a7',
  },
  'high-contrast': {
    primary: '#ffff00',
    secondary: '#00ffff',
    background: '#000000',
    text: '#ffffff',
    border: '#ffffff',
  },
  rider: {
    primary: '#4f46e5',
    secondary: '#818cf8',
    background: '#f8fafc',
    text: '#1e293b',
    border: '#e2e8f0',
  },
  driver: {
    primary: '#059669',
    secondary: '#10b981',
    background: '#f0fdf4',
    text: '#064e3b',
    border: '#d1fae5',
  },
  owner: {
    primary: '#7c3aed',
    secondary: '#a78bfa',
    background: '#faf5ff',
    text: '#4c1d95',
    border: '#e9d5ff',
  },
  solarized: {
    primary: '#268bd2',
    secondary: '#2aa198',
    background: '#fdf6e3',
    text: '#586e75',
    border: '#eee8d5',
  },
  neon: {
    primary: '#00ff00',
    secondary: '#ff00ff',
    background: '#000000',
    text: '#ffffff',
    border: '#00ff00',
  },
  pastel: {
    primary: '#a5b4fc',
    secondary: '#c4b5fd',
    background: '#fafafa',
    text: '#4b5563',
    border: '#e5e7eb',
  },
  system: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: 'var(--background)',
    text: 'var(--text)',
    border: 'var(--border)',
  },
  custom: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, toggleTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = window.document.documentElement
    root.classList.remove('light', 'dark', 'sepia', 'high-contrast', 'rider', 'driver', 'owner', 'solarized', 'neon', 'pastel', 'system', 'custom')
    root.classList.add(theme)

    // Set CSS variables for theme colors
    const colors = themeColors[theme]
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
  }, [theme])

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 