"use client";

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast' | 'rider' | 'driver' | 'owner' | 'solarized' | 'neon' | 'pastel' | 'system' | 'custom'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () => set((state: ThemeState) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Function to sync theme with backend
export async function syncThemeWithBackend(theme: Theme) {
  try {
    const response = await fetch('/api/user/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
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
    return data.theme as Theme
  } catch (error) {
    console.error('Error loading theme:', error)
    return 'light' as Theme
  }
} 