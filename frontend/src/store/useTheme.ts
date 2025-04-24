"use client";

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Theme, AccentColor, FontSize, Spacing, BorderRadius } from '@/lib/theme'
import themeConfig from '@/lib/theme-config.json'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
  fontSize: FontSize
  setFontSize: (fontSize: FontSize) => void
  spacing: Spacing
  setSpacing: (spacing: Spacing) => void
  borderRadius: BorderRadius
  setBorderRadius: (borderRadius: BorderRadius) => void
  loadUserTheme: () => Promise<void>
  syncThemeWithBackend: (config: {
    theme: Theme
    accent: AccentColor
    fontSize: FontSize
    spacing: Spacing
    borderRadius: BorderRadius
  }) => Promise<void>
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: themeConfig.theme.default as Theme,
      setTheme: (theme) => set({ theme }),
      accent: themeConfig.accent.default as AccentColor,
      setAccent: (accent) => set({ accent }),
      fontSize: themeConfig.fontSize.default as FontSize,
      setFontSize: (fontSize) => set({ fontSize }),
      spacing: themeConfig.spacing.default as Spacing,
      setSpacing: (spacing) => set({ spacing }),
      borderRadius: themeConfig.borderRadius.default as BorderRadius,
      setBorderRadius: (borderRadius) => set({ borderRadius }),
      loadUserTheme: async () => {
        try {
          const response = await fetch('/api/user/theme')
          const data = await response.json()
          set({
            theme: data.theme || themeConfig.theme.default,
            accent: data.accent || themeConfig.accent.default,
            fontSize: data.fontSize || themeConfig.fontSize.default,
            spacing: data.spacing || themeConfig.spacing.default,
            borderRadius: data.borderRadius || themeConfig.borderRadius.default
          })
        } catch (error) {
          console.error('Failed to load user theme:', error)
        }
      },
      syncThemeWithBackend: async (config) => {
        try {
          await fetch('/api/user/theme', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
          })
        } catch (error) {
          console.error('Failed to sync theme with backend:', error)
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Function to sync theme with backend
export async function syncThemeWithBackend(config: {
  theme: Theme
  accent: AccentColor
  fontSize: FontSize
  spacing: Spacing
  borderRadius: BorderRadius
}) {
  try {
    const response = await fetch('/api/user/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error('Failed to sync theme')
    }

    return await response.json()
  } catch (error) {
    console.error('Error syncing theme:', error)
    throw error
  }
}

// Function to load user theme from backend
export async function loadUserTheme() {
  try {
    const response = await fetch('/api/user/theme')
    if (!response.ok) {
      throw new Error('Failed to load theme')
    }

    const data = await response.json()
    return {
      theme: data.theme as Theme || themeConfig.theme.default,
      accent: data.accent as AccentColor || themeConfig.accent.default,
      fontSize: data.fontSize as FontSize || themeConfig.fontSize.default,
      spacing: data.spacing as Spacing || themeConfig.spacing.default,
      borderRadius: data.borderRadius as BorderRadius || themeConfig.borderRadius.default
    }
  } catch (error) {
    console.error('Error loading theme:', error)
    return {
      theme: themeConfig.theme.default as Theme,
      accent: themeConfig.accent.default as AccentColor,
      fontSize: themeConfig.fontSize.default as FontSize,
      spacing: themeConfig.spacing.default as Spacing,
      borderRadius: themeConfig.borderRadius.default as BorderRadius
    }
  }
} 