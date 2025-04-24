'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system' | 'sepia' | 'high-contrast' | 'rider' | 'driver' | 'owner'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: Theme
  toggleTheme: () => void
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme-storage')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme).state.theme as Theme
        return parsed
      } catch {
        return 'system'
      }
    }
    return 'system'
  }
  return 'system'
}

const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const THEME_MAP: Record<Theme, string> = {
  light: 'light',
  dark: 'dark',
  system: getSystemTheme(),
  sepia: 'sepia',
  'high-contrast': 'high-contrast',
  rider: 'rider',
  driver: 'driver',
  owner: 'owner',
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      resolvedTheme: getSystemTheme(),
      setTheme: async (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        set({ theme, resolvedTheme: resolved })

        // Update DOM
        document.documentElement.classList.remove(...Object.values(THEME_MAP))
        document.documentElement.classList.add(THEME_MAP[resolved])
      },
      toggleTheme: () => {
        const current = get().resolvedTheme
        const next = current === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useTheme() {
  const { theme, setTheme, toggleTheme, resolvedTheme } = useThemeStore()

  return {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme,
  }
}

export async function syncThemeWithUserSettings(theme: Theme) {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme }),
    })

    if (!response.ok) {
      throw new Error('Failed to sync theme with user settings')
    }
  } catch (error) {
    console.warn('Failed to sync theme with user settings:', error)
  }
} 