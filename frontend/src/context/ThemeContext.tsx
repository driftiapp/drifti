'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useThemeStore } from '@/store/useTheme'
import { AccentColor, FontSize, Spacing, BorderRadius } from '@/lib/theme'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
  fontSize: FontSize
  setFontSize: (fontSize: FontSize) => void
  spacing: Spacing
  setSpacing: (spacing: Spacing) => void
  borderRadius: BorderRadius
  setBorderRadius: (borderRadius: BorderRadius) => void
  syncTheme: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const {
    theme,
    setTheme,
    accent,
    setAccent,
    fontSize,
    setFontSize,
    spacing,
    setSpacing,
    borderRadius,
    setBorderRadius,
    syncThemeWithBackend,
  } = useThemeStore()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const syncTheme = async () => {
    await syncThemeWithBackend({
      theme,
      accent,
      fontSize,
      spacing,
      borderRadius,
    })
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accent,
        setAccent,
        fontSize,
        setFontSize,
        spacing,
        setSpacing,
        borderRadius,
        setBorderRadius,
        syncTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
} 