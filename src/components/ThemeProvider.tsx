"use client";

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme, loadUserTheme, syncThemeWithBackend } from '@/store/useTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  // Load user theme from backend when session changes
  useEffect(() => {
    if (session?.user) {
      loadUserTheme().then(setTheme)
    }
  }, [session, setTheme])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    
    // Remove previous theme classes
    const themeClasses = ['light', 'dark', 'sepia', 'high-contrast', 'rider', 'driver', 'owner']
    document.documentElement.classList.remove(...themeClasses)
    
    // Add current theme class
    document.documentElement.classList.add(theme)

    // Sync with backend if user is logged in
    if (session?.user) {
      syncThemeWithBackend(theme).catch(console.error)
    }
  }, [theme, session])

  return <>{children}</>
} 